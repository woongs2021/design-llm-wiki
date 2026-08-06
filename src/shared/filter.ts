import type { CaptureRecord, FacetCounts } from "./index-types.ts";

export type FilterState = {
  query: string;
  platforms: string[];
  screenTypes: string[];
  uiPatterns: string[];
  tags: string[];
  tones: string[];
};

export const EMPTY_FILTER: FilterState = {
  query: "",
  platforms: [],
  screenTypes: [],
  uiPatterns: [],
  tags: [],
  tones: [],
};

/** Default gallery order: capturedAt desc, then slug asc. */
export function sortCaptures(captures: CaptureRecord[]): CaptureRecord[] {
  return [...captures].sort((a, b) => {
    if (a.capturedAt !== b.capturedAt) {
      return a.capturedAt < b.capturedAt ? 1 : -1;
    }
    return a.slug.localeCompare(b.slug);
  });
}

function includesAll(haystack: string[], required: string[]): boolean {
  return required.every((value) => haystack.includes(value));
}

function matchesQuery(capture: CaptureRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    capture.slug,
    capture.title,
    capture.service,
    capture.insight,
    capture.platform,
    capture.screenType,
    capture.tone,
    capture.copyTone,
    capture.body,
    ...capture.tags,
    ...capture.uiPatterns,
  ]
    .join("\n")
    .toLowerCase();
  return haystack.includes(q);
}

export function filterCaptures(
  captures: CaptureRecord[],
  filters: FilterState,
): CaptureRecord[] {
  return sortCaptures(captures).filter((capture) => {
    if (!matchesQuery(capture, filters.query)) return false;
    if (
      filters.platforms.length > 0 &&
      !filters.platforms.includes(capture.platform)
    ) {
      return false;
    }
    if (
      filters.screenTypes.length > 0 &&
      !filters.screenTypes.includes(capture.screenType)
    ) {
      return false;
    }
    if (
      filters.uiPatterns.length > 0 &&
      !includesAll(capture.uiPatterns, filters.uiPatterns)
    ) {
      return false;
    }
    if (filters.tags.length > 0 && !includesAll(capture.tags, filters.tags)) {
      return false;
    }
    if (filters.tones.length > 0 && !filters.tones.includes(capture.tone)) {
      return false;
    }
    return true;
  });
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/**
 * Facet counts for the current filter result set.
 * Build stores empty-filter counts; UI recomputes with the same function.
 */
export function computeFacetCounts(
  captures: CaptureRecord[],
  filters: FilterState,
): FacetCounts {
  const filtered = filterCaptures(captures, filters);
  const counts: FacetCounts = {
    platform: {},
    screenType: {},
    uiPattern: {},
    tag: {},
    tone: {},
  };
  for (const capture of filtered) {
    bump(counts.platform, capture.platform);
    bump(counts.screenType, capture.screenType);
    bump(counts.tone, capture.tone);
    for (const pattern of capture.uiPatterns) bump(counts.uiPattern, pattern);
    for (const tag of capture.tags) bump(counts.tag, tag);
  }
  return counts;
}

export function facetTotal(counts: FacetCounts): number {
  return Object.values(counts.platform).reduce((sum, n) => sum + n, 0);
}
