/**
 * Local ingest: copy a capture image into the Obsidian vault and generate an
 * analysis draft with a real LLM. Human-run only (no watcher/CI).
 *
 * Usage:
 *   npm run ingest -- <image> [more images...] [flags]
 * Flags:
 *   --service "<name>"       서비스/제품명
 *   --source  "<url>"        출처 URL
 *   --slug    "<slug>"       slug 강제 지정 (단일 이미지에만)
 *   --captured-at YYYY-MM-DD 촬영일 (기본: 오늘)
 *   --app-version "<ver>"    앱 버전
 *   --dry-run                파일을 쓰지 않고 생성될 내용만 출력
 *
 * Secrets: LLM key is read from env only, never from the browser.
 *   OPENAI_API_KEY   (필수)  API 키
 *   OPENAI_BASE_URL  (선택)  기본 https://api.openai.com/v1
 *   INGEST_MODEL     (선택)  기본 gpt-4o-mini (vision 지원 모델)
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import {
  COPY_TONES,
  MOTION_EXTENSIONS,
  PLATFORMS,
  SCREEN_TYPES,
  STILL_EXTENSIONS,
  TAGS,
  TONES,
  UI_PATTERNS,
  isInList,
  normalizeTag,
  type CopyTone,
  type Platform,
  type ScreenType,
  type Tag,
  type Tone,
  type UiPattern,
} from "../src/shared/vocabulary.ts";

type Args = {
  images: string[];
  service: string | null;
  source: string | null;
  slug: string | null;
  capturedAt: string;
  appVersion: string | null;
  dryRun: boolean;
};

type LlmAnalysis = {
  title: string;
  service: string | null;
  platform: Platform;
  screenType: ScreenType;
  uiPatterns: UiPattern[];
  tone: Tone;
  copyTone: CopyTone;
  tags: Tag[];
  insight: string;
  layout: string;
  color: string;
  typography: string;
  interaction: string;
};

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const UNSURE = "사용자 확인 필요 — LLM이 확신하지 못했거나 정지 캡처라 확인이 필요함";

function loadDotEnv(): void {
  if (!existsSync(".env")) return;
  const text = readFileSync(".env", "utf8").replace(/\r\n/g, "\n");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv: string[]): Args {
  const images: string[] = [];
  const args: Args = {
    images,
    service: null,
    source: null,
    slug: null,
    capturedAt: new Date().toISOString().slice(0, 10),
    appVersion: null,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case "--service":
        args.service = argv[++i] ?? null;
        break;
      case "--source":
        args.source = argv[++i] ?? null;
        break;
      case "--slug":
        args.slug = argv[++i] ?? null;
        break;
      case "--captured-at":
        args.capturedAt = argv[++i] ?? args.capturedAt;
        break;
      case "--app-version":
        args.appVersion = argv[++i] ?? null;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown flag: ${arg}`);
          process.exit(2);
        }
        images.push(arg);
    }
  }
  return args;
}

function slugify(name: string): string {
  const base = name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || "capture";
}

function coerceEnum<T extends string>(
  raw: unknown,
  list: readonly T[],
  fallback: T,
  coercions: string[],
  label: string,
): T {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (isInList(list, value)) return value;
  coercions.push(`${label}: "${String(raw)}" → 어휘에 없어 "${fallback}"로 대체`);
  return fallback;
}

function coercePatterns(raw: unknown, coercions: string[]): UiPattern[] {
  const out: UiPattern[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const value = typeof item === "string" ? item.trim().toLowerCase() : "";
      if (isInList(UI_PATTERNS, value)) {
        if (!out.includes(value)) out.push(value);
      } else if (value) {
        coercions.push(`uiPatterns: "${String(item)}" → 미등록 패턴이라 제외`);
      }
    }
  }
  if (out.length === 0) {
    coercions.push('uiPatterns: 유효 값 없음 → "card-grid"로 대체');
    out.push("card-grid");
  }
  return out.slice(0, 4);
}

function coerceTags(raw: unknown, coercions: string[]): Tag[] {
  const out: Tag[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "string") continue;
      const { canonical } = normalizeTag(item);
      if (canonical && isInList(TAGS, canonical)) {
        if (!out.includes(canonical)) out.push(canonical);
      } else if (item.trim()) {
        coercions.push(`tags: "${item}" → 통제 어휘에 없어 제외`);
      }
    }
  }
  if (out.length === 0) {
    coercions.push('tags: 유효 값 없음 → "cards"로 대체');
    out.push("cards");
  }
  return out.slice(0, 4);
}

function buildPrompt(): string {
  return [
    "너는 UI 스크린샷을 분석하는 디자인 분석가다. 첨부 이미지를 관찰해 JSON만 반환한다.",
    "규칙:",
    "- 픽셀 치수, 파일 크기, 해시 같은 파생 값은 절대 쓰지 않는다.",
    "- 확신할 수 없는 관찰은 지어내지 말고 본문 텍스트에 '미확정' 또는 '사용자 확인 필요'와 이유를 쓴다.",
    "- 글꼴은 이미지만으로 확정하지 말고 확실치 않으면 'Typeface: 미확정'으로 둔다.",
    "- 아래 통제 어휘 값만 사용한다. 목록에 없는 값은 쓰지 않는다.",
    `- platform: ${PLATFORMS.join(", ")}`,
    `- screenType: ${SCREEN_TYPES.join(", ")}`,
    `- uiPatterns (1~4개): ${UI_PATTERNS.join(", ")}`,
    `- tone: ${TONES.join(", ")}`,
    `- copyTone: ${COPY_TONES.join(", ")}`,
    `- tags (1~4개): ${TAGS.join(", ")}`,
    "본문(layout/color/typography/interaction)과 title, insight는 한국어로 쓴다.",
    "반환 JSON 스키마:",
    "{",
    '  "title": string,',
    '  "service": string | null,',
    '  "platform": string,',
    '  "screenType": string,',
    '  "uiPatterns": string[],',
    '  "tone": string,',
    '  "copyTone": string,',
    '  "tags": string[],',
    '  "insight": string,',
    '  "layout": string,',
    '  "color": string,',
    '  "typography": string,',
    '  "interaction": string',
    "}",
  ].join("\n");
}

async function analyzeWithLlm(
  imagePath: string,
  ext: string,
): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY가 없습니다. 환경변수나 .env에 키를 설정하세요.",
    );
  }
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.INGEST_MODEL ?? "gpt-4o-mini";
  const mime = MIME[ext] ?? "image/png";
  const dataUrl = `data:${mime};base64,${readFileSync(imagePath).toString("base64")}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildPrompt() },
        {
          role: "user",
          content: [
            { type: "text", text: "이 캡처를 분석해 JSON으로만 답해줘." },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LLM 요청 실패 HTTP ${response.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("LLM 응답에 content가 없습니다.");
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error(`LLM JSON 파싱 실패: ${content.slice(0, 300)}`);
  }
}

function toAnalysis(
  raw: Record<string, unknown>,
  fallbackTitle: string,
  coercions: string[],
): LlmAnalysis {
  const str = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim() ? value.trim() : fallback;

  return {
    title: str(raw.title, fallbackTitle),
    service:
      typeof raw.service === "string" && raw.service.trim()
        ? raw.service.trim()
        : null,
    platform: coerceEnum(raw.platform, PLATFORMS, "web", coercions, "platform"),
    screenType: coerceEnum(
      raw.screenType,
      SCREEN_TYPES,
      "detail",
      coercions,
      "screenType",
    ),
    uiPatterns: coercePatterns(raw.uiPatterns, coercions),
    tone: coerceEnum(raw.tone, TONES, "informational", coercions, "tone"),
    copyTone: coerceEnum(raw.copyTone, COPY_TONES, "neutral", coercions, "copyTone"),
    tags: coerceTags(raw.tags, coercions),
    insight: str(raw.insight, UNSURE),
    layout: str(raw.layout, UNSURE),
    color: str(raw.color, UNSURE),
    typography: str(raw.typography, "Typeface: 미확정"),
    interaction: str(raw.interaction, UNSURE),
  };
}

function motionPlaceholder(fallbackTitle: string): LlmAnalysis {
  return {
    title: fallbackTitle,
    service: null,
    platform: "web",
    screenType: "detail",
    uiPatterns: ["card-grid"],
    tone: "informational",
    copyTone: "neutral",
    tags: ["motion"],
    insight: UNSURE,
    layout: UNSURE,
    color: UNSURE,
    typography: "Typeface: 미확정",
    interaction: "모션 캡처 — 프레임별 상태 변화는 사람이 확인해 작성해야 함",
  };
}

function yamlList(items: string[]): string {
  return items.map((item) => `  - ${item}`).join("\n");
}

function buildMarkdown(
  slug: string,
  assetName: string,
  args: Args,
  a: LlmAnalysis,
  coercions: string[],
): string {
  const service = args.service ?? a.service ?? "미확정";
  const optional = [
    args.source ? `sourceUrl: ${args.source}` : null,
    args.appVersion ? `appVersion: ${JSON.stringify(args.appVersion)}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const review =
    coercions.length > 0
      ? `\n## 검토 필요 (자동 보정됨)\n\n${coercions.map((c) => `- ${c}`).join("\n")}\n`
      : "";

  return `---
slug: ${slug}
title: ${JSON.stringify(a.title)}
asset: ${assetName}
visibility: internal
capturedAt: ${args.capturedAt}
${optional ? `${optional}\n` : ""}service: ${JSON.stringify(service)}
platform: ${a.platform}
screenType: ${a.screenType}
uiPatterns:
${yamlList(a.uiPatterns)}
tone: ${a.tone}
copyTone: ${a.copyTone}
tags:
${yamlList(a.tags)}
insight: ${JSON.stringify(a.insight)}
---

## Layout

${a.layout}

## Color

${a.color}

## Typography

${a.typography}

## Interaction

${a.interaction}
${review}`;
}

function appendLog(title: string, date: string): void {
  const path = "obsidian/wiki/log.md";
  if (!existsSync(path)) return;
  const log = readFileSync(path, "utf8").replace(/\r\n/g, "\n");
  const entry = `## [${date}] ingest | ${title}\n\n로컬 ingest 스크립트로 캡처를 vault에 저장하고 LLM 분석 초안을 생성했다. 사람이 검토·보정해야 한다.\n\n`;
  const marker = log.indexOf("\n## [");
  const next =
    marker >= 0
      ? `${log.slice(0, marker + 1)}${entry}${log.slice(marker + 1)}`
      : `${log.replace(/\n*$/, "\n")}\n${entry}`;
  writeFileSync(path, next);
}

async function ingestOne(imagePath: string, args: Args): Promise<void> {
  if (!existsSync(imagePath)) {
    throw new Error(`이미지를 찾을 수 없음: ${imagePath}`);
  }
  const ext = extname(imagePath).toLowerCase();
  const isStill = STILL_EXTENSIONS.has(ext);
  const isMotion = MOTION_EXTENSIONS.has(ext);
  if (!isStill && !isMotion) {
    throw new Error(`지원하지 않는 포맷: ${ext} (${imagePath})`);
  }

  const slug = args.slug ?? slugify(basename(imagePath));
  const dir = join("obsidian/captures", slug);
  if (existsSync(dir)) {
    throw new Error(
      `이미 존재하는 slug: ${slug} (${dir}). --slug로 다른 이름을 지정하세요.`,
    );
  }

  const assetName = `capture${ext}`;
  const fallbackTitle = basename(imagePath)
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim() || slug;

  const coercions: string[] = [];
  let analysis: LlmAnalysis;
  if (isMotion) {
    console.log(`  motion 캡처 — LLM 이미지 분석을 건너뜁니다. 사람이 분석 본문을 채워야 합니다.`);
    analysis = motionPlaceholder(fallbackTitle);
  } else {
    console.log(`  LLM 분석 중… (${imagePath})`);
    const raw = await analyzeWithLlm(imagePath, ext);
    analysis = toAnalysis(raw, fallbackTitle, coercions);
  }

  const markdown = buildMarkdown(slug, assetName, args, analysis, coercions);

  if (args.dryRun) {
    console.log(`\n----- ${dir}/index.md (dry-run) -----\n${markdown}`);
    return;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, assetName), readFileSync(imagePath));
  writeFileSync(join(dir, "index.md"), markdown);
  appendLog(analysis.title, args.capturedAt);

  console.log(`  wrote ${dir}/ (asset + index.md)`);
  if (coercions.length > 0) {
    console.log(`  보정 ${coercions.length}건 — index.md의 "검토 필요" 섹션 확인`);
  }
}

async function main(): Promise<void> {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  if (args.images.length === 0) {
    console.error("사용법: npm run ingest -- <image> [more images...] [flags]");
    process.exit(2);
  }
  if (args.slug && args.images.length > 1) {
    console.error("--slug는 이미지가 1개일 때만 사용할 수 있습니다.");
    process.exit(2);
  }

  let ok = 0;
  const failures: string[] = [];
  for (const image of args.images) {
    console.log(`ingest: ${image}`);
    try {
      await ingestOne(image, args);
      ok += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${image}: ${message}`);
      console.error(`  FAIL ${message}`);
    }
  }

  console.log(`\ningested ${ok}/${args.images.length}`);
  if (failures.length > 0) {
    console.error(`failures:\n${failures.map((f) => `  - ${f}`).join("\n")}`);
  }
  if (!args.dryRun && ok > 0) {
    console.log(
      "다음 단계: index.md 검토·보정 → npm run validate → npm run build -- --target=internal",
    );
  }
  if (failures.length > 0) process.exit(1);
}

void main();
