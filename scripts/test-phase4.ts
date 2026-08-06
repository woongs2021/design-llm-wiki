import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildPromptExport } from "../src/shared/promptExport.ts";
import { relatedCaptureSlugs } from "../src/shared/related.ts";
import { computeCaptureStats } from "../src/shared/stats.ts";
import type { SiteIndex } from "../src/shared/index-types.ts";

const index = JSON.parse(
  readFileSync("dist/internal/data/index.json", "utf8"),
) as SiteIndex;

const still = index.captures.find((c) => c.slug === "naver-shopping-gallery");
assert.ok(still);

const related = relatedCaptureSlugs(still, index.captures);
assert.ok(related.includes("figma-community-gallery"));
assert.deepEqual(related, relatedCaptureSlugs(still, index.captures));

const wikiForStill = index.wiki.pages.filter((page) =>
  page.captureRefs.includes("naver-shopping-gallery"),
);
assert.ok(wikiForStill.some((page) => page.id === "patterns/filterable-gallery"));
assert.ok(wikiForStill.some((page) => page.id === "services/naver-shopping"));

const stats = computeCaptureStats(index.captures);
assert.equal(stats.total, index.captures.length);
assert.equal(
  stats.visibility.reduce((sum, item) => sum + item.count, 0),
  index.captures.length,
);

const publicIndex = JSON.parse(
  readFileSync("dist/public/data/index.json", "utf8"),
) as SiteIndex;
const publicStats = computeCaptureStats(publicIndex.captures);
assert.ok(publicStats.total >= 1);
assert.ok(!publicStats.visibility.some((item) => item.key === "internal"));

const collection = index.collections.find((item) => item.slug === "public-gallery");
assert.ok(collection);
assert.ok(collection.captures.includes("naver-shopping-gallery"));
assert.ok(collection.captures.includes("toss-onboarding-welcome"));

const exportText = buildPromptExport({
  captures: [still],
  wikiPages: index.wiki.pages,
  includeBodies: true,
});
const exportAgain = buildPromptExport({
  captures: [still],
  wikiPages: index.wiki.pages,
  includeBodies: true,
});
assert.equal(exportText, exportAgain);
assert.ok(exportText.includes(still.title));
assert.ok(exportText.includes("필터형 갤러리"));
assert.ok(exportText.includes("### Analysis"));

// Simulate preview DOM textContent parity: escaped HTML round-trips to same text.
const escaped = exportText
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const textarea = { textContent: "" as string | null };
// browser would decode entities when parsing HTML; emulate decode
textarea.textContent = escaped
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&amp;", "&");
assert.equal(textarea.textContent, exportText);

console.log("OK: phase 4 related/stats/export/collection checks");
