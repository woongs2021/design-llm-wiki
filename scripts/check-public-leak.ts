import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { SiteIndex } from "../src/shared/index-types.ts";

const PUBLIC_ROOT = "dist/public";
const INTERNAL_INDEX = "dist/internal/data/index.json";

if (!existsSync(`${PUBLIC_ROOT}/data/index.json`)) {
  console.error("FAIL: dist/public/data/index.json missing — build public target first");
  process.exit(1);
}
if (!existsSync(INTERNAL_INDEX)) {
  console.error("FAIL: dist/internal/data/index.json missing — build internal target first");
  process.exit(1);
}

const internal = JSON.parse(readFileSync(INTERNAL_INDEX, "utf8")) as SiteIndex;
const publicIndex = JSON.parse(
  readFileSync(`${PUBLIC_ROOT}/data/index.json`, "utf8"),
) as SiteIndex;

// Use identity markers that must not appear in public bundles.
// Do not use shared fields like service names that also exist on public captures.
const markers = new Set<string>();
for (const capture of internal.captures) {
  if (capture.visibility === "internal") {
    markers.add(capture.slug);
  }
}
for (const page of internal.wiki.pages) {
  if (page.visibility === "internal") {
    markers.add(page.id);
  }
}

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

let failures = 0;
const textFiles = walk(PUBLIC_ROOT).filter((path) =>
  /\.(json|js|css|html|md|txt)$/i.test(path),
);

for (const file of textFiles) {
  const text = readFileSync(file, "utf8");
  for (const marker of markers) {
    if (!marker || marker.length < 3) continue;
    if (text.includes(marker)) {
      failures += 1;
      console.error(`FAIL: ${file} contains internal marker "${marker}"`);
    }
  }
}

const publicAssetDirs = existsSync(`${PUBLIC_ROOT}/assets/captures`)
  ? readdirSync(`${PUBLIC_ROOT}/assets/captures`)
  : [];
for (const dir of publicAssetDirs) {
  if (markers.has(dir)) {
    failures += 1;
    console.error(`FAIL: public assets include internal capture dir "${dir}"`);
  }
}

for (const capture of publicIndex.captures) {
  if (capture.visibility !== "public") {
    failures += 1;
    console.error(`FAIL: public index includes non-public capture ${capture.slug}`);
  }
}
for (const page of publicIndex.wiki.pages) {
  if (page.visibility !== "public") {
    failures += 1;
    console.error(`FAIL: public index includes non-public wiki page ${page.id}`);
  }
  for (const ref of page.captureRefs) {
    const capture = publicIndex.captures.find((item) => item.slug === ref);
    if (!capture) {
      failures += 1;
      console.error(`FAIL: public wiki ${page.id} references missing/non-public ${ref}`);
    }
  }
}

console.log(`Checked markers: ${[...markers].sort().join(", ")}`);
console.log(`Public captures: ${publicIndex.captures.length}`);
console.log(`Public wiki pages: ${publicIndex.wiki.pages.length}`);

if (failures > 0) {
  console.error(`\nFAIL: ${failures} public leak issue(s)`);
  process.exit(1);
}
console.log("\nOK: public bundle has no internal markers/assets/refs");
