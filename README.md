# Design LLM Wiki

사이트: [https://woongs2021.github.io/design-llm-wiki/](https://woongs2021.github.io/design-llm-wiki/)

디자인 캡처를 Obsidian Markdown 볼트에 아카이빙하고, 작업창의 LLM이 분석과 wiki 지식층을 점진적으로 유지하며, 사람이 실행한 빌드로 생성된 JSON을 정적 웹사이트에서 검색·탐색·활용하는 사내 위키 프로젝트다. 로컬호스트 Intake는 임시 리뷰용 업로드 카드만 만들며 vault를 쓰지 않는다.

현재 상태: **Phase 5 이후 IA 정리**. 웹 네비는 **Archive / Intake / Design System / Stats / History**. Intake는 드래그앤드롭 이미지 분석 데모를 브라우저 메모리에 만들고, Archive는 카드와 Pin을 보여 준다. Design System은 Archive 분석 결과 기반 생성 명령을 안내하고, 웹 History는 `wiki/log.md` 작업 이력만 보여 준다. 배포는 수동만: [docs/deploy.md](docs/deploy.md).

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
| [docs/phase-6-intake-ingest.md](docs/phase-6-intake-ingest.md) | 로컬 ingest 스크립트로 vault 영구 저장 + 실제 LLM 분석(구현됨, `npm run ingest`). |
| [docs/phase-7-design-system.md](docs/phase-7-design-system.md) | Archive 분석 결과로 디자인 시스템(`design-system.md`) 생성(구현됨, `npm run design-system`). |
| [docs/phase-8-marketing-image-generation.md](docs/phase-8-marketing-image-generation.md) | 확정된 디자인 시스템 기반 마케팅·브랜딩 이미지 생성 계획(계획만, 미구현). |

## Phase 요약

| Phase | 요약 | 검증 기준 |
|---|---|---|
| 0 | 토큰과 접근성 기본값을 먼저 고정한다. | 색상 hex 단일 원천, 대비 스크립트, focus-visible, coarse pointer 터치 타깃. |
| 1 | Obsidian Markdown, LLM Wiki 구조, 공유 스키마 계약을 확정한다. | `npm run validate`가 필수 필드, 어휘, 자산 경로, wiki index/log를 검증. |
| 2 | Markdown과 자산에서 결정적 JSON과 번들을 만든다. | CRLF/LF 동일 해시, public 번들 internal 누출 0건, wiki 참조 검증, 빌드 리포트 출력. |
| 3 | 정적 UI 셸과 갤러리 검색을 구현한다. | 웹이 JSON만 읽고, 필터 결과 수가 빌드 카운트와 일치. |
| 4 | 상세, 컬렉션, LLM Wiki 탐색, 통계, 프롬프트 내보내기를 구현한다. | 컬렉션·wiki 참조 무결성, 통계 합계 일치, 미리보기와 복사 문자열 동일. |
| 5 | 접근성과 배포 경계를 감사한다. | 대비·키보드·터치 검증, public 누출 0건, GitHub Pages 한도 리포트 확인. |

> Phase 요약은 최초 계획(Gallery/Collections/Stats/Wiki/Export IA) 기준이다. 실제 배포 IA와 진행 상태는 아래 **개발 현황**을 따른다.

## 개발 현황 (Phase별 실측)

`npm run audit`는 현재 전 단계 통과(exit 0)한다. 아래는 계획 문서(`docs/phase-0~5`) 대비 실제 구현 상태다.

| Phase | 상태 | 실제 구현과 계획 대비 차이 |
|---|---|---|
| 0 Foundation | 완료 | tokens 단일 원천, `check:hex/contrast/a11y-css` 통과, focus-visible, coarse pointer 터치 타깃, Cool Blue 고정, `.gitattributes` LF. |
| 1 Schema | 완료 | `schema.ts`/`vocabulary.ts`, visibility 계약, 자산 상대경로 검증, wiki index/log, 캡처 템플릿, 샘플 16건. `validate` 통과. |
| 2 Build | 완료 | CRLF→LF, 결정적 `stable-json`, 자산 프로브 + GIF 포스터, 태그 정규화, 중복 감지, visibility·wiki 게이트, 빌드 리포트. `public-leak` 통과. MP4/WebM 프로브 경로는 샘플로 미검증. |
| 3 UI/Gallery | 완료 | 앱 셸·해시 라우터·로딩/빈/오류 상태·반응형(마소너리)·다크 모드·키보드·텍스트 검색 구현. 패싯 필터는 Archive에서 접힌 `Filters` 패널로 제공한다. |
| 4 Detail 외 | 축소 | 상세 페이지 + 관련 캡처 구현(스파이더 다이어그램 추가). Collections·Wiki 카탈로그·Prompt Export 화면은 제품 범위에서 제외했다. Stats는 유지한다. |
| 5 A11y/Deploy | 완료(감사) | `audit.ts`가 대비·키보드 체크리스트·public 누출·Pages 용량을 점검하고 `deploy.md`가 있다. 단, 실제 배포는 미실행·미검증. |
| Post-5 IA 정리 | 진행 | 네비를 Archive/Intake/Design System/Stats/History로 정리. 신규 기능: Intake 로컬 분석 데모, Pin(localStorage), 스파이더 분석 점수, 마소너리, 탭 인디케이터, Design System 생성 안내. phase 문서·`decisions.md` 보강은 남아 있다. |

## 부족한 점 / 기술 부채

1. **문서-구현 불일치**: `docs/phase-3~5`, 위 Phase 요약, `decisions.md` D-09는 옛 IA(Gallery/Collections/Stats/Wiki/Export) 기준이다. 실제 배포 IA는 Archive/Intake/Design System/Stats/History다.
2. **축소된 기능의 잔여 데이터**: Collections/Wiki/Prompt Export 화면은 제거했지만, Obsidian 원천과 빌드 검증 데이터는 아직 남아 있다. 운영 범위에서 완전히 제거할지 별도 결정이 필요하다.
3. **신규 기능 문서 보강 필요**: Intake·Pin·스파이더 점수. 특히 스파이더 점수는 slug 해시 기반 휴리스틱이라 실제 이미지 분석이 아니다 → 사용자 오해 소지.
4. **미해결 결정**: 폰트 라이선스, ffmpeg/ffprobe 의존(MP4/WebM 실검증), `dist/` 커밋 정책, 공개 repo/도메인, 실제 캡처 규모. Git 저장소도 아직 미초기화.

## 재정의된 Phase 계획

Phase 0–2와 5(감사)는 완료이므로 유지보수 대상이다. 아래는 현재 상태에서 다시 세운 전방 계획이다. 각 작업은 검증(verify) 기준으로 닫는다.

**Phase A — 문서·IA 정렬**: 지금 IA(Archive/Intake/Design System/Stats/History)를 진실로 고정한다.
- `docs/phase-3~5`와 `decisions.md` D-09를 현재 IA에 맞게 갱신하거나 "옛 계획" 표기를 남긴다. → verify: 문서의 페이지/네비 서술이 `src/router.ts` 라우트와 일치.
- README Phase 요약과 개발 현황이 어긋나지 않게 유지. → verify: 리뷰 시 두 표의 IA 서술이 모순 없음.

**Phase B — IA 축소 적용**: Archive의 패싯 필터는 접힌 패널로 유지하고, Collections/Wiki/Prompt Export 화면은 제거한다.
- `src/router.ts`와 상단 네비는 Archive/Intake/Design System/Stats/History만 노출한다. → verify: 제거된 URL은 not found로 처리되고 `npm run audit` 통과.
- Obsidian 원천과 빌드 검증 데이터까지 제거할지 별도 결정한다. → verify: 완전 제거를 선택하면 관련 schema/test/report도 함께 정리.

**Phase C — 신규 기능 정식화**: Intake·Pin·스파이더 점수를 문서와 테스트로 승격한다.
- Intake/Pin 동작을 `docs`와 `decisions.md`에 기록하고 단위 테스트를 추가. → verify: 새 테스트가 `audit`에 편입되어 통과.
- 스파이더 점수의 성격을 명확히 한다: (a) 라벨을 "데모 점수"로 표기하거나 (b) 빌드에서 파생하는 실제 지표로 교체. → verify: 화면 문구가 점수 산출 근거와 일치.

**Phase D — 실 데이터 & 배포 실행**: 더미를 넘어 실제 운영을 연다.
- 실제 캡처 도입 후 용량 리포트 확인, internal/public 수동 배포를 실제로 실행·검증. → verify: 배포 URL에서 갤러리·상세 동작, public에서 internal 마커 0건.
- `dist/` 커밋 정책·공개 repo/도메인·폰트 라이선스·ffmpeg 의존을 확정. → verify: `decisions.md` "사용자 확인 필요"에서 각 항목이 결정으로 이동.

**Phase E — 로컬 ingest & 실제 LLM 분석 (구현됨)**: 브라우저 Intake는 미리보기로 두고, 사람이 실행하는 로컬 스크립트로 캡처를 vault에 영구 저장하고 실제 LLM 분석 초안을 만든다. 상세는 [docs/phase-6-intake-ingest.md](docs/phase-6-intake-ingest.md).
- `scripts/ingest.ts` + `npm run ingest -- <image>`로 `obsidian/captures/<slug>/`에 원본 저장 + frontmatter/분석 초안 생성. 통제 어휘 밖 값은 안전 기본값으로 보정하고 `검토 필요` 섹션에 기록. LLM 키는 로컬 Node의 env(또는 `.env`)에서만 읽는다. → verify: 브라우저는 키 미보유, ingest는 사람이 명령 실행, `validate` 통과 확인 완료.
- 결정 확정(사외 프로젝트 전제): OpenAI 호환 vision(`INGEST_MODEL`/`OPENAI_BASE_URL`로 교체), 외부 전송 허용, env/`.env` 키, 자동 커밋 없음, 모션은 사람 작성 대기. 사내 적용 시 재확인 대상.

**Phase F — Design System 생성 (구현됨)**: Archive에서 좁힌 캡처 분석 결과로 LLM이 디자인 시스템 문서·토큰 초안을 생성한다. 상세는 [docs/phase-7-design-system.md](docs/phase-7-design-system.md).
- `Design System` 탭은 "아직 준비중입니다." 문구를 유지하면서 현재 Archive 조건의 대상 캡처 수와 컬러·폰트/타이포·마진/간격·컴포넌트 형태 요약, 로컬 CLI 명령을 표시한다. → verify: `#/design-system` 진입 시 비주얼 요소별 요약과 `npm run design-system` 명령이 보인다.
- `scripts/design-system.ts` + `npm run design-system -- --name <name> --slugs <slug...>`로 `obsidian/design-systems/<name>/design-system.md`, `sources.md`, `tokens.json`을 생성한다. 생성물은 시스템 `design.md`와 이름·위치가 분리되어 있으며, 이후 마케팅·브랜딩 이미지 생성의 기준으로 확장 예정.

**Phase G — 마케팅·브랜딩 이미지 생성 (계획만, 미구현)**: 사람이 검토·확정한 디자인 시스템을 기준으로 마케팅용·브랜딩용 이미지 생성을 준비한다. 상세는 [docs/phase-8-marketing-image-generation.md](docs/phase-8-marketing-image-generation.md).
- 입력은 확정된 `obsidian/design-systems/<name>/design-system.md`와 `tokens.json`이다. → verify: 미확정 디자인 시스템으로는 이미지 생성을 시작하지 않는다.
- 생성 방식은 아직 구현하지 않는다. 이미지 모델, 저작권·브랜드 정책, 산출물 저장 위치, 사람 승인 기준을 나중에 확정한 뒤 로컬 CLI 방식으로 착수한다. → verify: 현재 코드/라우트/스크립트에는 이미지 생성 기능이 없다.

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
