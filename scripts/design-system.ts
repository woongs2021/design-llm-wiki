/**
 * Generate a design-system draft from selected vault captures.
 *
 * Usage:
 *   npm run design-system -- --name filters --slugs naver-shopping-gallery airbnb-mobile-search
 *
 * Secrets:
 *   OPENAI_API_KEY          required unless --no-llm
 *   OPENAI_BASE_URL         optional, default https://api.openai.com/v1
 *   DESIGN_SYSTEM_MODEL     optional, falls back to INGEST_MODEL, then gpt-4o-mini
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadVault, WIKI_LOG_PATH, type LoadedCapture } from "./lib/vault.ts";

type Args = {
  name: string;
  slugs: string[];
  dryRun: boolean;
  noLlm: boolean;
};

type TokenDraft = {
  name: string;
  value: string;
  rationale: string;
  sources: string[];
};

type ComponentDraft = {
  name: string;
  usage: string;
  sources: string[];
};

type DesignSystemDraft = {
  title: string;
  summary: string;
  principles: string[];
  colorTokens: TokenDraft[];
  typographyTokens: TokenDraft[];
  spacingTokens: TokenDraft[];
  components: ComponentDraft[];
  brandImageGuidelines: string[];
  unresolved: string[];
};

const DEFAULT_DRAFT: DesignSystemDraft = {
  title: "Design System",
  summary: "선택한 캡처 분석 결과를 바탕으로 생성한 디자인 시스템 초안입니다.",
  principles: [],
  colorTokens: [],
  typographyTokens: [],
  spacingTokens: [],
  components: [],
  brandImageGuidelines: [],
  unresolved: [],
};

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
  const args: Args = {
    name: "",
    slugs: [],
    dryRun: false,
    noLlm: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    switch (arg) {
      case "--name":
        args.name = argv[++i] ?? "";
        break;
      case "--slugs":
        while (argv[i + 1] && !argv[i + 1]!.startsWith("--")) {
          args.slugs.push(argv[++i]!);
        }
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--no-llm":
        args.noLlm = true;
        break;
      default:
        if (arg.startsWith("--")) {
          console.error(`Unknown flag: ${arg}`);
          process.exit(2);
        }
        args.slugs.push(arg);
    }
  }

  args.slugs = args.slugs
    .flatMap((slug) => slug.split(","))
    .map((slug) => slug.trim())
    .filter(Boolean);
  return args;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "design-system";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function captureSummary(captures: LoadedCapture[]): string {
  return captures
    .map((item) => {
      const c = item.capture;
      return [
        `slug: ${c.slug}`,
        `title: ${c.title}`,
        `service: ${c.service}`,
        `platform: ${c.platform}`,
        `screenType: ${c.screenType}`,
        `uiPatterns: ${c.uiPatterns.join(", ")}`,
        `tone: ${c.tone}`,
        `copyTone: ${c.copyTone}`,
        `tags: ${c.tags.join(", ")}`,
        `insight: ${c.insight}`,
        `body:\n${item.body.trim()}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function buildPrompt(captures: LoadedCapture[]): string {
  return [
    "너는 캡처 분석 기록을 근거로 제품 디자인 시스템 초안을 만드는 디자인 시스템 리드다.",
    "반환은 JSON만 한다. Markdown을 JSON 문자열 안에 넣지 않는다.",
    "규칙:",
    "- 입력 캡처에 근거가 있는 내용만 일반화한다.",
    "- 관찰에 없는 브랜드 가치, 로고, 폰트명, 정확한 토큰값은 지어내지 않고 unresolved에 남긴다.",
    "- generated document는 시스템 design.md가 아니라 별도 design-system.md로 쓰일 문서다.",
    "- 이후 마케팅/브랜딩 이미지 생성 기준으로 쓸 수 있게 이미지 가이드라인을 포함한다.",
    "- 모든 설명은 한국어로 쓴다.",
    "JSON 스키마:",
    "{",
    '  "title": string,',
    '  "summary": string,',
    '  "principles": string[],',
    '  "colorTokens": [{"name": string, "value": string, "rationale": string, "sources": string[]}],',
    '  "typographyTokens": [{"name": string, "value": string, "rationale": string, "sources": string[]}],',
    '  "spacingTokens": [{"name": string, "value": string, "rationale": string, "sources": string[]}],',
    '  "components": [{"name": string, "usage": string, "sources": string[]}],',
    '  "brandImageGuidelines": string[],',
    '  "unresolved": string[]',
    "}",
    "",
    `캡처 ${captures.length}건:`,
    captureSummary(captures),
  ].join("\n");
}

async function callLlm(captures: LoadedCapture[]): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 없습니다. 환경변수나 .env에 키를 설정하세요.");
  }
  const baseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.DESIGN_SYSTEM_MODEL ?? process.env.INGEST_MODEL ?? "gpt-4o-mini";
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
        {
          role: "user",
          content: buildPrompt(captures),
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
  return JSON.parse(content) as Record<string, unknown>;
}

function asStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function asTokens(value: unknown): TokenDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        name: String(record.name ?? "").trim(),
        value: String(record.value ?? "").trim(),
        rationale: String(record.rationale ?? "").trim(),
        sources: asStrings(record.sources),
      };
    })
    .filter((item): item is TokenDraft => Boolean(item?.name && item.value && item.rationale));
}

function asComponents(value: unknown): ComponentDraft[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      return {
        name: String(record.name ?? "").trim(),
        usage: String(record.usage ?? "").trim(),
        sources: asStrings(record.sources),
      };
    })
    .filter((item): item is ComponentDraft => Boolean(item?.name && item.usage));
}

function toDraft(raw: Record<string, unknown>, fallbackTitle: string): DesignSystemDraft {
  const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : fallbackTitle;
  return {
    title,
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : DEFAULT_DRAFT.summary,
    principles: asStrings(raw.principles),
    colorTokens: asTokens(raw.colorTokens),
    typographyTokens: asTokens(raw.typographyTokens),
    spacingTokens: asTokens(raw.spacingTokens),
    components: asComponents(raw.components),
    brandImageGuidelines: asStrings(raw.brandImageGuidelines),
    unresolved: asStrings(raw.unresolved),
  };
}

function heuristicDraft(name: string, captures: LoadedCapture[]): DesignSystemDraft {
  const top = (values: string[]) =>
    Object.entries(
      values.reduce<Record<string, number>>((acc, value) => {
        acc[value] = (acc[value] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => (a[1] === b[1] ? a[0].localeCompare(b[0]) : b[1] - a[1]))
      .slice(0, 5)
      .map(([key]) => key);

  const slugs = captures.map((item) => item.capture.slug);
  const tags = top(captures.flatMap((item) => item.capture.tags));
  const patterns = top(captures.flatMap((item) => item.capture.uiPatterns));
  return {
    title: `${name} Design System`,
    summary: `${captures.length}개 캡처에서 반복되는 ${tags.join(", ") || "UI"} 단서를 모은 디자인 시스템 초안입니다.`,
    principles: [
      "캡처에서 반복 관찰되는 패턴만 시스템 원칙으로 승격한다.",
      "브랜딩 이미지 생성에 쓰기 전 색·타이포 토큰은 사람이 확정한다.",
    ],
    colorTokens: [
      {
        name: "color.surface",
        value: "미확정",
        rationale: "선택 캡처의 배경/패널 색상 경향을 사람이 확인해 확정해야 한다.",
        sources: slugs,
      },
    ],
    typographyTokens: [
      {
        name: "type.interface",
        value: "Typeface: 미확정",
        rationale: "캡처 이미지만으로 정확한 글꼴명을 확정하지 않는다.",
        sources: slugs,
      },
    ],
    spacingTokens: [
      {
        name: "space.rhythm",
        value: "미확정",
        rationale: "레이아웃 간격은 원본 UI 스펙이 아니라 캡처 관찰값이므로 검토가 필요하다.",
        sources: slugs,
      },
    ],
    components: patterns.map((pattern) => ({
      name: pattern,
      usage: `${pattern} 패턴이 선택 집합에서 반복 관찰된다.`,
      sources: slugs,
    })),
    brandImageGuidelines: [
      "마케팅·브랜딩 이미지는 확정된 토큰과 컴포넌트 원칙만 참조한다.",
      "캡처에 없는 로고, 슬로건, 브랜드 컬러는 생성 프롬프트에 넣지 않는다.",
    ],
    unresolved: ["정확한 브랜드 색상 토큰", "타입페이스", "이미지 생성 모델과 저작권 정책"],
  };
}

function list(items: string[]): string {
  if (items.length === 0) return "- 미확정";
  return items.map((item) => `- ${item}`).join("\n");
}

function tokenTable(tokens: TokenDraft[]): string {
  if (tokens.length === 0) return "| Token | Value | Rationale | Sources |\n|---|---|---|---|\n| 미확정 | 미확정 | 근거 부족 | - |";
  return [
    "| Token | Value | Rationale | Sources |",
    "|---|---|---|---|",
    ...tokens.map(
      (token) =>
        `| ${token.name} | ${token.value} | ${token.rationale} | ${token.sources.map((source) => `[[${source}]]`).join(", ") || "-"} |`,
    ),
  ].join("\n");
}

function componentList(components: ComponentDraft[]): string {
  if (components.length === 0) return "- 미확정";
  return components
    .map((item) => `- **${item.name}**: ${item.usage} (${item.sources.map((source) => `[[${source}]]`).join(", ") || "근거 미확정"})`)
    .join("\n");
}

function buildDesignSystemMd(name: string, draft: DesignSystemDraft, captures: LoadedCapture[]): string {
  return `# ${draft.title}

> Generated draft from Archive captures. This is not the system-level design.md.

## Summary

${draft.summary}

## Source Captures

${captures.map((item) => `- [[${item.capture.slug}]] — ${item.capture.title}`).join("\n")}

## Principles

${list(draft.principles)}

## Color Tokens

${tokenTable(draft.colorTokens)}

## Typography Tokens

${tokenTable(draft.typographyTokens)}

## Spacing Tokens

${tokenTable(draft.spacingTokens)}

## Components

${componentList(draft.components)}

## Marketing / Branding Image Guidelines

${list(draft.brandImageGuidelines)}

## Unresolved

${list(draft.unresolved)}

## Review Note

이 파일은 \`${name}\` 디자인 시스템 초안이다. 사람이 검토·확정하기 전에는 마케팅/브랜딩 이미지 생성 기준으로 사용하지 않는다.
`;
}

function buildSourcesMd(captures: LoadedCapture[]): string {
  return `# Sources

${captures
  .map((item) => {
    const c = item.capture;
    return `## [[${c.slug}]]

- title: ${c.title}
- service: ${c.service}
- platform: ${c.platform}
- screenType: ${c.screenType}
- uiPatterns: ${c.uiPatterns.join(", ")}
- tags: ${c.tags.join(", ")}
- insight: ${c.insight}
`;
  })
  .join("\n")}`;
}

function buildTokensJson(draft: DesignSystemDraft, captures: LoadedCapture[]): string {
  return JSON.stringify(
    {
      version: 1,
      generatedAt: today(),
      sourceCaptures: captures.map((item) => item.capture.slug),
      color: draft.colorTokens,
      typography: draft.typographyTokens,
      spacing: draft.spacingTokens,
      components: draft.components,
      imageGuidelines: draft.brandImageGuidelines,
      unresolved: draft.unresolved,
    },
    null,
    2,
  );
}

function appendLog(name: string, date: string): void {
  if (!existsSync(WIKI_LOG_PATH)) return;
  const log = readFileSync(WIKI_LOG_PATH, "utf8").replace(/\r\n/g, "\n");
  const entry = `## [${date}] ingest | design-system ${name}\n\nArchive 캡처 집합에서 디자인 시스템 초안을 생성했다. 산출물은 \`obsidian/design-systems/${name}/\`에 있으며, 사람이 검토·확정해야 한다.\n\n`;
  const marker = log.indexOf("\n## [");
  const next =
    marker >= 0
      ? `${log.slice(0, marker + 1)}${entry}${log.slice(marker + 1)}`
      : `${log.replace(/\n*$/, "\n")}\n${entry}`;
  writeFileSync(WIKI_LOG_PATH, next);
}

async function main(): Promise<void> {
  loadDotEnv();
  const args = parseArgs(process.argv.slice(2));
  const name = slugify(args.name);
  if (!name) {
    console.error("사용법: npm run design-system -- --name <name> --slugs <slug...>");
    process.exit(2);
  }
  if (args.slugs.length === 0) {
    console.error("--slugs로 최소 1개 캡처 slug를 지정하세요.");
    process.exit(2);
  }

  const vault = loadVault();
  if (vault.issues.length > 0) {
    console.error("Vault validation issues must be fixed before generation.");
    for (const issue of vault.issues) {
      console.error(`- ${issue.path}${issue.field ? ` ${issue.field}` : ""}: ${issue.message}`);
    }
    process.exit(1);
  }

  const bySlug = new Map(vault.captures.map((item) => [item.capture.slug, item]));
  const missing = args.slugs.filter((slug) => !bySlug.has(slug));
  if (missing.length > 0) {
    console.error(`알 수 없는 capture slug: ${missing.join(", ")}`);
    process.exit(1);
  }

  const captures = args.slugs.map((slug) => bySlug.get(slug)!);
  const dir = join("obsidian/design-systems", name);
  if (existsSync(dir) && !args.dryRun) {
    console.error(`이미 존재하는 디자인 시스템 폴더: ${dir}`);
    process.exit(1);
  }

  const draft = args.noLlm
    ? heuristicDraft(name, captures)
    : toDraft(await callLlm(captures), `${name} Design System`);
  const designMd = buildDesignSystemMd(name, draft, captures);
  const sourcesMd = buildSourcesMd(captures);
  const tokensJson = buildTokensJson(draft, captures);

  if (args.dryRun) {
    console.log(`----- ${dir}/design-system.md -----\n${designMd}`);
    console.log(`----- ${dir}/sources.md -----\n${sourcesMd}`);
    console.log(`----- ${dir}/tokens.json -----\n${tokensJson}`);
    return;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "design-system.md"), designMd);
  writeFileSync(join(dir, "sources.md"), sourcesMd);
  writeFileSync(join(dir, "tokens.json"), `${tokensJson}\n`);
  appendLog(name, today());
  console.log(`OK: wrote ${dir}/design-system.md, sources.md, tokens.json`);
  console.log("다음 단계: 산출물 검토·보정 → npm run validate → 필요 시 마케팅/브랜딩 이미지 생성 Phase 착수");
}

void main();
