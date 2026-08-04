# LLM Wiki Model

이 프로젝트는 Andrej Karpathy의 LLM Wiki 패턴을 디자인 캡처 아카이브에 맞게 적용한다. 핵심은 매번 원본 캡처를 다시 검색해 답을 만드는 것이 아니라, 캡처를 읽고 분석한 결과가 Markdown wiki에 누적되도록 만드는 것이다.

## 적용 방식

| Karpathy LLM Wiki | 이 프로젝트의 대응 |
|---|---|
| Raw sources | `obsidian/captures/<slug>/`의 원본 캡처 자산과 `index.md` |
| Wiki | `obsidian/wiki/`의 패턴, 서비스, 비교, 질문 답변, 종합 페이지 |
| Schema | `CLAUDE.md`, `CURSOR.md`, `docs/decisions.md`, `docs/authoring-guide.md` |
| `index.md` | `obsidian/wiki/index.md` — wiki 페이지 카탈로그 |
| `log.md` | `obsidian/wiki/log.md` — ingest, query, lint 이력 |

## 역할 분담

| 역할 | 책임 |
|---|---|
| 사람 | 캡처를 고르고, 공개 가능 여부를 판단하고, 질문과 활용 방향을 정한다. |
| 작업창의 LLM | 사용자가 명령했을 때 캡처를 읽고 분석을 작성하며, 관련 wiki 페이지와 링크, 로그를 갱신한다. |
| 웹사이트 | 빌드된 JSON과 자산을 읽어 검색, 탐색, 통계, 프롬프트 내보내기를 제공한다. |

LLM은 자동으로 실행되지 않는다. `ingest`, `query`, `lint`는 모두 사용자가 작업창에서 요청할 때만 수행한다. 브라우저에는 LLM API 키를 두지 않는다.

## 계층 구조

```text
obsidian/
  captures/
    <slug>/
      index.md
      <original-asset>
  wiki/
    index.md
    log.md
    patterns/
    services/
    comparisons/
    questions/
  collections/
  _templates/
```

## Operations

| Operation | 입력 | LLM 작업 | 산출 | 검증 |
|---|---|---|---|---|
| Ingest | 새 캡처 폴더 1개 | 원본 캡처와 노트를 읽고 캡처 분석을 정리한다. 관련 패턴·서비스·비교 페이지를 갱신하고 로그를 추가한다. | 캡처 `index.md`, 관련 `obsidian/wiki/**/*.md`, `obsidian/wiki/index.md`, `obsidian/wiki/log.md` | 변경된 wiki 페이지가 새 캡처 slug를 링크해야 한다. 로그에 `ingest` 항목이 1개 추가되어야 한다. |
| Query | 사용자의 질문 | `obsidian/wiki/index.md`를 먼저 읽고 관련 페이지를 따라가 답을 만든다. 가치 있는 답은 `questions/`나 `comparisons/`에 파일로 남긴다. | 답변용 Markdown 페이지 또는 기존 wiki 페이지 갱신 | 답변 페이지가 참조한 캡처 slug와 wiki 페이지 링크를 포함해야 한다. |
| Lint | 기존 wiki 전체 | 고아 페이지, 깨진 링크, 오래된 주장, 충돌 주장, 빠진 역링크, 빈 카테고리를 찾는다. | 수정된 wiki 페이지, lint 로그 | `log.md`에 `lint` 항목이 추가되고, 발견 수와 처리 수가 적힌다. |

## Wiki 페이지 규칙

- `obsidian/wiki/index.md`는 콘텐츠 지향 카탈로그다. 각 페이지 링크, 한 줄 요약, 관련 캡처 수를 가진다.
- `obsidian/wiki/log.md`는 시간순 append-only 기록이다. 각 항목은 `## [YYYY-MM-DD] <operation> | <title>` 형식으로 시작한다.
- 패턴 페이지는 하나의 durable UI 패턴을 다룬다. 예: `patterns/filterable-gallery.md`.
- 서비스 페이지는 특정 제품이나 사내 도구의 관찰을 누적한다. 예: `services/github.md`.
- 비교 페이지는 두 개 이상의 캡처나 패턴을 비교한다.
- 질문 페이지는 사용자가 물은 의미 있는 질문과 그 답을 보존한다.

## 웹사이트와의 관계

웹사이트는 wiki를 직접 편집하지 않는다. Phase 2 빌드는 `captures`, `wiki`, `collections` Markdown을 읽어 JSON으로 만들고, UI는 JSON을 읽기만 한다.

캡처 상세는 원본 캡처 분석을 보여주고, wiki 페이지는 패턴과 비교처럼 시간이 지날수록 누적되는 지식층을 제공한다. 프롬프트 내보내기는 선택한 캡처뿐 아니라 연결된 wiki 페이지를 포함할 수 있지만, 미리보기와 복사 결과는 같은 함수에서 생성해야 한다.

## 금지 사항

- 브라우저에서 LLM API를 호출하지 않는다.
- 파일 변경을 감지해 자동 ingest하지 않는다.
- 질문 답변을 채팅에만 남기고 사라지게 하지 않는다. 사용자가 보존을 원한 답은 wiki 페이지로 남긴다.
- raw source 역할의 원본 캡처 자산을 LLM이 수정하지 않는다.
- public 번들에서 internal 캡처나 internal wiki 페이지를 숨김 처리로만 가리지 않는다. 포함하지 않는다.
