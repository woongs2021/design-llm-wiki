import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const ALLOWED = new Set(["src/shared/tokens.css"]);
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) out.push(...walk(path));
    else if (/\.(css|ts|tsx|html)$/.test(name)) out.push(path);
  }
  return out;
}

let hits = 0;

for (const file of walk(ROOT)) {
  const rel = relative(".", file).replaceAll("\\", "/");
  if (ALLOWED.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    const matches = line.match(HEX_RE);
    if (!matches) return;
    hits += matches.length;
    console.log(`${rel}:${index + 1}: ${line.trim()}`);
  });
}

if (hits === 0) {
  console.log("OK: no hex colors outside src/shared/tokens.css");
  process.exit(0);
}

console.error(`\nFAIL: ${hits} hex color(s) outside tokens.css`);
process.exit(1);
