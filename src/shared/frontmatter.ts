/**
 * Minimal frontmatter parser for vault Markdown.
 * CRLF is normalized to LF before parsing for deterministic builds later.
 */

export type FrontmatterValue = string | number | boolean | null | string[];

export type ParsedMarkdown = {
  frontmatter: Record<string, FrontmatterValue>;
  body: string;
  raw: string;
};

export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function parseMarkdown(raw: string): ParsedMarkdown {
  const normalized = normalizeNewlines(raw);
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized, raw: normalized };
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return { frontmatter: {}, body: normalized, raw: normalized };
  }

  const yaml = normalized.slice(4, end);
  const body = normalized.slice(end + 5);
  return {
    frontmatter: parseSimpleYaml(yaml),
    body,
    raw: normalized,
  };
}

/**
 * Supports the subset we author: scalars, inline lists, and block lists.
 * Not a general YAML parser — keep capture notes inside this subset.
 */
export function parseSimpleYaml(yaml: string): Record<string, FrontmatterValue> {
  const result: Record<string, FrontmatterValue> = {};
  const lines = yaml.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (!line.trim() || line.trimStart().startsWith("#")) {
      i += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!match) {
      throw new Error(`Unsupported frontmatter line: ${line}`);
    }

    const key = match[1];
    const rest = match[2] ?? "";

    if (rest === "" || rest === "|" || rest === ">") {
      const items: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? "";
        const item = next.match(/^\s+-\s+(.*)$/);
        if (!item) break;
        items.push(unwrapScalar(item[1] ?? ""));
        i += 1;
      }
      result[key] = items;
      continue;
    }

    if (rest.startsWith("[") && rest.endsWith("]")) {
      const inner = rest.slice(1, -1).trim();
      result[key] = inner
        ? inner.split(",").map((part) => unwrapScalar(part.trim()))
        : [];
      i += 1;
      continue;
    }

    result[key] = coerceScalar(unwrapScalar(rest));
    i += 1;
  }

  return result;
}

function unwrapScalar(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function coerceScalar(value: string): FrontmatterValue {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null" || value === "~" || value === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function asString(value: FrontmatterValue | undefined): string | null {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

export function asStringArray(
  value: FrontmatterValue | undefined,
): string[] | null {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item === "string")) return value;
    return null;
  }
  if (typeof value === "string") return [value];
  return null;
}
