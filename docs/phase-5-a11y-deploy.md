# Phase 5 — Accessibility And Manual Deploy

목표: 대비, 키보드, 터치, 번들 경계, GitHub Pages 제약을 최종 점검하고 사람이 실행하는 배포 절차를 문서화한다.

참조 결정: `D-02`, `D-03`, `D-10`, `D-11`, `D-12`, `D-15`, `D-16`, `D-17`

## 작업 계획

| 작업 | 계획 | 검증 |
|---|---|---|
| 대비 감사 | Phase 0의 토큰 대비 검증을 실제 화면에서 쓰는 색면/잉크 조합 전체로 확장한다. 각 항목은 `body 4.5:1`, `large 3:1`, `ui 3:1` 중 기준을 데이터로 명시한다. | `npm run check:contrast` 실행 시 light/dark 전체 쌍이 통과해야 한다. 기준이 비어 있는 쌍이 있으면 실패해야 한다. |
| focus-visible 감사 | 모든 인터랙티브 요소에 전역 `:focus-visible`이 적용되는지 확인한다. | 키보드 Tab으로 네비, 모드 토글, 검색, 필터, 카드, 상세 액션, 프롬프트 복사까지 링이 보여야 한다. |
| 키보드 완주 | 마우스 없이 핵심 흐름을 완주한다. | Tab/Enter/Escape만으로 갤러리 진입, 필터 적용, 상세 열기, 선택 추가, 프롬프트 복사까지 완료해야 한다. |
| 터치 타깃 감사 | coarse pointer에서만 작은 칩과 버튼의 클릭 영역을 넓힌다. 데스크톱 외형을 별도로 키우지 않는다. | 모바일 에뮬레이션에서 필터 칩과 버튼 터치 영역이 44px 이상이어야 한다. 데스크톱 뷰포트에서는 시각 크기가 디자인과 맞아야 한다. |
| public 번들 누출 점검 | public 빌드에 internal slug, internal 분석 텍스트, internal 자산, internal wiki 페이지와 참조가 없는지 확인한다. | `rg -n '<internal-only-marker>' dist/public` 결과가 0줄이어야 한다. public 폴더에 internal 자산 파일명이 없어야 하고, internal 캡처를 참조하는 wiki 페이지가 없어야 한다. |
| Pages 용량 점검 | 빌드 리포트의 총 바이트와 GitHub Pages 1GB 한도를 비교한다. Git 단일 파일 100MB 초과 파일은 배포 전 실패로 본다. | `npm run report`가 전체 바이트, 1GB 대비 잔여, 100MB 초과 파일 목록을 출력해야 한다. 100MB 초과 파일이 있으면 배포 전 중단한다. |
| 수동 internal 배포 | 사람이 `internal` 타깃 빌드와 배포 명령을 작업창에서 실행한다. watcher, GitHub Actions 자동 배포, 파일 변경 감지 빌드를 만들지 않는다. | 배포 직전 실행한 명령 로그가 남아야 한다. 배포 URL에서 갤러리와 상세가 동작해야 한다. |
| 수동 public 배포 | 사람이 `public` 타깃 빌드와 배포 명령을 별도로 실행한다. public 번들은 internal 번들과 다른 산출물로 취급한다. | public URL에서 internal marker 검색 결과가 0건이어야 한다. public 통계 합계가 public 항목 수와 일치해야 한다. |
| 파생 산출물 누락 점검 | 파생 산출물을 커밋하는 정책을 선택했다면, 빌드 후 변경된 파일이 모두 포함됐는지 확인한다. | 배포 직전 `git status --porcelain`이 의도한 상태여야 한다. 커밋 정책이 dist 커밋이라면 누락된 dist 파일이 없어야 한다. |
| 문서 수치 재측정 | 문서에 개수나 크기를 적은 경우 빌드 리포트 수치로 갱신한다. 추정으로 통과시키지 않는다. | `npm run report`의 총 캡처 수, public/internal 수, 총 바이트와 README 또는 운영 문서의 수치가 일치해야 한다. |

## 배포 절차 원칙

- 배포는 자동화하지 않는다.
- 빌드와 배포는 사람이 작업창에서 실행한다.
- public과 internal은 별도 빌드 산출물이다.
- public 산출물은 내부 데이터를 가리는 것이 아니라 포함하지 않는다.
- LLM Wiki 페이지도 public/internal 경계를 따른다.
- 배포 전에 빌드 리포트를 읽고 제외·실패·상한 항목을 확인한다.

## 사용자 확인 필요

| 항목 | 이유 |
|---|---|
| `dist/` 커밋 정책 | 같은 브랜치에 커밋할지, Pages 브랜치에만 둘지에 따라 마지막 검증 명령이 달라진다. |
| 사외 공개용 도메인과 repo | public 배포 URL과 base path를 확정해야 한다. |
| 폰트 public 재배포 | public 번들에 Samsung Sharp Sans를 포함할 수 있는지 확인해야 한다. |

## 통과 기준

- 접근성 검증은 추정이 아니라 실행 결과로 통과한다.
- public 번들에는 internal 데이터, 자산, wiki 참조가 없다.
- GitHub Pages 한도를 리포트로 확인하고, 초과 항목을 사용자에게 알린다.
- 배포는 사람이 실행하며 자동 watcher나 CI 배포를 만들지 않는다.
