import { escapeHtml } from "../lib/dom.ts";
import { filterCaptures, type FilterState } from "../shared/filter.ts";
import type { CaptureRecord, SiteIndex } from "../shared/index-types.ts";
import type { ArchiveTab } from "./archive.ts";

function selectedCaptures(
  index: SiteIndex,
  filters: FilterState,
  archiveTab: ArchiveTab,
  pinnedSlugs: string[],
): CaptureRecord[] {
  const captures = filterCaptures(index.captures, filters);
  if (archiveTab !== "pin") return captures;
  return captures.filter((capture) => pinnedSlugs.includes(capture.slug));
}

function filterSummary(filters: FilterState, archiveTab: ArchiveTab): string[] {
  const rows: string[] = [`tab=${archiveTab}`];
  if (filters.query.trim()) rows.push(`query=${filters.query.trim()}`);
  if (filters.platforms.length) rows.push(`platform=${filters.platforms.join(",")}`);
  if (filters.screenTypes.length) rows.push(`screenType=${filters.screenTypes.join(",")}`);
  if (filters.uiPatterns.length) rows.push(`uiPattern=${filters.uiPatterns.join(",")}`);
  if (filters.tags.length) rows.push(`tag=${filters.tags.join(",")}`);
  if (filters.tones.length) rows.push(`tone=${filters.tones.join(",")}`);
  return rows;
}

function bodySection(body: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = body.match(
    new RegExp(`## ${escaped}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, "i"),
  );
  return match?.[1]?.trim() ?? null;
}

function snippets(captures: CaptureRecord[], heading: string): string {
  const rows = captures
    .map((capture) => {
      const section = bodySection(capture.body, heading);
      if (!section) return null;
      const text =
        section.length > 110 ? `${section.slice(0, 110).trim()}…` : section;
      return `<li><strong>${escapeHtml(capture.slug)}</strong><span>${escapeHtml(text)}</span></li>`;
    })
    .filter((row): row is string => row !== null)
    .slice(0, 3);

  if (rows.length === 0) return "<p>대상 없음</p>";
  return `<ul class="ds-builder__evidence-list">${rows.join("")}</ul>`;
}

function patternSummary(captures: CaptureRecord[]): string {
  const patterns = captures
    .flatMap((capture) => capture.uiPatterns)
    .filter((pattern, index, all) => all.indexOf(pattern) === index)
    .slice(0, 5);
  if (patterns.length === 0) return "<p>대상 없음</p>";
  return `<div class="ds-builder__chips">${patterns
    .map((pattern) => `<span class="chip">${escapeHtml(pattern)}</span>`)
    .join("")}</div>`;
}

function slugArgs(captures: CaptureRecord[]): string {
  return captures.map((capture) => capture.slug).join(" ");
}

export function renderDesignSystem(
  index: SiteIndex,
  filters: FilterState,
  archiveTab: ArchiveTab,
  pinnedSlugs: string[],
): string {
  const captures = selectedCaptures(index, filters, archiveTab, pinnedSlugs);
  const slugs = slugArgs(captures);
  const defaultName = filters.tags[0] ?? filters.uiPatterns[0] ?? "archive-selection";
  const command =
    captures.length > 0
      ? `npm run design-system -- --name ${defaultName} --slugs ${slugs}`
      : "Archive에서 대상 캡처를 먼저 선택하세요.";

  return `
    <section class="ds-builder">
      <header class="ds-builder__hero">
        <span class="coming-soon__badge">준비중</span>
        <h1 class="coming-soon__title">Design System</h1>
        <p class="coming-soon__text">아직 준비중입니다.</p>
        <p class="coming-soon__sub">현재 Archive 조건의 분석 결과를 근거로 <code>design-system.md</code>와 토큰 초안을 만드는 페이지입니다.</p>
      </header>

      <section class="ds-builder__panel" aria-labelledby="ds-selection-title">
        <div>
          <h2 id="ds-selection-title">대상 캡처</h2>
          <p>${captures.length}개 캡처가 현재 Archive 조건에 포함됩니다.</p>
        </div>
        <div class="ds-builder__chips" aria-label="현재 조건">
          ${filterSummary(filters, archiveTab)
            .map((item) => `<span class="chip">${escapeHtml(item)}</span>`)
            .join("")}
        </div>
      </section>

      <section class="ds-builder__grid" aria-label="대상 요약">
        <div class="ds-builder__card">
          <h2>컬러</h2>
          <div class="ds-builder__metric-list">${snippets(captures, "Color")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>폰트 / 타이포</h2>
          <div class="ds-builder__metric-list">${snippets(captures, "Typography")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>마진 / 간격</h2>
          <div class="ds-builder__metric-list">${snippets(captures, "Layout")}</div>
        </div>
        <div class="ds-builder__card">
          <h2>컴포넌트 형태</h2>
          <div class="ds-builder__metric-list">${patternSummary(captures)}</div>
        </div>
      </section>

      <section class="ds-builder__panel ds-builder__panel--command" aria-labelledby="ds-command-title">
        <div>
          <h2 id="ds-command-title">로컬 생성 명령</h2>
          <p>LLM 키는 브라우저에 두지 않습니다. 아래 명령을 터미널에서 실행하면 <code>obsidian/design-systems/&lt;name&gt;/</code>에 초안이 생성됩니다.</p>
        </div>
        <pre class="ds-builder__command"><code>${escapeHtml(command)}</code></pre>
      </section>
    </section>
  `;
}
