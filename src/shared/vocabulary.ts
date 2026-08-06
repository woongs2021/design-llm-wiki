/**
 * Controlled vocabulary and exception rules as data structures.
 * Build scripts and UI import this module — do not duplicate lists elsewhere.
 */

export const PLATFORMS = [
  "web",
  "web-mobile",
  "ios",
  "android",
  "desktop",
] as const;

export const SCREEN_TYPES = [
  "onboarding",
  "dashboard",
  "settings",
  "checkout",
  "empty-state",
  "detail",
  "search",
  "gallery",
  "form",
  "marketing",
] as const;

export const UI_PATTERNS = [
  "card-grid",
  "split-view",
  "command-palette",
  "timeline",
  "filter-chips",
  "tab-row",
  "side-nav",
  "modal",
  "toast",
  "progress-bar",
  "data-table",
  "hero-band",
] as const;

export const TONES = [
  "informational",
  "editorial",
  "urgent",
  "playful",
  "data-dense",
  "calm",
] as const;

export const COPY_TONES = [
  "instructional",
  "imperative",
  "friendly",
  "restrained",
  "tense",
  "neutral",
] as const;

/** Canonical tags allowed after synonym normalization. */
export const TAGS = [
  "gallery",
  "filters",
  "navigation",
  "dashboard",
  "onboarding",
  "density",
  "motion",
  "empty-state",
  "typography",
  "color",
  "forms",
  "cards",
] as const;

/** Synonym → canonical tag. Keys are lowercased before lookup. */
export const TAG_SYNONYMS: Record<string, (typeof TAGS)[number]> = {
  filter: "filters",
  filtering: "filters",
  "card-grid": "cards",
  card: "cards",
  nav: "navigation",
  menu: "navigation",
  animate: "motion",
  animation: "motion",
  type: "typography",
  typo: "typography",
  colour: "color",
  colors: "color",
};

/** Asset extensions allowed as capture sources. Enforced as a set, not comments. */
export const ALLOWED_ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
]);

export const STILL_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
export const MOTION_EXTENSIONS = new Set([".gif", ".mp4", ".webm"]);

export const VISIBILITIES = ["internal", "public"] as const;
export const DEFAULT_VISIBILITY = "internal" as const;

export const WIKI_OPERATIONS = ["ingest", "query", "lint"] as const;

export const WIKI_PAGE_DIRS = [
  "patterns",
  "services",
  "comparisons",
  "questions",
] as const;

/**
 * Frontmatter keys that must never be authored — they are derived from files.
 * Presence fails validation.
 */
export const FORBIDDEN_DERIVED_KEYS = new Set([
  "width",
  "height",
  "fileSize",
  "filesize",
  "format",
  "frameCount",
  "framecount",
  "duration",
  "hash",
  "bytes",
  "bundlePath",
  "bundlepath",
  "poster",
]);

export type Platform = (typeof PLATFORMS)[number];
export type ScreenType = (typeof SCREEN_TYPES)[number];
export type UiPattern = (typeof UI_PATTERNS)[number];
export type Tone = (typeof TONES)[number];
export type CopyTone = (typeof COPY_TONES)[number];
export type Tag = (typeof TAGS)[number];
export type Visibility = (typeof VISIBILITIES)[number];
export type WikiOperation = (typeof WIKI_OPERATIONS)[number];

export function isInList<T extends string>(
  list: readonly T[],
  value: string,
): value is T {
  return (list as readonly string[]).includes(value);
}

export function normalizeTag(raw: string): {
  canonical: string | null;
  fromSynonym: boolean;
} {
  const key = raw.trim().toLowerCase();
  if (!key) return { canonical: null, fromSynonym: false };
  if (isInList(TAGS, key)) return { canonical: key, fromSynonym: false };
  const synonym = TAG_SYNONYMS[key];
  if (synonym) return { canonical: synonym, fromSynonym: true };
  return { canonical: null, fromSynonym: false };
}
