import type { CaptureRecord } from "./shared/index-types.ts";
import { getCaptureScores, totalScore } from "./shared/analysis-scores.ts";

type ImageMeta = {
  width: number;
  height: number;
};

function slugify(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);
  return slug || "local-capture";
}

function titleFromName(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "로컬 캡처";
}

function formatFromFile(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext) return ext === "jpeg" ? "jpg" : ext;
  return file.type.split("/").pop() || "file";
}

function screenTypeFor(meta: ImageMeta): CaptureRecord["screenType"] {
  const aspect = meta.width / Math.max(1, meta.height);
  if (aspect < 0.65) return "onboarding";
  if (aspect > 1.5) return "dashboard";
  return "detail";
}

function tagsFor(meta: ImageMeta): string[] {
  const aspect = meta.width / Math.max(1, meta.height);
  if (aspect < 0.75) return ["onboarding", "typography", "forms"];
  if (aspect > 1.5) return ["dashboard", "density", "navigation"];
  return ["cards", "color", "typography"];
}

function patternsFor(meta: ImageMeta): string[] {
  const aspect = meta.width / Math.max(1, meta.height);
  if (aspect < 0.75) return ["hero-band", "progress-bar"];
  if (aspect > 1.5) return ["data-table", "tab-row"];
  return ["card-grid", "split-view"];
}

function loadImageMeta(url: string): Promise<ImageMeta> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
    };
    image.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    image.src = url;
  });
}

export async function analyzeLocalFile(file: File): Promise<CaptureRecord> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name}: 현재 Intake 데모는 이미지 파일만 분석합니다.`);
  }

  const objectUrl = URL.createObjectURL(file);
  const meta = await loadImageMeta(objectUrl);
  const format = formatFromFile(file);
  const slug = `local-${Date.now()}-${slugify(file.name)}`;
  const title = titleFromName(file.name);
  const screenType = screenTypeFor(meta);
  const tags = tagsFor(meta);
  const uiPatterns = patternsFor(meta);
  const aspect = meta.width / Math.max(1, meta.height);
  const orientation =
    aspect < 0.75 ? "모바일 세로형" : aspect > 1.5 ? "와이드 업무형" : "균형형";

  const capture: CaptureRecord = {
    slug,
    title,
    visibility: "internal",
    capturedAt: new Date().toISOString().slice(0, 10),
    sourceUrl: null,
    service: "Local Intake",
    platform: aspect < 0.75 ? "web-mobile" : "web",
    screenType,
    uiPatterns,
    tone: aspect > 1.5 ? "data-dense" : "informational",
    copyTone: "neutral",
    tags,
    insight: `${orientation} 캡처로, 대표 이미지와 기본 메타를 바탕으로 빠른 리뷰용 카드가 생성됨.`,
    appVersion: null,
    body: `## Layout

로컬 업로드 파일의 비율과 크기를 기준으로 ${orientation} 화면으로 분류했다. 실제 컴포넌트 의미는 사용자가 상세 분석에서 보정해야 한다.

## Color

브라우저에서는 이미지 픽셀을 LLM으로 해석하지 않는다. 현재 색상 판단은 데모용이며, 실제 컬러 역할은 사람이 확인해야 한다.

## Typography

텍스트 영역은 파일만으로 확정하지 않는다. 제목·본문·캡션의 위계는 상세 화면에서 육안으로 확인한다.

## Interaction

정지 이미지 기준 분석이다. hover, 전환, 상태 변화는 추가 모션 캡처가 있을 때만 확정한다.`,
    asset: {
      path: objectUrl,
      originalName: file.name,
      format,
      kind: "still",
      width: meta.width,
      height: meta.height,
      bytes: file.size,
      hash: `local-${file.name}-${file.size}-${file.lastModified}`,
      frameCount: null,
      durationSec: null,
      posterPath: null,
    },
    localOnly: true,
  };

  const scores = getCaptureScores(capture);
  capture.analysisScores = scores;
  capture.analysisTotal = totalScore(scores);
  return capture;
}
