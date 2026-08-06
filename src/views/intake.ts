import { escapeHtml } from "../lib/dom.ts";

export type IntakeCallbacks = {
  onAnalyzeFiles: (files: File[]) => void;
};

export function renderIntake(status = ""): string {
  return `
    <section class="page intake">
      <header class="page__header">
        <div>
          <h1 class="page__title">Intake</h1>
          <p class="page__meta">로컬호스트에서 캡처 이미지를 드래그앤드롭하고 분석하면 Archive에 카드가 추가됩니다. 이 데모 분석은 브라우저 메모리에만 남습니다.</p>
        </div>
      </header>

      <div class="intake-dropzone" id="intake-dropzone">
        <input id="intake-file" class="intake-dropzone__input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple />
        <div class="intake-dropzone__content">
          <h2 class="intake-dropzone__title">이미지를 여기에 드롭</h2>
          <p class="intake-dropzone__text">PNG, JPG, WebP, GIF를 지원합니다. 파일은 서버로 업로드되지 않고 현재 브라우저 세션에서만 분석됩니다.</p>
          <label class="button" for="intake-file">Choose files</label>
        </div>
      </div>

      <div class="intake-actions">
        <button type="button" class="button" id="analyze-files" disabled>Analyze</button>
        <p class="intake-status" id="intake-status" aria-live="polite">${escapeHtml(status || "파일을 선택하면 Analyze 버튼이 활성화됩니다.")}</p>
      </div>

      <section class="detail__section">
        <h2>동작 방식</h2>
        <ul class="plain-list">
          <li>브라우저에 LLM API 키를 두지 않습니다.</li>
          <li>분석은 파일명, 이미지 크기, 비율, 형식에서 만든 로컬 데모 분석입니다.</li>
          <li>Analyze 후 Archive에 카드가 추가되고, 카드를 클릭하면 hero 이미지와 스파이더 다이어그램이 보입니다.</li>
          <li>영구 보존하려면 기존처럼 Obsidian vault에 캡처를 넣고 ingest/build를 실행합니다.</li>
        </ul>
      </section>
    </section>
  `;
}

export function bindIntake(root: HTMLElement, callbacks: IntakeCallbacks): void {
  const input = root.querySelector<HTMLInputElement>("#intake-file");
  const dropzone = root.querySelector<HTMLElement>("#intake-dropzone");
  const analyze = root.querySelector<HTMLButtonElement>("#analyze-files");
  const status = root.querySelector<HTMLElement>("#intake-status");
  let files: File[] = [];

  const setFiles = (next: File[]) => {
    files = next.filter((file) => file.type.startsWith("image/"));
    if (analyze) analyze.disabled = files.length === 0;
    if (status) {
      status.textContent =
        files.length === 0
          ? "분석 가능한 이미지 파일이 없습니다."
          : `${files.length}개 파일 준비됨. Analyze를 누르면 Archive에 카드가 추가됩니다.`;
    }
  };

  input?.addEventListener("change", () => {
    setFiles(Array.from(input.files ?? []));
  });

  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("intake-dropzone--active");
  });

  dropzone?.addEventListener("dragleave", () => {
    dropzone.classList.remove("intake-dropzone--active");
  });

  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("intake-dropzone--active");
    setFiles(Array.from(event.dataTransfer?.files ?? []));
  });

  analyze?.addEventListener("click", () => {
    if (files.length === 0) return;
    callbacks.onAnalyzeFiles(files);
  });
}
