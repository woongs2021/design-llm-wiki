import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export type TokenMap = Record<string, string>;

const TOKEN_RE = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;

function extractBlock(css: string, selectorPattern: RegExp): string {
  const match = css.match(selectorPattern);
  if (!match) return "";
  return match[1] ?? "";
}

function parseDeclarations(block: string): TokenMap {
  const map: TokenMap = {};
  for (const match of block.matchAll(TOKEN_RE)) {
    map[`--${match[1]}`] = match[2].trim();
  }
  return map;
}

export function loadTokenMaps(tokensPath = resolve("src/shared/tokens.css")): {
  any: TokenMap;
  light: TokenMap;
  dark: TokenMap;
} {
  const css = readFileSync(tokensPath, "utf8");

  const rootBlock = extractBlock(
    css,
    /:root\s*,\s*html\[data-theme="cool"\]\s*\{([\s\S]*?)\}/,
  );
  const lightBlock = extractBlock(
    css,
    /html\[data-mode="light"\]\s*,\s*:root\s*\{([\s\S]*?)\}/,
  );
  const darkBlock = extractBlock(
    css,
    /html\[data-mode="dark"\]\s*\{([\s\S]*?)\}/,
  );

  const any = parseDeclarations(rootBlock);
  const light = { ...any, ...parseDeclarations(lightBlock) };
  const dark = { ...any, ...parseDeclarations(darkBlock) };

  return { any, light, dark };
}
