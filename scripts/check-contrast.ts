import {
  CONTRAST_PAIRS,
  CONTRAST_THRESHOLDS,
} from "../src/shared/contrast-pairs.ts";
import { contrastRatio, parseCssColor } from "./lib/color.ts";
import { loadTokenMaps } from "./lib/parse-tokens.ts";

const maps = loadTokenMaps();

let failures = 0;

console.log("Contrast check — criterion assigned per pair\n");
console.log(
  [
    "id".padEnd(28),
    "mode".padEnd(6),
    "criterion".padEnd(9),
    "need".padEnd(6),
    "actual".padEnd(8),
    "result",
  ].join(" "),
);
console.log("-".repeat(72));

for (const pair of CONTRAST_PAIRS) {
  if (!pair.criterion || !(pair.criterion in CONTRAST_THRESHOLDS)) {
    failures += 1;
    console.log(
      `${pair.id.padEnd(28)} ${pair.mode.padEnd(6)} FAIL empty/invalid criterion`,
    );
    continue;
  }

  const tokenMap =
    pair.mode === "light"
      ? maps.light
      : pair.mode === "dark"
        ? maps.dark
        : maps.any;

  const fgValue = tokenMap[pair.foreground];
  const bgValue = tokenMap[pair.background];

  if (!fgValue || !bgValue) {
    failures += 1;
    console.log(
      `${pair.id.padEnd(28)} ${pair.mode.padEnd(6)} MISSING TOKEN ${pair.foreground} / ${pair.background}`,
    );
    continue;
  }

  const ratio = contrastRatio(parseCssColor(fgValue), parseCssColor(bgValue));
  const need = CONTRAST_THRESHOLDS[pair.criterion];
  const pass = ratio + 1e-9 >= need;
  if (!pass) failures += 1;

  console.log(
    [
      pair.id.padEnd(28),
      pair.mode.padEnd(6),
      pair.criterion.padEnd(9),
      need.toFixed(1).padEnd(6),
      ratio.toFixed(2).padEnd(8),
      pass ? "PASS" : "FAIL",
    ].join(" "),
  );
  console.log(`  ${pair.note}`);
  console.log(`  ${pair.foreground}=${fgValue} on ${pair.background}=${bgValue}`);
}

console.log("-".repeat(72));
console.log(
  failures === 0
    ? `\nAll ${CONTRAST_PAIRS.length} pairs passed.`
    : `\n${failures} of ${CONTRAST_PAIRS.length} pairs failed.`,
);

process.exit(failures === 0 ? 0 : 1);
