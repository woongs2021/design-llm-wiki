import { extname, basename } from "./path.ts";
import {
  asString,
  asStringArray,
  type FrontmatterValue,
  type ParsedMarkdown,
} from "./frontmatter.ts";
import {
  ALLOWED_ASSET_EXTENSIONS,
  COPY_TONES,
  DEFAULT_VISIBILITY,
  FORBIDDEN_DERIVED_KEYS,
  PLATFORMS,
  SCREEN_TYPES,
  TAGS,
  TONES,
  UI_PATTERNS,
  VISIBILITIES,
  WIKI_OPERATIONS,
  isInList,
  normalizeTag,
  type CopyTone,
  type Platform,
  type ScreenType,
  type Tag,
  type Tone,
  type UiPattern,
  type Visibility,
  type WikiOperation,
} from "./vocabulary.ts";

export type ValidationIssue = {
  path: string;
  field?: string;
  message: string;
};

export type TagNormalization = {
  path: string;
  raw: string;
  canonical: Tag;
};

export type CaptureFrontmatter = {
  slug: string;
  title: string;
  asset: string;
  visibility: Visibility;
  visibilityDefaulted: boolean;
  capturedAt: string;
  sourceUrl: string | null;
  service: string;
  platform: Platform;
  screenType: ScreenType;
  uiPatterns: UiPattern[];
  tone: Tone;
  copyTone: CopyTone;
  tags: Tag[];
  insight: string;
  appVersion: string | null;
};

export type CollectionFrontmatter = {
  slug: string;
  title: string;
  description: string;
  captures: string[];
};

export type WikiPageFrontmatter = {
  title: string;
  summary: string;
  visibility: Visibility;
  visibilityDefaulted: boolean;
};

export type WikiLogEntry = {
  line: number;
  date: string;
  operation: WikiOperation;
  title: string;
};

