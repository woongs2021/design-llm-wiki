import { escapeHtml } from "../lib/dom.ts";
import { computeCaptureStats, type StatBucket } from "../shared/stats.ts";
import type { SiteIndex } from "../shared/index-types.ts";

function statRows(buckets: StatBucket[]): string {
  const max = buckets.reduce((peak, item) => Math.max(peak, item.count), 0) || 1;
  return `
    <div class="stat-rows">
      ${buckets
        .map(
          (bucket) => `
        <div class="stat-row">
          <span class="stat-row__label">${escapeHtml(bucket.key)}</span>
          <span class="stat-row__track"><span class="stat-row__fill" style="width: ${(
            (bucket.count / max) *
            100
          ).toFixed(1)}%"></span></span>
          <span class="stat-row__count">${bucket.count}</span>
        </div>`,
        )
        .join("")}
    </div>
  `;
}

function statSection(title: string, buckets: StatBucket[]): string {
  if (buckets.length === 0) return "";
  return `
    <section class="detail__section">
      <h2>${escapeHtml(title)}</h2>
      ${statRows(buckets)}
    </section>
  `;
}

export function renderStats(index: SiteIndex): string {
  const stats = computeCaptureStats(index.captures);

  if (stats.total === 0) {
    return `
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">No stats yet</h1>
        <p class="state-panel__text">이 번들에 캡처가 없어 통계를 계산할 수 없습니다.</p>
      </section>
    `;
  }

  const platformCount = stats.platform.length;
  const patternCount = stats.uiPattern.length;

  return `
    <section class="page stats">
      <header class="page__header">
        <div>
          <h1 class="page__title">Stats</h1>
          <p class="page__meta">현재 번들 JSON에서 파생 · target ${escapeHtml(index.target)}</p>
        </div>
      </header>

      <div class="stat-tiles">
        <div class="stat-tile stat-tile--deep">
          <div class="stat-tile__value">${stats.total}</div>
          <div class="stat-tile__label">Captures</div>
        </div>
        <div class="stat-tile stat-tile--soft">
          <div class="stat-tile__value">${platformCount}</div>
          <div class="stat-tile__label">Platforms</div>
        </div>
        <div class="stat-tile">
          <div class="stat-tile__value">${patternCount}</div>
          <div class="stat-tile__label">UI patterns</div>
        </div>
      </div>

      ${statSection("Visibility", stats.visibility)}
      ${statSection("Platform", stats.platform)}
      ${statSection("Screen type", stats.screenType)}
      ${statSection("UI pattern", stats.uiPattern)}
      ${statSection("Tags", stats.tag)}
      ${statSection("Timeline (capturedAt)", stats.timeline)}
    </section>
  `;
}
