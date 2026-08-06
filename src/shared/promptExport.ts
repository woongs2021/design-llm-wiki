import type { CaptureRecord, WikiPageRecord } from "./index-types.ts";
import { wikiPagesForCapture } from "./related.ts";

export type PromptExportInput = {
  captures: CaptureRecord[];
  wikiPages: WikiPageRecord[];
  includeBodies?: boolean;
};

/**
 * Single source for prompt preview and clipboard output.
 * Callers must not reformat the string after this function returns.
 */
export function buildPromptExport(input: PromptExportInput): string {
  const includeBodies = input.includeBodies ?? true;
  const blocks: string[] = [
    "# Design LLM Wiki export",
    "",
    `Selected captures: ${input.captures.length}`,
  ];

  for (const capture of input.captures) {
    const relatedWiki = wikiPagesForCapture(capture.slug, input.wikiPages);
    blocks.push("");
    blocks.push(`## ${capture.title}`);
    blocks.push(`- slug: ${capture.slug}`);
    blocks.push(`- service: ${capture.service}`);
    blocks.push(`- platform: ${capture.platform}`);
    blocks.push(`- screenType: ${capture.screenType}`);
    blocks.push(`- uiPatterns: ${capture.uiPatterns.join(", ")}`);
    blocks.push(`- tags: ${capture.tags.join(", ")}`);
    blocks.push(`- insight: ${capture.insight}`);

    if (relatedWiki.length > 0) {
      blocks.push("- related wiki:");
      for (const page of relatedWiki) {
        blocks.push(`  - ${page.title} (${page.id}) — ${page.summary}`);
      }
    }

    if (includeBodies) {
      blocks.push("");
      blocks.push("### Analysis");
      blocks.push(capture.body.trim());
    }
  }

  return `${blocks.join("\n").trim()}\n`;
}
