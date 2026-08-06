import type { CaptureRecord, CaptureScore } from "./index-types.ts";

const LABELS = [
  ["layout", "레이아웃"],
  ["hierarchy", "시각 위계"],
  ["clarity", "정보 명확성"],
  ["interaction", "인터랙션 단서"],
  ["reuse", "재사용성"],
] as const;

function clampScore(value: number): number {
  return Math.max(35, Math.min(98, Math.round(value)));
}

function hashText(value: string): number {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return hash;
}

export function getCaptureScores(capture: CaptureRecord): CaptureScore[] {
  if (capture.analysisScores?.length) return capture.analysisScores;

  const seed = hashText(`${capture.slug}:${capture.title}:${capture.insight}`);
  const densityBoost = capture.tags.includes("density") ? 7 : 0;
  const motionBoost = capture.asset.kind === "motion" ? 8 : 0;
  const patternBoost = Math.min(12, capture.uiPatterns.length * 3);
  const aspect = capture.asset.width / Math.max(1, capture.asset.height);
  const wideBoost = aspect > 1.2 ? 6 : 0;
  const mobileBoost = aspect < 0.75 ? 5 : 0;

  const scores = [
    68 + patternBoost + wideBoost + (seed % 9),
    66 + densityBoost + ((seed >> 1) % 10),
    64 + (capture.insight.length > 45 ? 8 : 3) + ((seed >> 2) % 9),
    58 + motionBoost + (capture.uiPatterns.includes("filter-chips") ? 7 : 0),
    62 + mobileBoost + patternBoost + ((seed >> 3) % 8),
  ].map(clampScore);

  return LABELS.map(([key, label], index) => ({
    key,
    label,
    score: scores[index] ?? 60,
    description: describeScore(label, scores[index] ?? 60, capture),
  }));
}

export function totalScore(scores: CaptureScore[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
}

function describeScore(label: string, score: number, capture: CaptureRecord): string {
  if (label === "레이아웃") {
    return `${capture.screenType} 화면 구조와 ${capture.uiPatterns.join(", ")} 패턴의 배치 안정성.`;
  }
  if (label === "시각 위계") {
    return "대표 정보, 보조 설명, 메타 정보가 얼마나 빠르게 구분되는지의 점수.";
  }
  if (label === "정보 명확성") {
    return "카드에 들어갈 타이틀과 간단 내용이 즉시 이해되는 정도.";
  }
  if (label === "인터랙션 단서") {
    return capture.asset.kind === "motion"
      ? "모션 파일이라 상태 변화 단서를 더 강하게 반영."
      : "정지 이미지라 실제 hover나 전환은 확인 필요.";
  }
  return score >= 75
    ? "다른 캡처나 프롬프트에 재사용하기 좋은 관찰값이 있음."
    : "재사용하려면 추가 캡처나 비교가 더 있으면 좋음.";
}
