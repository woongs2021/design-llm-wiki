import { assetUrl, escapeHtml } from "../lib/dom.ts";
import { renderMarkdownLite } from "../lib/markdown.ts";
import { hrefFor } from "../router.ts";
import { getCaptureScores, totalScore } from "../shared/analysis-scores.ts";
import type { CaptureRecord, SiteIndex } from "../shared/index-types.ts";
import { relatedCaptureSlugs } from "../shared/related.ts";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function mediaBlock(capture: CaptureRecord): string {
  if (capture.asset.kind === "motion") {
    const poster = capture.asset.posterPath
      ? ` poster="${escapeHtml(assetUrl(capture.asset.posterPath))}"`
      : "";
    return `
      <video class="detail-media" controls preload="metadata"${poster}>
        <source src="${escapeHtml(assetUrl(capture.asset.path))}" />
      </video>
    `;
  }
  return `
    <img
      class="detail-media"
      src="${escapeHtml(assetUrl(capture.asset.path))}"
      alt=""
      width="${capture.asset.width}"
      height="${capture.asset.height}"
    />
  `;
}

function renderSpiderDiagram(capture: CaptureRecord): string {
  const scores = getCaptureScores(capture);
  const total = capture.analysisTotal ?? totalScore(scores);
  const center = 160;
  const radius = 110;
  const grid = [0.25, 0.5, 0.75, 1]
    .map((scale) =>
      scores
        .map((_score, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
          const x = center + Math.cos(angle) * radius * scale;
          const y = center + Math.sin(angle) * radius * scale;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" "),
    )
    .map((points) => `<polygon class="spider-grid" points="${points}" />`)
    .join("");
  const polygon = scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
      const scaled = radius * (score.score / 100);
      const x = center + Math.cos(angle) * scaled;
      const y = center + Math.sin(angle) * scaled;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const axes = scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / scores.length;
      const x = center + Math.cos(angle) * radius;
      const y = center + Math.sin(angle) * radius;
      const px = center + Math.cos(angle) * radius * (score.score / 100);
      const py = center + Math.sin(angle) * radius * (score.score / 100);
      const labelX = center + Math.cos(angle) * (radius + 26);
      const labelY = center + Math.sin(angle) * (radius + 26);
      return `
        <g class="spider-axis" tabindex="0">
          <line class="spider-axis__line" x1="${center}" y1="${center}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" />
          <circle class="spider-point" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="6" />
          <text class="spider-label" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}">${escapeHtml(score.label)}</text>
          <text class="spider-callout" x="${labelX.toFixed(1)}" y="${(labelY + 18).toFixed(1)}">${score.score}</text>
        </g>
      `;
    })
    .join("");

  return `
    <section class="detail__section analysis-score">
      <div class="analysis-score__summary">
        <p class="detail__eyebrow">Image analysis score</p>
        <h2>총합 점수 ${total}</h2>
        <p class="detail__empty">항목 위에 마우스를 올리거나 키보드 포커스를 주면 해당 점수가 강조됩니다.</p>
      </div>
      <div class="spider-layout">
        <svg class="spider-chart" viewBox="0 0 320 320" role="img" aria-label="이미지 분석 스파이더 다이어그램">
          ${grid}
          <polygon class="spider-area" points="${polygon}" />
          ${axes}
        </svg>
        <dl class="score-list">
          ${scores
            .map(
              (score) => `
            <div class="score-list__item">
              <dt>${escapeHtml(score.label)} <strong>${score.score}</strong></dt>
              <dd>${escapeHtml(score.description)}</dd>
            </div>
          `,
            )
            .join("")}
        </dl>
      </div>
    </section>
  `;
}

function renderHashtags(capture: CaptureRecord): string {
  const keywords = [
    ...capture.tags,
    ...capture.uiPatterns,
    capture.screenType,
    capture.platform,
    capture.tone,
    capture.copyTone,
  ];
  return [...new Set(keywords)]
    .map(
      (keyword) =>
        `<span class="chip detail-hashtag" aria-pressed="true">#${escapeHtml(keyword)}</span>`,
    )
    .join("");
}

