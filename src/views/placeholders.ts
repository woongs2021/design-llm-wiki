import { escapeHtml } from "../lib/dom.ts";

export function renderNotFound(path: string): string {
  return `
    <section class="state-panel state-panel--tint">
      <h1 class="state-panel__title">Route not found</h1>
      <p class="state-panel__text">No page for <code>${escapeHtml(path)}</code>.</p>
      <p><a class="button button--secondary" href="#/">Back to gallery</a></p>
    </section>
  `;
}
