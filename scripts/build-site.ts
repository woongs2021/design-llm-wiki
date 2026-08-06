import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GITHUB_PAGES_MAX_BYTES, GIT_MAX_FILE_BYTES } from "../src/shared/limits.ts";
import { stableStringify } from "../src/shared/stable-json.ts";
import type { SiteIndex } from "../src/shared/index-types.ts";

function parseTarget(argv: string[]): "internal" | "public" {
  for (const arg of argv) {
    if (arg.startsWith("--target=")) {
      const value = arg.slice("--target=".length);
      if (value === "internal" || value === "public") return value;
    }
  }
  const idx = argv.indexOf("--target");
  const value = idx >= 0 ? argv[idx + 1] : undefined;
  if (value === "internal" || value === "public") return value;
  console.error("Usage: npm run build:site -- --target=internal|public");
  process.exit(2);
}

const target = parseTarget(process.argv.slice(2));

function run(command: string, args: string[], env: NodeJS.ProcessEnv = {}): void {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: process.platform === "win32",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(`\n==> Building index (${target})`);
run("npm", ["run", "build", "--", `--target=${target}`]);

console.log(`\n==> Building UI with DATA_TARGET=${target}`);
run("npm", ["run", "build:ui"], { DATA_TARGET: target });

const indexPath = join("dist/app/data/index.json");
if (!existsSync(indexPath)) {
  console.error(`FAIL: ${indexPath} missing after site build`);
  process.exit(1);
}

const index = JSON.parse(readFileSync(indexPath, "utf8")) as SiteIndex;
const reportPath = join("reports", `${target}-build-report.json`);
const report = existsSync(reportPath)
  ? (JSON.parse(readFileSync(reportPath, "utf8")) as {
      assetBytesCopied: number;
      oversizeFiles: { path: string; bytes: number }[];
      capturesIncluded: number;
      capturesTotal: number;
    })
  : null;

if (report && report.oversizeFiles.length > 0) {
  console.error("FAIL: oversize files above Git 100MB limit:");
  for (const file of report.oversizeFiles) {
    console.error(`  ${file.path} (${file.bytes})`);
  }
  process.exit(1);
}

if (report && report.assetBytesCopied > GITHUB_PAGES_MAX_BYTES) {
  console.error(
    `FAIL: asset bytes ${report.assetBytesCopied} exceed GitHub Pages ${GITHUB_PAGES_MAX_BYTES}`,
  );
  process.exit(1);
}

mkdirSync("reports", { recursive: true });
const inventory = {
  target,
  appDir: "dist/app",
  capturesInBundle: index.captures.length,
  collectionsInBundle: index.collections.length,
  wikiPagesInBundle: index.wiki.pages.length,
  assetBytesCopied: report?.assetBytesCopied ?? null,
  githubPagesMaxBytes: GITHUB_PAGES_MAX_BYTES,
  githubPagesRemainingBytes: report
    ? GITHUB_PAGES_MAX_BYTES - report.assetBytesCopied
    : null,
  gitMaxFileBytes: GIT_MAX_FILE_BYTES,
  oversizeFiles: report?.oversizeFiles ?? [],
  builtAtNote:
    "No timestamp embedded in site JSON. Inventory is for the human deploying this run.",
};
writeFileSync(
  join("reports", `${target}-site-inventory.json`),
  stableStringify(inventory),
);

console.log(`\nOK: site ready in dist/app for target=${target}`);
console.log(`captures: ${index.captures.length}`);
if (report) {
  console.log(`asset bytes: ${report.assetBytesCopied}`);
  console.log(
    `GitHub Pages remaining: ${GITHUB_PAGES_MAX_BYTES - report.assetBytesCopied}`,
  );
}
console.log("Deploy manually — see docs/deploy.md. No CI/watcher deploy is configured.");
