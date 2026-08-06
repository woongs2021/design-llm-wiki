import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import {
  computeFacetCounts,
  EMPTY_FILTER,
} from "../src/shared/filter.ts";
import type { CaptureRecord } from "../src/shared/index-types.ts";
import {
  GITHUB_PAGES_MAX_BYTES,
  GIT_MAX_FILE_BYTES,
} from "../src/shared/limits.ts";
import { extractCaptureSlugRefs } from "../src/shared/schema.ts";
import { stableStringify } from "../src/shared/stable-json.ts";
import { extractPoster, probeAssetFile } from "./lib/probe-asset.ts";
import { loadVault } from "./lib/vault.ts";

type Target = "internal" | "public";

type Exclusion = { path: string; reason: string };
type Failure = { path: string; reason: string };
type DuplicateGroup = { hash: string; paths: string[]; slugs: string[] };

function parseTarget(argv: string[]): Target {
  const idx = argv.indexOf("--target");
  const value = idx >= 0 ? argv[idx + 1] : undefined;
  if (value === "internal" || value === "public") return value;
  console.error("Usage: npm run build -- --target=internal|public");
  console.error("   or: npm run build -- --target internal|public");
  process.exit(2);
}

// support --target=public form
function parseTargetFlexible(argv: string[]): Target {
  for (const arg of argv) {
    if (arg.startsWith("--target=")) {
      const value = arg.slice("--target=".length);
      if (value === "internal" || value === "public") return value;
    }
  }
  return parseTarget(argv);
}

const target = parseTargetFlexible(process.argv.slice(2));
const outRoot = join("dist", target);
const dataDir = join(outRoot, "data");
const assetsRoot = join(outRoot, "assets", "captures");

const vault = loadVault();
const failures: Failure[] = [];
const exclusions: Exclusion[] = [];
const wikiExclusions: Exclusion[] = [];
const probeFailures: Failure[] = [];
const oversizeFiles: { path: string; bytes: number }[] = [];
const duplicateGroups: DuplicateGroup[] = [];

for (const issue of vault.issues) {
  failures.push({
    path: issue.path + (issue.field ? ` [${issue.field}]` : ""),
    reason: issue.message,
  });
}

const knownSlugs = new Set(vault.captures.map((c) => c.capture.slug));
const visibilityBySlug = new Map(
  vault.captures.map((c) => [c.capture.slug, c.capture.visibility] as const),
);

const builtCaptures: CaptureRecord[] = [];
const hashToCaptures = new Map<string, { path: string; slug: string }[]>();
let copiedAssetBytes = 0;
let copiedAssetCount = 0;
let skippedAssetCount = 0;
let skippedAssetBytes = 0;

rmSync(outRoot, { recursive: true, force: true });
mkdirSync(dataDir, { recursive: true });
mkdirSync(assetsRoot, { recursive: true });

