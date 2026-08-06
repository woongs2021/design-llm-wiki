# Design LLM Wiki

디자인 캡처를 Obsidian Markdown 볼트에 아카이빙하고, 작업창의 LLM이 분석과 wiki 지식층을 점진적으로 유지하며, 사람이 실행한 빌드로 생성된 JSON을 정적 웹사이트에서 검색·탐색·활용하는 사내 위키 프로젝트다. 로컬호스트 Intake는 임시 리뷰용 업로드 카드만 만들며 vault를 쓰지 않는다.

현재 상태: **Phase 5 이후 IA 정리**. 웹 네비는 **Archive / Intake / History**. Intake는 드래그앤드롭 이미지 분석 데모를 브라우저 메모리에 만들고, Archive는 카드와 Pin을 보여 준다. 위키 본문은 Obsidian에 두고, 웹 History는 `wiki/log.md` 작업 이력만 보여 준다. 배포는 수동만: [docs/deploy.md](docs/deploy.md).

## 핵심 원칙

- Obsidian 볼트의 Markdown이 단일 진실 원천이다.
- 웹은 빌드된 JSON과 정적 자산만 읽는다.
- 영구 보존용 이미지 분석, 인덱스 빌드 실행, 배포는 자동화하지 않고 사람이 작업창에서 요청하거나 실행한다. Intake의 로컬 분석은 브라우저 세션용 데모 데이터다.
- 파일에서 계산 가능한 값은 Markdown에 쓰지 않고 빌드에서 파생한다.
- Andrej Karpathy의 LLM Wiki 패턴을 적용해 `captures`는 원천, `obsidian/wiki/`는 누적 지식층, 문서와 루트 지침은 schema 역할을 한다.
- 빌드 스크립트와 UI는 스키마, 어휘, 필터, 내보내기 규칙을 같은 모듈에서 가져온다.
- public 번들은 internal 데이터를 가리는 것이 아니라 포함하지 않는다.

## 문서

| 문서 | 역할 |
|---|---|
| [docs/decisions.md](docs/decisions.md) | 결정표의 단일 원천. 근거와 탈락한 대안을 여기에서만 관리한다. |
| [docs/llm-wiki-model.md](docs/llm-wiki-model.md) | Karpathy LLM Wiki 패턴을 이 프로젝트에 적용한 계층, operation, 파일 규칙. |
| [docs/authoring-guide.md](docs/authoring-guide.md) | 캡처 1건을 Obsidian에 작성하는 방법과 분석 항목 기준. |
| [docs/deploy.md](docs/deploy.md) | 수동 배포 절차. CI/watcher 자동 배포 없음. |
| [docs/phase-0-foundation.md](docs/phase-0-foundation.md) | 토큰, 대비, 포커스, 터치 타깃, 결정성 기반 계획. |
| [docs/phase-1-schema.md](docs/phase-1-schema.md) | Markdown 스키마, 볼트 구조, 통제 어휘 계획. |
| [docs/phase-2-build.md](docs/phase-2-build.md) | 파생 메타, 이중 번들, 빌드 리포트 계획. |
| [docs/phase-3-gallery.md](docs/phase-3-gallery.md) | UI 셸, 해시 라우터, 갤러리, 검색 계획. |
| [docs/phase-4-features.md](docs/phase-4-features.md) | 상세, 컬렉션, 통계, 프롬프트 내보내기 계획. |
| [docs/phase-5-a11y-deploy.md](docs/phase-5-a11y-deploy.md) | 접근성 감사와 수동 배포 계획. |

## Phase 요약

| Phase | 요약 | 검증 기준 |
|---|---|---|
| 0 | 토큰과 접근성 기본값을 먼저 고정한다. | 색상 hex 단일 원천, 대비 스크립트, focus-visible, coarse pointer 터치 타깃. |
| 1 | Obsidian Markdown, LLM Wiki 구조, 공유 스키마 계약을 확정한다. | `npm run validate`가 필수 필드, 어휘, 자산 경로, wiki index/log를 검증. |
| 2 | Markdown과 자산에서 결정적 JSON과 번들을 만든다. | CRLF/LF 동일 해시, public 번들 internal 누출 0건, wiki 참조 검증, 빌드 리포트 출력. |
| 3 | 정적 UI 셸과 갤러리 검색을 구현한다. | 웹이 JSON만 읽고, 필터 결과 수가 빌드 카운트와 일치. |
| 4 | 상세, 컬렉션, LLM Wiki 탐색, 통계, 프롬프트 내보내기를 구현한다. | 컬렉션·wiki 참조 무결성, 통계 합계 일치, 미리보기와 복사 문자열 동일. |
| 5 | 접근성과 배포 경계를 감사한다. | 대비·키보드·터치 검증, public 누출 0건, GitHub Pages 한도 리포트 확인. |

## 측정된 빌드 수치 (더미 vault)

`reports/*-build-report.json`에서 읽은 값이다. 추정으로 적지 않는다. 더미 재생성: `npm run seed:dummy`.

| 타깃 | captures | asset bytes | Pages remaining / 1GB |
|---|---|---|---|
| internal | 16/16 | 87341 | 1073654483 / 1073741824 |
| public | 6/16 | 26757 | 1073715067 / 1073741824 |

public 제외: captures/collections 13건, wiki 4건. 자산 미복사 10 files / 56908 bytes. `npm run check:public-leak` 통과.

## 주요 명령

```bash
npm run validate
npm run build -- --target=internal|public
npm run build:site -- --target=internal|public
npm run audit
npm run seed:dummy
npm run dev
```

## 사용자 확인 필요

아래 항목은 아직 확정하지 않는다. 구현 전에 [docs/decisions.md](docs/decisions.md)의 `사용자 확인 필요` 표에서 결정한다.

- Samsung Sharp Sans public 번들 재배포 가능 여부
- `ffmpeg`/`ffprobe` 의존 방식
- 파생 산출물 커밋 정책
- 사외 공개용 repo와 도메인
- 실제 캡처 규모
