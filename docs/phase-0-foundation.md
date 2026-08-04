# Phase 0 — Foundation

목표: 구현을 시작하기 전에 토큰, 접근성 기본값, 결정성 규칙을 먼저 고정한다. 나중에 감사하면 놓치기 쉬운 대비, 포커스, 터치 타깃, CRLF 정규화를 이 단계에서 막는다.

참조 결정: `D-01`, `D-04`, `D-12`, `D-14`, `D-15`

## 작업 계획

| 작업 | 계획 | 검증 |
|---|---|---|
| 리포 스캐폴딩 | Vite + 바닐라 TypeScript 기반의 최소 파일만 만든다. 라우터는 해시 라우터 전제로 잡고, 서버 런타임을 만들지 않는다. | `npm run dev` 실행 시 빈 앱 셸이 로컬에서 열린다. `npm run build` 실행 시 정적 파일만 생성된다. |
| LF 정규화 | `.gitattributes`에 텍스트 파일 LF 정책을 둔다. Markdown 읽기 로직은 Phase 2에서 CRLF를 LF로 정규화한다. | CRLF로 저장된 테스트 Markdown과 LF Markdown을 같은 내용으로 빌드했을 때 `dist/internal/data/index.json` 해시가 동일해야 한다. |
| 색상 토큰 단일 원천 | `src/shared/tokens.css`를 색상 hex가 존재하는 유일한 UI 스타일 파일로 둔다. 컴포넌트 CSS는 `var(--*)`만 참조한다. | `rg -n '#[0-9a-fA-F]{3,8}' src --glob '!tokens.css'` 결과가 0줄이어야 한다. |
| Cool Blue 테마 고정 | `html`에 `data-theme="cool"`을 기본으로 두고, `data-mode="light|dark"`만 전환한다. 테마 세트 전환 UI는 만들지 않는다. | `document.documentElement.dataset.theme` 값이 `cool`이고, UI에 테마 세트 전환 컨트롤이 없어야 한다. |
| 색면 위 잉크 토큰 | `--on-primary`, `--on-soft`, `--on-tint`, `--on-deep`, `--on-mid`를 만든다. soft/tint 색면의 본문은 `--fg`를 상속하지 않는다. | 다크 모드에서 soft/tint 카드 텍스트가 흰색으로 바뀌지 않아야 한다. `npm run check:contrast`가 soft/tint 텍스트 쌍을 통과해야 한다. |
| 대비 검증 스크립트 | `scripts/check-contrast.ts`는 토큰과 선언된 색상 쌍 목록을 읽는다. 각 쌍은 `body 4.5:1`, `large 3:1`, `ui 3:1` 중 하나를 데이터로 가진다. | `npm run check:contrast` 실행 시 쌍별 기준, 실측값, 판정이 출력된다. 기준 미달 쌍이 하나라도 있으면 exit 1이어야 한다. |
| 전역 포커스 링 | `:focus-visible` 전역 스타일을 초기에 넣는다. 마우스 클릭에는 과하게 보이지 않게 하고, 키보드 탐색에는 명확히 보이게 한다. | 키보드 Tab만으로 모든 링크, 버튼, 필터, 카드에 포커스 링이 보여야 한다. 마우스 클릭 직후에는 불필요한 링이 나타나지 않아야 한다. |
| 터치 타깃 | 작은 칩과 버튼은 `@media (pointer: coarse)`에서만 최소 44px 또는 48px 터치 영역으로 확장한다. 데스크톱 외형은 유지한다. | Chrome DevTools 모바일 에뮬레이션에서 칩/버튼의 클릭 영역이 44px 이상이어야 한다. 데스크톱 폭에서는 기존 시각 크기가 유지되어야 한다. |

## 통과 기준

- 색상 hex는 토큰 파일 한 곳에만 존재한다.
- soft/tint 색면 위 텍스트가 다크 모드에서 `--fg` 상속으로 흰색이 되지 않는다.
- 대비 검증은 기준 종류를 항목마다 명시하고, 잘못된 기준으로 통과시키지 않는다.
- 키보드 포커스와 coarse pointer 터치 타깃이 초기 UI부터 존재한다.

## 사용자 확인 필요

| 항목 | 이유 |
|---|---|
| Samsung Sharp Sans 재배포 가능 여부 | public 번들에 폰트를 포함해도 되는지 라이선스를 확인해야 한다. 확인 전에는 public 타깃에서 시스템 폰트 또는 Pretendard 폴백만 계획한다. |
