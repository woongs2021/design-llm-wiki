import assert from "node:assert/strict";
import {
  computeFacetCounts,
  EMPTY_FILTER,
  filterCaptures,
  sortCaptures,
} from "../src/shared/filter.ts";
import type { CaptureRecord, SiteIndex } from "../src/shared/index-types.ts";
import { readFileSync } from "node:fs";

function sample(partial: Partial<CaptureRecord> & Pick<CaptureRecord, "slug" | "capturedAt">): CaptureRecord {
  return {
    title: partial.title ?? partial.slug,
    visibility: "internal",
    sourceUrl: null,
    service: partial.service ?? "Example",
    platform: partial.platform ?? "web",
    screenType: partial.screenType ?? "gallery",
    uiPatterns: partial.uiPatterns ?? ["card-grid"],
    tone: partial.tone ?? "informational",
    copyTone: "neutral",
    tags: partial.tags ?? ["gallery"],
    insight: partial.insight ?? "insight",
    appVersion: null,
    body: partial.body ?? "body",
    asset: {
      path: "x.png",
      originalName: "x.png",
      format: "png",
      kind: "still",
      width: 1,
      height: 1,
      bytes: 1,
      hash: "a",
      frameCount: null,
      durationSec: null,
      posterPath: null,
    },
    ...partial,
  };
}

const unit = [
  sample({
    slug: "b-later",
    capturedAt: "2026-08-02",
    platform: "web",
    tags: ["filters", "cards"],
    uiPatterns: ["filter-chips"],
  }),
  sample({
    slug: "a-earlier",
    capturedAt: "2026-08-01",
    platform: "ios",
    tags: ["gallery"],
    screenType: "dashboard",
    tone: "calm",
  }),
  sample({
    slug: "c-same-day",
    capturedAt: "2026-08-02",
    platform: "web",
    tags: ["filters"],
    insight: "unique zebra insight",
  }),
];

const sorted = sortCaptures(unit).map((c) => c.slug);
assert.deepEqual(sorted, ["b-later", "c-same-day", "a-earlier"]);

const byPlatform = filterCaptures(unit, {
  ...EMPTY_FILTER,
  platforms: ["web"],
});
assert.equal(byPlatform.length, 2);
assert.deepEqual(
  byPlatform.map((c) => c.slug),
  ["b-later", "c-same-day"],
);

const byQuery = filterCaptures(unit, { ...EMPTY_FILTER, query: "zebra" });
assert.equal(byQuery.length, 1);
assert.equal(byQuery[0]?.slug, "c-same-day");

const counts = computeFacetCounts(unit, { ...EMPTY_FILTER, platforms: ["web"] });
assert.equal(counts.platform.web, 2);
assert.equal(counts.tag.filters, 2);
assert.equal(counts.platform.ios, undefined);

// Built index facets must match EMPTY_FILTER computation on the same captures.
const index = JSON.parse(
  readFileSync("dist/internal/data/index.json", "utf8"),
) as SiteIndex;
const rebuilt = computeFacetCounts(index.captures, EMPTY_FILTER);
assert.deepEqual(rebuilt, index.facets);

const filtered = filterCaptures(index.captures, {
  ...EMPTY_FILTER,
  tags: ["filters"],
});
const liveCounts = computeFacetCounts(index.captures, {
  ...EMPTY_FILTER,
  tags: ["filters"],
});
assert.equal(
  filtered.length,
  Object.values(liveCounts.platform).reduce((a, b) => a + b, 0),
);

console.log("OK: filter unit checks + built facet parity");
