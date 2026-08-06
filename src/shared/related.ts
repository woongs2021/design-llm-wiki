import type { CaptureRecord, WikiPageRecord } from "./index-types.ts";

export type RelatedScore = {
  slug: string;
  score: number;
  sharedTags: string[];
  sharedPatterns: string[];
};

/** Related captures by tag ∩ UI-pattern intersection. Stable sort for tests/UI. */
export function rankRelatedCaptures(
  capture: CaptureRecord,
  all: CaptureRecord[],
): RelatedScore[] {
  const tagSet = new Set(capture.tags);
  const patternSet = new Set(capture.uiPatterns);

  return all
    .filter((item) => item.slug !== capture.slug)
    .map((item) => {
      const sharedTags = item.tags.filter((tag) => tagSet.has(tag)).sort();
      const sharedPatterns = item.uiPatterns
        .filter((pattern) => patternSet.has(pattern))
        .sort();
      const score = sharedTags.length * 2 + sharedPatterns.length;
      return {
        slug: item.slug,
        score,
        sharedTags,
        sharedPatterns,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.slug.localeCompare(b.slug);
    });
}

export function relatedCaptureSlugs(
  capture: CaptureRecord,
  all: CaptureRecord[],
  limit = 6,
): string[] {
  return rankRelatedCaptures(capture, all)
    .slice(0, limit)
    .map((item) => item.slug);
}

export function wikiPagesForCapture(
  slug: string,
  pages: WikiPageRecord[],
): WikiPageRecord[] {
  return pages
    .filter((page) => page.captureRefs.includes(slug))
    .sort((a, b) => a.id.localeCompare(b.id));
}
