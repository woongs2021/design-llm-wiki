import { escapeHtml } from "../lib/dom.ts";
import type { SiteIndex } from "../shared/index-types.ts";

/** Representative work history from Obsidian wiki log (built into index JSON). */
export function renderHistory(index: SiteIndex): string {
  const entries = index.wiki.logEntries;

  if (entries.length === 0) {
    return `
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">History</h1>
        <p class="state-panel__text">아직 로그가 없습니다. ingest / query / lint 후 <code>obsidian/wiki/log.md</code>에 쌓이면 여기에 표시됩니다.</p>
      </section>
    `;
  }

  return `
    <section class="page history">
      <header class="page__header">
        <div>
          <h1 class="page__title">History</h1>
          <p class="page__meta">Obsidian wiki 로그의 작업 이력 · ${entries.length} entries · target ${escapeHtml(index.target)}</p>
        </div>
      </header>

      <ol class="history-timeline">
        ${entries
          .map(
            (entry) => `
          <li class="history-item">
            <time class="history-item__date" datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time>
            <span class="history-item__op">${escapeHtml(entry.operation)}</span>
            <strong class="history-item__title">${escapeHtml(entry.title)}</strong>
          </li>`,
          )
          .join("")}
      </ol>
    </section>
  `;
}