export function renderCaptureDetail(
  index: SiteIndex,
  slug: string,
  pinned: string[],
): string {
  const capture = index.captures.find((item) => item.slug === slug);
  if (!capture) {
    return `
      <section class="state-panel state-panel--soft">
        <h1 class="state-panel__title">Capture not found</h1>
        <p class="state-panel__text">${escapeHtml(slug)} is not in this bundle.</p>
        <p><a class="button button--secondary" href="#/">Back to Archive</a></p>
      </section>
    `;
  }

  const related = relatedCaptureSlugs(capture, index.captures)
    .map((relatedSlug) => index.captures.find((item) => item.slug === relatedSlug))
    .filter((item): item is CaptureRecord => Boolean(item));
  const isPinned = pinned.includes(slug);

  return `
    <article class="detail">
      <header class="detail__header">
        <div>
          <p class="detail__eyebrow">${escapeHtml(capture.service)} · ${escapeHtml(capture.platform)}</p>
          <h1 class="detail__title">${escapeHtml(capture.title)}</h1>
          <p class="detail__insight">${escapeHtml(capture.insight)}</p>
        </div>
        <div class="detail__actions">
          <button type="button" class="button button--secondary" data-pin-slug="${escapeHtml(slug)}" aria-pressed="${isPinned ? "true" : "false"}">
            ${isPinned ? "Unpin" : "Pin"}
          </button>
          <a class="button button--secondary" href="#/">Archive</a>
        </div>
      </header>

      <div class="detail__media-wrap detail__hero">${mediaBlock(capture)}</div>

      ${renderSpiderDiagram(capture)}

      <section class="detail__section">
        <h2>Derived asset meta</h2>
        <dl class="meta-grid">
          <div><dt>Format</dt><dd>${escapeHtml(capture.asset.format)}</dd></div>
          <div><dt>Kind</dt><dd>${escapeHtml(capture.asset.kind)}</dd></div>
          <div><dt>Dimensions</dt><dd>${capture.asset.width} × ${capture.asset.height}</dd></div>
          <div><dt>Bytes</dt><dd>${formatBytes(capture.asset.bytes)}</dd></div>
          <div><dt>Frame count</dt><dd>${capture.asset.frameCount ?? "—"}</dd></div>
          <div><dt>Duration</dt><dd>${capture.asset.durationSec ?? "—"}</dd></div>
          <div class="meta-grid__wide"><dt>Hash</dt><dd><code>${escapeHtml(capture.asset.hash)}</code></dd></div>
        </dl>
      </section>

      <section class="detail__section">
        <h2>Hashtags</h2>
        <p class="detail__chips">
          ${renderHashtags(capture)}
        </p>
        <p class="detail__meta-line">
          ${escapeHtml(capture.screenType)} · ${escapeHtml(capture.tone)} · ${escapeHtml(capture.copyTone)} · ${escapeHtml(capture.capturedAt)}
          ${capture.sourceUrl ? ` · <a href="${escapeHtml(capture.sourceUrl)}">${escapeHtml(capture.sourceUrl)}</a>` : ""}
        </p>
      </section>

      <section class="detail__section prose">
        <h2>Analysis</h2>
        ${renderMarkdownLite(capture.body)}
      </section>

      <section class="detail__section">
        <h2>Related captures</h2>
        ${
          related.length === 0
            ? `<p class="detail__empty">No related captures with shared tags or UI patterns.</p>`
            : `<div class="link-list">${related
                .map(
                  (item) => `
              <a class="link-card" href="${hrefFor({ name: "capture", slug: item.slug })}">
                <strong>${escapeHtml(item.title)}</strong>
                <span>${escapeHtml(item.insight)}</span>
              </a>`,
                )
                .join("")}</div>`
        }
      </section>
    </article>
  `;
}

export function bindCaptureDetail(
  root: HTMLElement,
  onTogglePin: (slug: string) => void,
): void {
  root
    .querySelector<HTMLButtonElement>("[data-pin-slug]")
    ?.addEventListener("click", (event) => {
      const slug = (event.currentTarget as HTMLButtonElement).dataset.pinSlug;
      if (slug) onTogglePin(slug);
    });
}