export type CaptureValidation = {
  ok: boolean;
  issues: ValidationIssue[];
  capture: CaptureFrontmatter | null;
  tagNormalizations: TagNormalization[];
  body: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOG_RE =
  /^## \[(\d{4}-\d{2}-\d{2})\] (ingest|query|lint) \| (.+)$/;

const REQUIRED_CAPTURE_FIELDS = [
  "slug",
  "title",
  "asset",
  "capturedAt",
  "service",
  "platform",
  "screenType",
  "uiPatterns",
  "tone",
  "copyTone",
  "tags",
  "insight",
] as const;

export function validateCaptureMarkdown(options: {
  path: string;
  folderSlug: string;
  parsed: ParsedMarkdown;
  assetExists: (relativePath: string) => boolean;
}): CaptureValidation {
  const issues: ValidationIssue[] = [];
  const tagNormalizations: TagNormalization[] = [];
  const fm = options.parsed.frontmatter;

  for (const key of Object.keys(fm)) {
    if (FORBIDDEN_DERIVED_KEYS.has(key)) {
      issues.push({
        path: options.path,
        field: key,
        message: `Derived field "${key}" must not be authored; it is computed from the asset file`,
      });
    }
  }

  for (const field of REQUIRED_CAPTURE_FIELDS) {
    if (fm[field] === undefined || fm[field] === null || fm[field] === "") {
      issues.push({
        path: options.path,
        field,
        message: `Missing required field "${field}"`,
      });
    }
  }

  const slug = asString(fm.slug);
  if (slug && !SLUG_RE.test(slug)) {
    issues.push({
      path: options.path,
      field: "slug",
      message: `Invalid slug "${slug}" — use lowercase letters, numbers, hyphens`,
    });
  }
  if (slug && slug !== options.folderSlug) {
    issues.push({
      path: options.path,
      field: "slug",
      message: `slug "${slug}" must match folder name "${options.folderSlug}"`,
    });
  }

  const visibilityRaw = asString(fm.visibility);
  let visibility: Visibility = DEFAULT_VISIBILITY;
  let visibilityDefaulted = false;
  if (visibilityRaw === null || visibilityRaw === "") {
    visibilityDefaulted = true;
  } else if (isInList(VISIBILITIES, visibilityRaw)) {
    visibility = visibilityRaw;
  } else {
    issues.push({
      path: options.path,
      field: "visibility",
      message: `Unknown visibility "${visibilityRaw}"`,
    });
  }

  const platform = requireEnum(fm.platform, PLATFORMS, options.path, "platform", issues);
  const screenType = requireEnum(
    fm.screenType,
    SCREEN_TYPES,
    options.path,
    "screenType",
    issues,
  );
  const tone = requireEnum(fm.tone, TONES, options.path, "tone", issues);
  const copyTone = requireEnum(
    fm.copyTone,
    COPY_TONES,
    options.path,
    "copyTone",
    issues,
  );

  const uiPatternsRaw = asStringArray(fm.uiPatterns);
  const uiPatterns: UiPattern[] = [];
  if (uiPatternsRaw === null) {
    issues.push({
      path: options.path,
      field: "uiPatterns",
      message: "uiPatterns must be a list of strings",
    });
  } else if (uiPatternsRaw.length === 0) {
    issues.push({
      path: options.path,
      field: "uiPatterns",
      message: "uiPatterns must contain at least one pattern",
    });
  } else {
    for (const pattern of uiPatternsRaw) {
      if (isInList(UI_PATTERNS, pattern)) uiPatterns.push(pattern);
      else {
        issues.push({
          path: options.path,
          field: "uiPatterns",
          message: `Unknown UI pattern "${pattern}"`,
        });
      }
    }
  }

  const tagsRaw = asStringArray(fm.tags);
  const tags: Tag[] = [];
  if (tagsRaw === null) {
    issues.push({
      path: options.path,
      field: "tags",
      message: "tags must be a list of strings",
    });
  } else if (tagsRaw.length === 0) {
    issues.push({
      path: options.path,
      field: "tags",
      message: "tags must contain at least one tag",
    });
  } else {
    for (const raw of tagsRaw) {
      const { canonical, fromSynonym } = normalizeTag(raw);
      if (!canonical || !isInList(TAGS, canonical)) {
        issues.push({
          path: options.path,
          field: "tags",
          message: `Unknown tag "${raw}"`,
        });
        continue;
      }
      if (fromSynonym) {
        tagNormalizations.push({
          path: options.path,
          raw,
          canonical,
        });
      }
      if (!tags.includes(canonical)) tags.push(canonical);
    }
  }

  const asset = asString(fm.asset);
  if (asset) {
    if (asset.includes("://") || asset.startsWith("/") || asset.includes("\\")) {
      issues.push({
        path: options.path,
        field: "asset",
        message: `asset must be a same-folder relative path, got "${asset}"`,
      });
    } else if (asset.split("/").some((part) => part === "..")) {
      issues.push({
        path: options.path,
        field: "asset",
        message: `asset must not escape the capture folder, got "${asset}"`,
      });
    } else {
      const ext = extname(asset).toLowerCase();
      if (!ALLOWED_ASSET_EXTENSIONS.has(ext)) {
        issues.push({
          path: options.path,
          field: "asset",
          message: `Unsupported asset extension "${ext}"`,
        });
      }
      if (basename(asset) !== asset && asset.includes("/")) {
        // allow only same-folder simple names (no nested dirs for Phase 1)
        const parts = asset.split("/");
        if (parts.length !== 1) {
          issues.push({
            path: options.path,
            field: "asset",
            message: `asset must live in the same folder as index.md, got "${asset}"`,
          });
        }
      }
      if (!options.assetExists(asset)) {
        issues.push({
          path: options.path,
          field: "asset",
          message: `Asset file not found: "${asset}"`,
        });
      }
    }
  }

  const capturedAt = asString(fm.capturedAt);
  if (capturedAt && !DATE_RE.test(capturedAt)) {
    issues.push({
      path: options.path,
      field: "capturedAt",
      message: `capturedAt must be YYYY-MM-DD, got "${capturedAt}"`,
    });
  }

  const title = asString(fm.title);
  const service = asString(fm.service);
  const insight = asString(fm.insight);
  const sourceUrl = asString(fm.sourceUrl);
  const appVersion = asString(fm.appVersion);

  if (issues.length > 0) {
    return {
      ok: false,
      issues,
      capture: null,
      tagNormalizations,
      body: options.parsed.body,
    };
  }

  return {
    ok: true,
    issues: [],
    capture: {
      slug: slug!,
      title: title!,
      asset: asset!,
      visibility,
      visibilityDefaulted,
      capturedAt: capturedAt!,
      sourceUrl,
      service: service!,
      platform: platform!,
      screenType: screenType!,
      uiPatterns,
      tone: tone!,
      copyTone: copyTone!,
      tags,
      insight: insight!,
      appVersion,
    },
    tagNormalizations,
    body: options.parsed.body,
  };
}

export function validateCollectionMarkdown(options: {
  path: string;
  fileSlug: string;
  parsed: ParsedMarkdown;
  knownCaptureSlugs: Set<string>;
}): { ok: boolean; issues: ValidationIssue[]; collection: CollectionFrontmatter | null } {
  const issues: ValidationIssue[] = [];
  const fm = options.parsed.frontmatter;

  for (const field of ["slug", "title", "description", "captures"] as const) {
    if (fm[field] === undefined || fm[field] === null || fm[field] === "") {
      issues.push({
        path: options.path,
        field,
        message: `Missing required field "${field}"`,
      });
    }
  }

  const slug = asString(fm.slug);
  if (slug && slug !== options.fileSlug) {
    issues.push({
      path: options.path,
      field: "slug",
      message: `slug "${slug}" must match filename "${options.fileSlug}"`,
    });
  }

  const captures = asStringArray(fm.captures);
  if (captures === null) {
    issues.push({
      path: options.path,
      field: "captures",
      message: "captures must be a list of slugs",
    });
  } else {
    for (const captureSlug of captures) {
      if (!options.knownCaptureSlugs.has(captureSlug)) {
        issues.push({
          path: options.path,
          field: "captures",
          message: `Unknown capture slug "${captureSlug}"`,
        });
      }
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues, collection: null };
  }

  return {
    ok: true,
    issues: [],
    collection: {
      slug: slug!,
      title: asString(fm.title)!,
      description: asString(fm.description)!,
      captures: captures!,
    },
  };
}

export function validateWikiPageMarkdown(options: {
  path: string;
  parsed: ParsedMarkdown;
}): {
  ok: boolean;
  issues: ValidationIssue[];
  page: WikiPageFrontmatter | null;
} {
  const issues: ValidationIssue[] = [];
  const fm = options.parsed.frontmatter;
  const title = asString(fm.title);
  const summary = asString(fm.summary);

  if (!title) {
    issues.push({
      path: options.path,
      field: "title",
      message: 'Missing required field "title"',
    });
  }
  if (!summary) {
    issues.push({
      path: options.path,
      field: "summary",
      message: 'Missing required field "summary"',
    });
  }

  const visibilityRaw = asString(fm.visibility);
  let visibility: Visibility = DEFAULT_VISIBILITY;
  let visibilityDefaulted = false;
  if (visibilityRaw === null || visibilityRaw === "") {
    visibilityDefaulted = true;
  } else if (isInList(VISIBILITIES, visibilityRaw)) {
    visibility = visibilityRaw;
  } else {
    issues.push({
      path: options.path,
      field: "visibility",
      message: `Unknown visibility "${visibilityRaw}"`,
    });
  }

  if (issues.length > 0) return { ok: false, issues, page: null };
  return {
    ok: true,
    issues: [],
    page: {
      title: title!,
      summary: summary!,
      visibility,
      visibilityDefaulted,
    },
  };
}

export function parseWikiLog(path: string, text: string): {
  ok: boolean;
  issues: ValidationIssue[];
  entries: WikiLogEntry[];
} {
  const issues: ValidationIssue[] = [];
  const entries: WikiLogEntry[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  lines.forEach((line, index) => {
    if (!line.startsWith("## [")) return;
    const match = line.match(LOG_RE);
    if (!match) {
      issues.push({
        path,
        field: `line ${index + 1}`,
        message: `Invalid log heading "${line}" — expected "## [YYYY-MM-DD] <ingest|query|lint> | <title>"`,
      });
      return;
    }
    const operation = match[2];
    if (!isInList(WIKI_OPERATIONS, operation)) {
      issues.push({
        path,
        field: `line ${index + 1}`,
        message: `Unknown wiki operation "${operation}"`,
      });
      return;
    }
    entries.push({
      line: index + 1,
      date: match[1],
      operation,
      title: match[3],
    });
  });

  return { ok: issues.length === 0, issues, entries };
}

export function extractWikiIndexLinks(indexBody: string): string[] {
  const links: string[] = [];
  const re = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
  for (const match of indexBody.matchAll(re)) {
    links.push(match[2].replace(/^\.\//, ""));
  }
  return links;
}

/** Capture slug references from wiki/collection markdown bodies. */
export function extractCaptureSlugRefs(
  text: string,
  knownCaptureSlugs: Set<string>,
): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g)) {
    const slug = match[1]!;
    if (knownCaptureSlugs.has(slug)) found.add(slug);
  }
  for (const match of text.matchAll(
    /captures\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/|\.md|\))/g,
  )) {
    const slug = match[1]!;
    if (knownCaptureSlugs.has(slug)) found.add(slug);
  }
  return [...found].sort();
}

function requireEnum<T extends string>(
  value: FrontmatterValue | undefined,
  list: readonly T[],
  path: string,
  field: string,
  issues: ValidationIssue[],
): T | null {
  const raw = asString(value);
  if (!raw) return null;
  if (isInList(list, raw)) return raw;
  issues.push({
    path,
    field,
    message: `Unknown ${field} "${raw}"`,
  });
  return null;
}
