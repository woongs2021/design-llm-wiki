# Phase 1 — Schema And Vault Contract

목표: Obsidian에서 사람이 쓰는 Markdown 계약과 빌드·UI가 공유할 스키마를 먼저 확정한다. 파일에서 파생 가능한 값은 Markdown에 쓰지 않는다.

참조 결정: `D-01`, `D-03`, `D-05`, `D-06`, `D-08`, `D-10`, `D-14`, `D-16`, `D-17`

## 볼트 구조

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
    <collection-slug>.md
  _templates/
    capture.md
```

## 캡처 노트 계약

`obsidian/captures/<slug>/index.md`는 사람이 쓰는 분석과 참조만 가진다. 아래 값은 파일에서 파생하므로 frontmatter에 쓰지 않는다.

- 이미지 치수
- 파일 크기
- 포맷 판정
- 프레임 수
- 재생 시간
- 파일 해시
- public/internal 번들 내 복사 경로

## 작업 계획

| 작업 | 계획 | 검증 |
|---|---|---|
| 공유 스키마 | `src/shared/schema.ts`에 캡처와 컬렉션 스키마를 둔다. 빌드 스크립트와 UI는 이 모듈을 import한다. | `npm run validate` 실행 시 샘플 노트가 통과한다. 필수 필드를 하나 지우면 파일 경로와 필드명을 출력하고 exit 1이어야 한다. |
| 통제 어휘 | `src/shared/vocabulary.ts`에 플랫폼, 화면 유형, UI 패턴, 톤, 컬러 역할, 카피 톤, 태그 동의어 사전을 둔다. 제외·예외 규칙은 주석이 아니라 배열과 맵으로 표현한다. | 등록되지 않은 플랫폼이나 화면 유형을 넣으면 `npm run validate`가 실패해야 한다. 동의어 태그는 정규 태그로 변환된 결과가 리포트에 나타나야 한다. |
| visibility 계약 | `visibility: internal | public`을 둔다. 값이 없으면 `internal`로 처리하되, 빌드 리포트에 기본값 적용 건수를 출력한다. | `visibility`가 없는 샘플 1건을 빌드하면 internal 번들에만 포함되고, 리포트에 기본값 적용 1건이 표시되어야 한다. |
| 자산 참조 | frontmatter의 `asset`은 같은 폴더 안의 상대 경로만 허용한다. 외부 URL은 출처로만 기록하고 웹 자산으로 취급하지 않는다. | `../`로 상위 폴더 자산을 참조하거나 존재하지 않는 파일명을 쓰면 `npm run validate`가 실패해야 한다. |
| 분석 항목 | `D-08`의 10개 항목을 frontmatter와 본문 섹션으로 나눈다. 패싯 검색에 필요한 값은 frontmatter, 긴 관찰은 본문에 둔다. | 샘플 노트에서 패싯 필드가 JSON에 구조화되어 나오고, 본문 분석 섹션은 상세 페이지에서 Markdown 콘텐츠로 표시되어야 한다. |
| LLM Wiki 스키마 | `obsidian/wiki/`에 index, log, patterns, services, comparisons, questions 구조를 둔다. 페이지 형식과 operation 규칙은 `docs/llm-wiki-model.md`를 따른다. | `obsidian/wiki/index.md`와 `obsidian/wiki/log.md`가 없으면 `npm run validate`가 실패해야 한다. wiki 페이지가 존재하면 index에 링크되어야 한다. |
| Wiki 로그 형식 | `obsidian/wiki/log.md`는 append-only로 다룬다. 각 항목은 `## [YYYY-MM-DD] <operation> | <title>` 형식으로 시작한다. | `ingest`, `query`, `lint` 외 operation명이 들어가면 `npm run validate`가 실패해야 한다. 로그 제목 형식이 다르면 파일 경로와 줄을 출력해야 한다. |
| Obsidian 템플릿 | `obsidian/_templates/capture.md`를 만든다. 파생 메타 필드는 포함하지 않고, 사람이 판단해야 하는 항목과 출처만 포함한다. | 템플릿에 `width`, `height`, `fileSize`, `format`, `frameCount`, `duration`, `hash` 필드가 없어야 한다. |
| 샘플 캡처 | 스틸 1건, 모션 1건, public 1건, internal 1건을 포함하도록 최소 샘플을 만든다. | `npm run validate`와 `npm run build -- --target=internal`, `npm run build -- --target=public`이 샘플 기준으로 모두 통과해야 한다. |

## 파생 불가 항목

아래 항목은 파일만으로 계산할 수 없으므로 사람이 Markdown에 쓴다. 각 항목은 `docs/authoring-guide.md`에서 작성 기준을 별도로 둔다.

| 항목 | 파생 불가 이유 |
|---|---|
| 출처 URL | 파일에는 원본 서비스 URL이 내장되어 있지 않다. |
| 촬영일 | 파일 `mtime`은 다운로드, 복사, Git 체크아웃으로 바뀔 수 있다. |
| 서비스/제품명 | 파일명에서 추정할 수 있지만 신뢰할 수 없다. |
| 앱 버전 | 캡처 파일만으로 알 수 없다. |
| 화면 유형, UI 패턴, 레이아웃 구조 | 사람의 해석이 필요한 분류다. |
| 톤과 컬러 관찰 | 대표 색 추출은 가능하지만 디자인 의도와 역할은 판단이 필요하다. |
| 타이포 관찰 | 이미지에서 글꼴을 안정적으로 확정할 수 없다. |
| 카피 톤 | 문맥 판단이 필요하다. |
| 인터랙션 | 정지 캡처만으로는 실제 동작을 알 수 없고, 모션도 전체 상태를 보장하지 않는다. |
| 한 줄 인사이트 | 사람이 활용 목적에 맞춰 작성하는 요약이다. |

## 통과 기준

- Markdown에는 파생 가능한 자산 메타가 없다.
- 빌드와 UI가 같은 스키마·어휘 모듈을 사용한다.
- 예외 규칙이 문장 주석이 아니라 데이터 구조로 강제된다.
- 샘플이 internal/public 번들 경계를 검증한다.
- LLM Wiki의 `index.md`와 `log.md`가 wiki 지식층의 탐색과 이력 기준점으로 존재한다.
