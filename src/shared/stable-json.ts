/** Deterministic JSON: sorted object keys, stable array order left to caller. */

export function stableStringify(value: unknown, space = 2): string {
  return `${JSON.stringify(sortValue(value), null, space)}\n`;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortValue(obj[key]);
    }
    return sorted;
  }
  return value;
}