for (const item of vault.captures) {
  const { capture, path, folderPath, body } = item;

  if (target === "public" && capture.visibility !== "public") {
    exclusions.push({
      path,
      reason: `visibility=${capture.visibility}`,
    });
    const assetAbs = join(folderPath, capture.asset);
    try {
      const probed = probeAssetFile(assetAbs);
      skippedAssetCount += 1;
      skippedAssetBytes += probed.bytes;
    } catch {
      skippedAssetCount += 1;
    }
    continue;
  }

  const assetAbs = join(folderPath, capture.asset);
  let probed;
  try {
    probed = probeAssetFile(assetAbs);
  } catch (error) {
    probeFailures.push({
      path,
      reason: error instanceof Error ? error.message : String(error),
    });
    failures.push({
      path,
      reason: error instanceof Error ? error.message : String(error),
    });
    continue;
  }

  if (probed.bytes > GIT_MAX_FILE_BYTES) {
    oversizeFiles.push({ path: `${path} / ${capture.asset}`, bytes: probed.bytes });
    failures.push({
      path,
      reason: `Asset exceeds Git 100MB limit (${probed.bytes} bytes)`,
    });
    continue;
  }

  const group = hashToCaptures.get(probed.hash) ?? [];
  group.push({ path, slug: capture.slug });
  hashToCaptures.set(probed.hash, group);

  const assetOutDir = join(assetsRoot, capture.slug);
  mkdirSync(assetOutDir, { recursive: true });
  const originalName = basename(capture.asset);
  const assetRel = `assets/captures/${capture.slug}/${originalName}`;
  copyFileSync(assetAbs, join(assetOutDir, originalName));
  copiedAssetCount += 1;
  copiedAssetBytes += probed.bytes;

  let posterPath: string | null = null;
  if (probed.kind === "motion") {
    try {
      const poster = extractPoster(assetAbs, probed);
      const posterName = `${basename(originalName, extname(originalName))}.poster${poster.extension}`;
      writeFileSync(join(assetOutDir, posterName), poster.posterBytes);
      posterPath = `assets/captures/${capture.slug}/${posterName}`;
      copiedAssetCount += 1;
      copiedAssetBytes += poster.posterBytes.byteLength;
    } catch (error) {
      probeFailures.push({
        path,
        reason: error instanceof Error ? error.message : String(error),
      });
      failures.push({
        path,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
  }

  builtCaptures.push({
    slug: capture.slug,
    title: capture.title,
    visibility: capture.visibility,
    capturedAt: capture.capturedAt,
    sourceUrl: capture.sourceUrl,
    service: capture.service,
    platform: capture.platform,
    screenType: capture.screenType,
    uiPatterns: capture.uiPatterns,
    tone: capture.tone,
    copyTone: capture.copyTone,
    tags: capture.tags,
    insight: capture.insight,
    appVersion: capture.appVersion,
    body,
    asset: {
      path: assetRel,
      originalName,
      format: probed.format,
      kind: probed.kind,
      width: probed.width,
      height: probed.height,
      bytes: probed.bytes,
      hash: probed.hash,
      frameCount: probed.frameCount,
      durationSec: probed.durationSec,
      posterPath,
    },
  });
}

for (const [hash, items] of hashToCaptures) {
  if (items.length > 1) {
    duplicateGroups.push({
      hash,
      paths: items.map((i) => i.path).sort(),
      slugs: items.map((i) => i.slug).sort(),
    });
  }
}
duplicateGroups.sort((a, b) => a.hash.localeCompare(b.hash));

const builtWikiPages: {
  id: string;
  title: string;
  summary: string;
  visibility: string;
  body: string;
  captureRefs: string[];
}[] = [];

for (const page of vault.wikiPages) {
  const refs = extractCaptureSlugRefs(
    `${page.body}\n${page.raw}`,
    knownSlugs,
  );
  const internalRefs = refs.filter(
    (slug) => visibilityBySlug.get(slug) === "internal",
  );

  if (target === "public") {
    if (page.page.visibility !== "public") {
      wikiExclusions.push({
        path: page.path,
        reason: `wiki visibility=${page.page.visibility}`,
      });
      continue;
    }
    if (internalRefs.length > 0) {
      failures.push({
        path: page.path,
        reason: `Public wiki page references internal capture(s): ${internalRefs.join(", ")}`,
      });
      continue;
    }
  }

  builtWikiPages.push({
    id: page.relativeLink.replace(/\.md$/, ""),
    title: page.page.title,
    summary: page.page.summary,
    visibility: page.page.visibility,
    body: page.body,
    captureRefs: refs,
  });
}

const builtCollections: {
  slug: string;
  title: string;
  description: string;
  captures: string[];
  body: string;
}[] = [];

for (const item of vault.collections) {
  const captureSlugs = item.collection.captures;
  if (target === "public") {
    const internal = captureSlugs.filter(
      (slug) => visibilityBySlug.get(slug) !== "public",
    );
    if (internal.length > 0) {
      exclusions.push({
        path: item.path,
        reason: `collection references non-public capture(s): ${internal.join(", ")}`,
      });
      continue;
    }
  }
  builtCollections.push({
    slug: item.collection.slug,
    title: item.collection.title,
    description: item.collection.description,
    captures: captureSlugs,
    body: item.body,
  });
}

const wikiIndexBody =
  target === "public"
    ? buildPublicWikiIndex(builtWikiPages)
    : vault.wikiIndexBody;

const index = {
  version: 1,
  target,
  captures: builtCaptures,
  collections: builtCollections,
  wiki: {
    indexBody: wikiIndexBody,
    // Wiki log may name internal captures; keep it out of the public bundle.
    logEntries:
      target === "public"
        ? []
        : vault.wikiLogEntries.map((e) => ({
            date: e.date,
            operation: e.operation,
            title: e.title,
          })),
    pages: builtWikiPages,
  },
  facets: computeFacetCounts(builtCaptures, EMPTY_FILTER),
};

const indexPath = join(dataDir, "index.json");
writeFileSync(indexPath, stableStringify(index));

const report = {
  target,
  capturesTotal: vault.captures.length,
  capturesIncluded: builtCaptures.length,
  capturesExcluded: exclusions.filter((e) => e.path.includes("/captures/"))
    .length,
  collectionsIncluded: builtCollections.length,
  collectionsExcluded: exclusions.filter((e) =>
    e.path.includes("/collections/"),
  ).length,
  wikiPagesTotal: vault.wikiPages.length,
  wikiPagesIncluded: builtWikiPages.length,
  wikiPagesExcluded: wikiExclusions.length,
  failures: failures.length,
  probeFailures: probeFailures.length,
  visibilityDefaultsApplied: vault.visibilityDefaults,
  tagNormalizations: vault.tagNormalizations.length,
  tagNormalizationDetails: vault.tagNormalizations.map((t) => ({
    path: t.path,
    raw: t.raw,
    canonical: t.canonical,
  })),
  duplicateGroups: duplicateGroups.length,
  duplicateGroupDetails: duplicateGroups,
  exclusions: [...exclusions, ...wikiExclusions],
  failureDetails: failures,
  probeFailureDetails: probeFailures,
  oversizeFiles,
  assetsCopied: copiedAssetCount,
  assetBytesCopied: copiedAssetBytes,
  assetsSkippedNotCopied: skippedAssetCount,
  assetBytesSkippedNotCopied: skippedAssetBytes,
  githubPagesMaxBytes: GITHUB_PAGES_MAX_BYTES,
  githubPagesRemainingBytes: GITHUB_PAGES_MAX_BYTES - copiedAssetBytes,
  gitMaxFileBytes: GIT_MAX_FILE_BYTES,
};

// Reports stay outside dist bundles so public deploy trees cannot leak internal paths.
mkdirSync("reports", { recursive: true });
const reportPath = join("reports", `${target}-build-report.json`);
writeFileSync(reportPath, stableStringify(report));

console.log(`Build target: ${target}`);
console.log(`captures: ${report.capturesIncluded}/${report.capturesTotal} included`);
console.log(`excluded captures/collections: ${exclusions.length}`);
console.log(`wiki pages: ${report.wikiPagesIncluded}/${report.wikiPagesTotal} included`);
console.log(`wiki excluded: ${wikiExclusions.length}`);
console.log(`failures: ${failures.length}`);
console.log(`visibility defaults: ${report.visibilityDefaultsApplied}`);
console.log(`tag normalizations: ${report.tagNormalizations}`);
for (const t of report.tagNormalizationDetails) {
  console.log(`  ${t.path}: "${t.raw}" → ${t.canonical}`);
}
console.log(`duplicate hash groups: ${duplicateGroups.length}`);
for (const g of duplicateGroups) {
  console.log(`  ${g.hash.slice(0, 12)}… → ${g.slugs.join(", ")}`);
}
console.log(`asset bytes copied: ${copiedAssetBytes}`);
console.log(
  `GitHub Pages remaining: ${report.githubPagesRemainingBytes} / ${GITHUB_PAGES_MAX_BYTES}`,
);
if (skippedAssetCount > 0) {
  console.log(
    `assets not copied (visibility gate): ${skippedAssetCount} files / ${skippedAssetBytes} bytes`,
  );
}
if (oversizeFiles.length > 0) {
  console.log("oversize files (>100MB):");
  for (const f of oversizeFiles) console.log(`  ${f.path} (${f.bytes})`);
}
for (const f of failures) {
  console.error(`FAIL ${f.path}: ${f.reason}`);
}

if (failures.length > 0) {
  // keep report on disk, but fail the process
  process.exit(1);
}

console.log(`\nOK: wrote ${indexPath}`);
console.log(`OK: wrote ${reportPath}`);

function buildPublicWikiIndex(
  pages: { id: string; title: string; summary: string }[],
): string {
  const groups: Record<string, { id: string; title: string; summary: string }[]> =
    {
      patterns: [],
      services: [],
      comparisons: [],
      questions: [],
    };
  for (const page of pages) {
    const [dir] = page.id.split("/");
    if (dir && groups[dir]) groups[dir].push(page);
  }
  const section = (title: string, key: string) => {
    const items = groups[key] ?? [];
    if (items.length === 0) return `## ${title}\n\n_None yet._\n`;
    return [
      `## ${title}`,
      "",
      ...items.map(
        (p) =>
          `- [${p.title}](${p.id}.md) — ${p.summary}`,
      ),
      "",
    ].join("\n");
  };
  return [
    "# Wiki index",
    "",
    "Content-oriented catalog for the public bundle. Internal-only pages are omitted.",
    "",
    section("Patterns", "patterns"),
    section("Services", "services"),
    section("Comparisons", "comparisons"),
    section("Questions", "questions"),
  ].join("\n");
}
