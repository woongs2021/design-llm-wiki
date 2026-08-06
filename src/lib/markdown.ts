import { escapeHtml } from "./dom.ts";
import { hrefFor } from "../router.ts";

/** Minimal Markdown rendering for vault bodies. Not a full parser. */
export function renderMarkdownLite(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeList();
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      html.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
      continue;
    }
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${inline(trimmed.slice(2))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(trimmed)}</p>`);
  }
  closeList();
  return html.join("\n");
}

function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(
    /\[\[([a-z0-9]+(?:-[a-z0-9]+)*)\]\]/g,
    (_match, slug: string) =>
      `<a href="${hrefFor({ name: "capture", slug })}">${slug}</a>`,
  );
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, href: string) => {
      // Wiki pages live in Obsidian; web History shows log only — keep md links as plain text.
      if (href.endsWith(".md") && !href.includes("://")) {
        return `<span>${label}</span>`;
      }
      return `<a href="${escapeHtml(href)}">${label}</a>`;
    },
  );
  return out;
}
