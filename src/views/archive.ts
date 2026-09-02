import {
  filterCaptures,
  sortCaptures,
  type FilterState,
} from "../shared/filter.ts";
import type {
  CaptureRecord,
  FacetCounts,
  SiteIndex,
} from "../shared/index-types.ts";
import { assetUrl, escapeHtml } from "../lib/dom.ts";
import { hrefFor } from "../router.ts";

type FacetDim = {
  dim: keyof FacetCounts;
  field: "platforms" | "screenTypes" | "uiPatterns" | "tones" | "tags";
  label: string;
};

const FACET_DIMS: FacetDim[] = [
  { dim: "platform", field: "platforms", label: "Platform" },
  { dim: "screenType", field: "screenTypes", label: "Screen type" },
  { dim: "uiPattern", field: "uiPatterns", label: "UI pattern" },
  { dim: "tone", field: "tones", label: "Tone" },
  { dim: "tag", field: "tags", label: "Tags" },
];

function facetEntries(counts: Record<string, number>): [string, number][] {
  return Object.entries(counts).sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function activeFacetCount(filters: FilterState): number {
  return FACET_DIMS.reduce(
    (sum, { field }) => sum + filters[field].length,
    0,
  );
}

export function toggleFacet(
  filters: FilterState,
  field: FacetDim["field"],
  value: string,
): FilterState {
  const current = filters[field];
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
  return { ...filters, [field]: next };
}

function renderFacets(index: SiteIndex, filters: FilterState): string {
  const groups = FACET_DIMS.map(({ dim, field, label }) => {
    const entries = facetEntries(index.facets[dim]);
    if (entries.length === 0) return "";
    const chips = entries
      .map(([value, count]) => {
        const pressed = filters[field].includes(value);
        return `
          <button type="button" class="chip" data-facet-field="${field}" data-facet-value="${escapeHtml(value)}" aria-pressed="${pressed ? "true" : "false"}">
            ${escapeHtml(value)} <span class="chip__count">${count}</span>
          </button>`;
      })
      .join("");
    return `
      <div class="facet-group">
        <h2 class="facet-group__title">${label}</h2>
        <div class="facet-group__chips">${chips}</div>
      </div>
    `;
  }).join("");

  const active = activeFacetCount(filters);
  const clear =
    active > 0
      ? `<button type="button" class="button button--secondary" id="archive-clear-facets">Clear filters (${active})</button>`
      : "";

  return `
    <details class="archive-filter-panel" ${active > 0 ? "open" : ""}>
      <summary class="archive-filter-panel__summary">
        Filters${active > 0 ? ` (${active} active)` : ""}
      </summary>
      <div class="archive-filter-panel__body">
        ${clear}${groups}
      </div>
    </details>
  `;
}

export type ArchiveTab = "all" | "pin";

export type ArchiveCallbacks = {
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
  onTabChange: (tab: ArchiveTab) => void;
};

let lastTabIndicator: { left: number; width: number } | null = null;

function syncTabIndicator(root: HTMLElement): void {
  const indicator = root.querySelector<HTMLElement>(".archive-tabs__indicator");
  const selected = root.querySelector<HTMLElement>(
    '.archive-tab[aria-selected="true"]',
  );
  if (!indicator || !selected) return;

  const left = selected.offsetLeft;
  const width = selected.offsetWidth;

  if (lastTabIndicator) {
    indicator.style.transition = "none";
    indicator.style.transform = `translateX(${lastTabIndicator.left}px)`;
    indicator.style.width = `${lastTabIndicator.width}px`;
    void indicator.offsetWidth;
    indicator.style.transition = "";
  }

  requestAnimationFrame(() => {
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    lastTabIndicator = { left, width };
  });
}

function layoutMasonry(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>(".capture-grid");
  if (!grid) return;

  const styles = window.getComputedStyle(grid);
  const rowHeight = Number.parseFloat(styles.gridAutoRows) || 1;
  const rowGap = Number.parseFloat(styles.rowGap) || 0;

  grid.querySelectorAll<HTMLElement>(".capture-card").forEach((card) => {
    card.style.gridRowEnd = "";
    const height = card.getBoundingClientRect().height;
    const marginBottom =
      Number.parseFloat(window.getComputedStyle(card).marginBottom) || 0;
    const span = Math.ceil(
      (height + marginBottom + rowGap) / (rowHeight + rowGap),
    );
    card.style.gridRowEnd = `span ${Math.max(1, span)}`;
  });
}

function cardImage(capture: CaptureRecord): string {
  const src =
    capture.asset.kind === "motion" && capture.asset.posterPath
      ? capture.asset.posterPath
      : capture.asset.path;
  return `<img class="capture-card__media" src="${escapeHtml(assetUrl(src))}" alt="" loading="lazy" width="${capture.asset.width}" height="${capture.asset.height}" />`;
}

function renderCard(capture: CaptureRecord, pinned: boolean): string {
  return `
    <article class="capture-card${pinned ? " capture-card--pinned" : ""}">
      <a class="capture-card__link" href="${hrefFor({ name: "capture", slug: capture.slug })}">
        <div class="capture-card__frame">
          ${cardImage(capture)}
          <span class="capture-card__kind">${escapeHtml(capture.asset.kind)}</span>
          ${pinned ? `<span class="capture-card__pin-badge">Pinned</span>` : ""}
        </div>
        <div class="capture-card__body">
          <h2 class="capture-card__title">${escapeHtml(capture.title)}</h2>
          <p class="capture-card__insight">${escapeHtml(capture.insight)}</p>
        </div>
      </a>
    </article>
  `;
}

function orderWithPins(
  captures: CaptureRecord[],
  pinnedSlugs: string[],
): CaptureRecord[] {
  const pinSet = new Set(pinnedSlugs);
  const sorted = sortCaptures(captures);
  const pinned = sorted.filter((c) => pinSet.has(c.slug));
  const rest = sorted.filter((c) => !pinSet.has(c.slug));
  const bySlug = new Map(sorted.map((c) => [c.slug, c]));
  const pinnedOrdered = pinnedSlugs
    .map((slug) => bySlug.get(slug))
    .filter((c): c is CaptureRecord => Boolean(c));
  const pinnedExtra = pinned.filter((c) => !pinnedSlugs.includes(c.slug));
  return [...pinnedOrdered, ...pinnedExtra, ...rest];
}

export function renderArchive(
  index: SiteIndex,
  filters: FilterState,
  pinnedSlugs: string[],
  tab: ArchiveTab,
): string {
  const searched = filterCaptures(index.captures, filters);
  const pinSet = new Set(pinnedSlugs);
  const scoped =
    tab === "pin"
      ? searched.filter((capture) => pinSet.has(capture.slug))
      : searched;
  const filtered = orderWithPins(scoped, pinnedSlugs);

  if (index.captures.length === 0) {
    return `
      <section class="state-panel state-panel--soft" aria-live="polite">
        <h1 class="state-panel__title">Archive is empty</h1>
        <p class="state-panel__text">이 번들에 캡처가 없습니다. <a href="#/intake">Intake</a>에서 넣는 방법을 확인하세요.</p>
      </section>
    `;
  }

  return `
    <section class="gallery archive">
      <header class="gallery__header archive__header">
        <div>
          <h1 class="gallery__title">Archive</h1>
          <p class="gallery__meta">Target ${escapeHtml(index.target)} · ${filtered.length} of ${index.captures.length} · ${pinnedSlugs.length} pinned</p>
        </div>
      </header>

      <div class="archive-search-panel">
        <label class="search-field archive-search">
          <span class="search-field__label">Search archive</span>
          <input id="archive-search" class="search-field__input archive-search__input" type="search" value="${escapeHtml(filters.query)}" placeholder="타이틀, 서비스, 태그, 패턴, 인사이트 검색…" />
          ${
            filters.query
              ? `<button type="button" class="archive-search__clear" id="archive-search-clear" aria-label="검색어 지우기">×</button>`
              : ""
          }
        </label>
      </div>

      <div class="archive-filter-wrap">
        <div class="gallery__filters" aria-label="Facet filters">
          ${renderFacets(index, filters)}
        </div>
      </div>

      <div class="archive-tabs" role="tablist" aria-label="Archive lists">
        <span class="archive-tabs__indicator" aria-hidden="true"></span>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-all" data-archive-tab="all" aria-selected="${tab === "all" ? "true" : "false"}">
          All <span class="archive-tab__count">${searched.length}</span>
        </button>
        <button type="button" class="archive-tab" role="tab" id="archive-tab-pin" data-archive-tab="pin" aria-selected="${tab === "pin" ? "true" : "false"}">
          Pin <span class="archive-tab__count">${pinnedSlugs.length}</span>
        </button>
      </div>

      <div class="gallery__results archive__results" aria-live="polite">
        ${
          filtered.length === 0
            ? `<section class="state-panel state-panel--tint">
                <h2 class="state-panel__title">${tab === "pin" ? "No pinned captures" : "No matches"}</h2>
                <p class="state-panel__text">${
                  tab === "pin"
                    ? "상세 화면에서 Pin을 누르면 이 탭에 모입니다."
                    : "검색어나 필터를 지우거나 더 넓은 조건으로 다시 시도하세요."
                }</p>
              </section>`
            : `<div class="capture-grid">${filtered
                .map((capture) =>
                  renderCard(capture, pinnedSlugs.includes(capture.slug)),
                )
                .join("")}</div>`
        }
      </div>
    </section>
  `;
}

export function bindArchive(
  root: HTMLElement,
  filters: FilterState,
  callbacks: ArchiveCallbacks,
): void {
  const search = root.querySelector<HTMLInputElement>("#archive-search");
  search?.addEventListener("input", () => {
    callbacks.onFilterChange({ ...filters, query: search.value });
  });
  search?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      callbacks.onClearFilters();
    }
  });

  root.querySelector("#archive-search-clear")?.addEventListener("click", () => {
    callbacks.onClearFilters();
  });

  root
    .querySelector("#archive-clear-facets")
    ?.addEventListener("click", () => callbacks.onClearFilters());

  root.querySelectorAll<HTMLButtonElement>("[data-facet-field]").forEach((button) => {
    button.addEventListener("click", () => {
      const field = button.dataset.facetField as FacetDim["field"] | undefined;
      const value = button.dataset.facetValue;
      if (!field || value === undefined) return;
      callbacks.onFilterChange(toggleFacet(filters, field, value));
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-archive-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.archiveTab;
      if (next === "all" || next === "pin") callbacks.onTabChange(next);
    });
  });

  syncTabIndicator(root);
  requestAnimationFrame(() => layoutMasonry(root));

  root.querySelectorAll<HTMLImageElement>(".capture-card__media").forEach((image) => {
    image.addEventListener("load", () => layoutMasonry(root), { once: true });
  });

  const observer = new ResizeObserver(() => layoutMasonry(root));
  const grid = root.querySelector<HTMLElement>(".capture-grid");
  if (grid) observer.observe(grid);
}
