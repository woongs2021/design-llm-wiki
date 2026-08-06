import type { CaptureRecord } from "./index-types.ts";

export type StatBucket = { key: string; count: number };

export type CaptureStats = {
  total: number;
  visibility: StatBucket[];
  platform: StatBucket[];
  screenType: StatBucket[];
  uiPattern: StatBucket[];
  tag: StatBucket[];
  timeline: StatBucket[];
};

function buckets(map: Record<string, number>): StatBucket[] {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.key.localeCompare(b.key);
    });
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/** Derived only from the current bundle's captures JSON. */
export function computeCaptureStats(captures: CaptureRecord[]): CaptureStats {
  const visibility: Record<string, number> = {};
  const platform: Record<string, number> = {};
  const screenType: Record<string, number> = {};
  const uiPattern: Record<string, number> = {};
  const tag: Record<string, number> = {};
  const timeline: Record<string, number> = {};

  for (const capture of captures) {
    bump(visibility, capture.visibility);
    bump(platform, capture.platform);
    bump(screenType, capture.screenType);
    bump(timeline, capture.capturedAt);
    for (const pattern of capture.uiPatterns) bump(uiPattern, pattern);
    for (const item of capture.tags) bump(tag, item);
  }

  return {
    total: captures.length,
    visibility: buckets(visibility),
    platform: buckets(platform),
    screenType: buckets(screenType),
    uiPattern: buckets(uiPattern),
    tag: buckets(tag),
    timeline: Object.entries(timeline)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => a.key.localeCompare(b.key)),
  };
}
