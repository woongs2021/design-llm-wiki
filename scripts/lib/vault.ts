import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, relative, resolve } from "node:path";
import { parseMarkdown } from "../../src/shared/frontmatter.ts";
import {
  extractWikiIndexLinks,
  parseWikiLog,
  validateCaptureMarkdown,
  validateCollectionMarkdown,
  validateWikiPageMarkdown,
  type CaptureFrontmatter,
  type CollectionFrontmatter,
  type TagNormalization,
  type ValidationIssue,
  type WikiLogEntry,
  type WikiPageFrontmatter,
} from "../../src/shared/schema.ts";
import { WIKI_PAGE_DIRS } from "../../src/shared/vocabulary.ts";

export const VAULT_ROOT = resolve("obsidian");
export const CAPTURES_DIR = join(VAULT_ROOT, "captures");
export const COLLECTIONS_DIR = join(VAULT_ROOT, "collections");
export const WIKI_DIR = join(VAULT_ROOT, "wiki");
export const WIKI_INDEX_PATH = join(WIKI_DIR, "index.md");
export const WIKI_LOG_PATH = join(WIKI_DIR, "log.md");

export type LoadedCapture = {
  path: string;
  folderPath: string;
  capture: CaptureFrontmatter;
  body: string;
  tagNormalizations: TagNormalization[];
};

export type LoadedCollection = {
  path: string;
  collection: CollectionFrontmatter;
  body: string;
};

export type LoadedWikiPage = {
  path: string;
  relativeLink: string;
  page: WikiPageFrontmatter;
  body: string;
  raw: string;
};

export type VaultLoadResult = {
  issues: ValidationIssue[];
  captures: LoadedCapture[];
  collections: LoadedCollection[];
  wikiPages: LoadedWikiPage[];
  wikiIndexBody: string;
  wikiLogEntries: WikiLogEntry[];
  visibilityDefaults: number;
  tagNormalizations: TagNormalization[];
};

function rel(path: string): string {
  return relative(process.cwd(), path).replaceAll("\\", "/");
}

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .map((name) => join(dir, name))
    .filter((path) => statSync(path).isDirectory())
    .sort();
}

function listMarkdown(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => join(dir, name))
    .sort();
}

export function loadVault(): VaultLoadResult {
  const issues: ValidationIssue[] = [];
  const captures: LoadedCapture[] = [];
  const collections: LoadedCollection[] = [];
  const wikiPages: LoadedWikiPage[] = [];
  const tagNormalizations: TagNormalization[] = [];
  let visibilityDefaults = 0;
  let wikiIndexBody = "";
  let wikiLogEntries: WikiLogEntry[] = [];

  if (!existsSync(WIKI_INDEX_PATH)) {
    issues.push({
      path: rel(WIKI_INDEX_PATH),
      message: "Required wiki catalog file is missing",
    });
  }
  if (!existsSync(WIKI_LOG_PATH)) {
    issues.push({
      path: rel(WIKI_LOG_PATH),
      message: "Required wiki log file is missing",
    });
  }

  for (const dir of listDirs(CAPTURES_DIR)) {
    const folderSlug = basename(dir);
    const indexPath = join(dir, "index.md");
    if (!existsSync(indexPath)) {
      issues.push({
        path: rel(indexPath),
        message: "Capture folder is missing index.md",
      });
      continue;
    }
    try {
      const parsed = parseMarkdown(readFileSync(indexPath, "utf8"));
      const result = validateCaptureMarkdown({
        path: rel(indexPath),
        folderSlug,
        parsed,
        assetExists: (asset) => existsSync(join(dir, asset)),
      });
      issues.push(...result.issues);
      tagNormalizations.push(...result.tagNormalizations);
      if (result.capture) {
        if (result.capture.visibilityDefaulted) visibilityDefaults += 1;
        captures.push({
          path: rel(indexPath),
          folderPath: dir,
          capture: result.capture,
          body: result.body,
          tagNormalizations: result.tagNormalizations,
        });
      }
    } catch (error) {
      issues.push({
        path: rel(indexPath),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const knownCaptureSlugs = new Set(captures.map((c) => c.capture.slug));

  for (const file of listMarkdown(COLLECTIONS_DIR)) {
    try {
      const parsed = parseMarkdown(readFileSync(file, "utf8"));
      const result = validateCollectionMarkdown({
        path: rel(file),
        fileSlug: basename(file, ".md"),
        parsed,
        knownCaptureSlugs,
      });
      issues.push(...result.issues);
      if (result.collection) {
        collections.push({
          path: rel(file),
          collection: result.collection,
          body: parsed.body,
        });
      }
    } catch (error) {
      issues.push({
        path: rel(file),
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const dirName of WIKI_PAGE_DIRS) {
    const dir = join(WIKI_DIR, dirName);
    for (const file of listMarkdown(dir)) {
      const relativeLink = `${dirName}/${basename(file)}`;
      try {
        const raw = readFileSync(file, "utf8");
        const parsed = parseMarkdown(raw);
        const result = validateWikiPageMarkdown({
          path: rel(file),
          parsed,
        });
        issues.push(...result.issues);
        if (result.page) {
          if (result.page.visibilityDefaulted) visibilityDefaults += 1;
          wikiPages.push({
            path: rel(file),
            relativeLink,
            page: result.page,
            body: parsed.body,
            raw: parsed.raw,
          });
        }
      } catch (error) {
        issues.push({
          path: rel(file),
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  if (existsSync(WIKI_INDEX_PATH)) {
    const indexText = readFileSync(WIKI_INDEX_PATH, "utf8");
    wikiIndexBody = parseMarkdown(indexText).body;
    const links = new Set(extractWikiIndexLinks(wikiIndexBody));
    for (const page of wikiPages) {
      if (!links.has(page.relativeLink) && !links.has(`./${page.relativeLink}`)) {
        issues.push({
          path: rel(WIKI_INDEX_PATH),
          field: page.relativeLink,
          message: `Wiki page "${page.relativeLink}" exists but is not linked from wiki/index.md`,
        });
      }
    }
  }

  if (existsSync(WIKI_LOG_PATH)) {
    const logResult = parseWikiLog(
      rel(WIKI_LOG_PATH),
      readFileSync(WIKI_LOG_PATH, "utf8"),
    );
    issues.push(...logResult.issues);
    wikiLogEntries = logResult.entries;
  }

  captures.sort((a, b) => {
    if (a.capture.capturedAt !== b.capture.capturedAt) {
      return a.capture.capturedAt < b.capture.capturedAt ? 1 : -1;
    }
    return a.capture.slug.localeCompare(b.capture.slug);
  });
  collections.sort((a, b) => a.collection.slug.localeCompare(b.collection.slug));
  wikiPages.sort((a, b) => a.relativeLink.localeCompare(b.relativeLink));

  return {
    issues,
    captures,
    collections,
    wikiPages,
    wikiIndexBody,
    wikiLogEntries,
    visibilityDefaults,
    tagNormalizations,
  };
}
