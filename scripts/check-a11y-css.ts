import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/base.css", "utf8");
let failures = 0;

function fail(message: string): void {
  failures += 1;
  console.error(`FAIL: ${message}`);
}

function extractBlock(source: string, startIndex: number): string {
  const open = source.indexOf("{", startIndex);
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }
  return "";
}

if (!/:focus-visible\s*\{[\s\S]*?outline\s*:/.test(css)) {
  fail("Global :focus-visible outline rule is missing");
} else {
  console.log("OK: :focus-visible outline present");
}

const coarseAt = css.search(/@media\s*\(\s*pointer\s*:\s*coarse\s*\)/);
if (coarseAt < 0) {
  fail("@media (pointer: coarse) block is missing");
} else {
  const block = extractBlock(css, coarseAt);
  const chip = block.match(/\.chip\s*\{([\s\S]*?)\}/);
  const button = block.match(/\.button\s*\{([\s\S]*?)\}/);
  const chipMin = chip?.[1]?.match(/min-height:\s*(\d+)px/);
  const buttonMin = button?.[1]?.match(/min-height:\s*(\d+)px/);
  if (!chipMin || Number(chipMin[1]) < 44) {
    fail(`coarse .chip min-height must be >= 44px, got ${chipMin?.[1] ?? "none"}`);
  } else {
    console.log(`OK: coarse .chip min-height ${chipMin[1]}px`);
  }
  if (!buttonMin || Number(buttonMin[1]) < 48) {
    fail(
      `coarse .button min-height must be >= 48px, got ${buttonMin?.[1] ?? "none"}`,
    );
  } else {
    console.log(`OK: coarse .button min-height ${buttonMin[1]}px`);
  }
}

const chipBaseAt = css.search(/^\.chip\s*\{/m);
const chipBase = chipBaseAt >= 0 ? extractBlock(css, chipBaseAt) : "";
const chipBaseMin = chipBase.match(/min-height:\s*(\d+)px/);
if (!chipBaseMin) {
  fail("base .chip min-height missing");
} else if (Number(chipBaseMin[1]) >= 44) {
  fail(
    `base .chip min-height is ${chipBaseMin[1]}px — desktop visual size should stay under 44 and grow only for coarse pointers`,
  );
} else {
  console.log(`OK: desktop .chip min-height ${chipBaseMin[1]}px (< 44)`);
}

if (failures > 0) {
  console.error(`\n${failures} a11y CSS check(s) failed`);
  process.exit(1);
}
console.log("\nOK: a11y CSS checks passed");
