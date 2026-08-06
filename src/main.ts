import "./shared/tokens.css";
import "./styles/base.css";
import { computeFacetCounts, type FilterState } from "./shared/filter.ts";
import type { SiteIndex } from "./shared/index-types.ts";
import { analyzeLocalFile } from "./local-intake.ts";
import { readPins, togglePin } from "./pins.ts";
import { hrefFor, onRouteChange, parseHash, type Route } from "./router.ts";
import {
  bindArchive,
  renderArchive,
  type ArchiveTab,
} from "./views/archive.ts";
import { bindCaptureDetail, renderCaptureDetail } from "./views/capture.ts";
import { renderHistory } from "./views/history.ts";
import { bindIntake, renderIntake } from "./views/intake.ts";
import { renderNotFound } from "./views/placeholders.ts";

const MODE_KEY = "design-llm-wiki-mode";
const DATA_URL = "./data/index.json";

type Mode = "light" | "dark";
type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; index: SiteIndex };

let loadState: LoadState = { status: "loading" };
let filters: FilterState = {
  query: "",
  platforms: [],
  screenTypes: [],
  uiPatterns: [],
  tags: [],
  tones: [],
};
let pinnedSlugs = readPins();
let archiveTab: ArchiveTab = "all";
let localCaptures: SiteIndex["captures"] = [];
let intakeStatus = "";
let route: Route = parseHash();

function readStoredMode(): Mode {
  return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
}

function applyMode(mode: Mode): void {
  document.documentElement.dataset.theme = "cool";
  document.documentElement.dataset.mode = mode;
  localStorage.setItem(MODE_KEY, mode);
}

function navLink(label: string, href: string, current: boolean): string {
  return `<a class="nav-link${current ? " nav-link--current" : ""}" href="${href}" ${current ? 'aria-current="page"' : ""}>${label}</a>`;
}

function shell(mainHtml: string): string {
  const mode = readStoredMode();
  return `
    <header class="top-nav">
      <a class="wordmark" href="#/">Design LLM Wiki</a>
      <nav class="nav-menu" aria-label="Primary">
        ${navLink("Archive", hrefFor({ name: "archive" }), route.name === "archive")}
        ${navLink("Intake", hrefFor({ name: "intake" }), route.name === "intake")}
        ${navLink("History", hrefFor({ name: "history" }), route.name === "history")}
      </nav>
      <div class="nav-actions">
        <button type="button" class="button button--secondary" id="mode-toggle">${mode === "dark" ? "Dark" : "Light"}</button>
      </div>
    </header>
    <main class="shell" id="main">${mainHtml}</main>
  `;
}

function withLocalCaptures(index: SiteIndex): SiteIndex {
  const captures = [...localCaptures, ...index.captures];
  return {
    ...index,
    target: localCaptures.length > 0 ? `${index.target}+local` : index.target,
    captures,
    facets: computeFacetCounts(captures, {
      query: "",
      platforms: [],
      screenTypes: [],
      uiPatterns: [],
      tags: [],
      tones: [],
    }),
  };
}

function renderMain(): string {
  if (loadState.status === "loading") {
    return `
      <section class="state-panel state-panel--canvas" aria-busy="true">
        <h1 class="state-panel__title">Loading index</h1>
        <p class="state-panel__text">Reading build JSON. Markdown is never fetched by the browser.</p>
      </section>
    `;
  }
  if (loadState.status === "error") {
    return `
      <section class="state-panel state-panel--soft" role="alert">
        <h1 class="state-panel__title">Index failed to load</h1>
        <p class="state-panel__text">${loadState.message}</p>
        <p class="state-panel__text">Run <code>npm run build -- --target=internal</code> before <code>npm run dev</code>.</p>
      </section>
    `;
  }

  const index = withLocalCaptures(loadState.index);
  switch (route.name) {
    case "archive":
      return renderArchive(index, filters, pinnedSlugs, archiveTab);
    case "capture":
      return renderCaptureDetail(
        index,
        route.slug,
        pinnedSlugs,
      );
    case "intake":
      return renderIntake(intakeStatus);
    case "history":
      return renderHistory(index);
    case "notfound":
      return renderNotFound(route.path);
  }
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>("#app");
  if (!app) throw new Error("#app not found");
  applyMode(readStoredMode());
  pinnedSlugs = readPins();
  app.innerHTML = shell(renderMain());

  app.querySelector("#mode-toggle")?.addEventListener("click", () => {
    applyMode(readStoredMode() === "dark" ? "light" : "dark");
    render();
  });

  if (loadState.status !== "ready") return;

  if (route.name === "archive") {
    bindArchive(app, filters, {
      onFilterChange: (next) => {
        const active = document.activeElement as HTMLElement | null;
        const restore = active?.id === "archive-search" ? "search" : null;
        filters = next;
        render();
        if (restore === "search") {
          const search =
            document.querySelector<HTMLInputElement>("#archive-search");
          search?.focus();
          const len = search?.value.length ?? 0;
          search?.setSelectionRange(len, len);
        }
      },
      onClearFilters: () => {
        filters = {
          query: "",
          platforms: [],
          screenTypes: [],
          uiPatterns: [],
          tags: [],
          tones: [],
        };
        render();
        document.querySelector<HTMLInputElement>("#archive-search")?.focus();
      },
      onTabChange: (tab) => {
        archiveTab = tab;
        render();
        document
          .querySelector<HTMLElement>(`[data-archive-tab="${tab}"]`)
          ?.focus();
      },
    });
  }

  if (route.name === "capture") {
    bindCaptureDetail(
      app,
      (slug) => {
        pinnedSlugs = togglePin(slug);
        render();
      },
    );
  }

  if (route.name === "intake") {
    bindIntake(app, {
      onAnalyzeFiles: (files) => {
        void (async () => {
          intakeStatus = `${files.length}개 파일 분석 중...`;
          render();
          try {
            const captures = await Promise.all(files.map(analyzeLocalFile));
            localCaptures = [...captures, ...localCaptures];
            pinnedSlugs = captures.reduce((pins, capture) => {
              if (pins.includes(capture.slug)) return pins;
              return togglePin(capture.slug);
            }, pinnedSlugs);
            intakeStatus = `${captures.length}개 카드가 Archive에 추가되었습니다.`;
            window.location.hash = hrefFor({ name: "archive" }).replace(/^#/, "");
            route = { name: "archive" };
            render();
          } catch (error) {
            intakeStatus =
              error instanceof Error ? error.message : String(error);
            render();
          }
        })();
      },
    });
  }
}

async function loadIndex(): Promise<void> {
  loadState = { status: "loading" };
  render();
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${DATA_URL} → HTTP ${response.status}`);
    }
    const index = (await response.json()) as SiteIndex;
    if (!index || !Array.isArray(index.captures) || !index.facets) {
      throw new Error("Index JSON is missing captures or facets");
    }
    loadState = { status: "ready", index };
  } catch (error) {
    loadState = {
      status: "error",
      message: error instanceof Error ? error.message : String(error),
    };
  }
  render();
}

onRouteChange((next) => {
  route = next;
  render();
});

void loadIndex();
