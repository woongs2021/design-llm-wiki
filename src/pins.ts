/**
 * Pins persist in localStorage (browser-local). Not written to the vault.
 * Replaces curated Collections for personal “keep on top” in Archive.
 */
const KEY = "design-llm-wiki-pins";

export function readPins(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function writePins(slugs: string[]): void {
  const unique = [...new Set(slugs)];
  localStorage.setItem(KEY, JSON.stringify(unique));
}

export function togglePin(slug: string): string[] {
  const current = readPins();
  const next = current.includes(slug)
    ? current.filter((item) => item !== slug)
    : [...current, slug];
  writePins(next);
  return readPins();
}

export function isPinned(slug: string, pins = readPins()): boolean {
  return pins.includes(slug);
}
