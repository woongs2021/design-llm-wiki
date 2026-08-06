# Manual Deploy

배포는 자동화하지 않는다. watcher, GitHub Actions 자동 배포, 파일 변경 감지 빌드를 만들지 않는다. 사람이 작업창에서 명령을 실행한다.

## 사전 확인

1. `npm run audit`가 통과해야 한다.
2. `reports/<target>-build-report.json`에서 제외·실패·100MB 초과·1GB 잔여를 읽는다.
3. public 타깃은 internal 데이터를 가리는 것이 아니라 포함하지 않는다.

## Internal 사이트

```bash
npm run build:site -- --target=internal
```

산출물: `dist/app/` (UI + `data/index.json` + assets)

사람이 선택하는 배포 방식 중 하나로 `dist/app` 내용을 올린다.

- GitHub Pages 브랜치에만 푸시
- 또는 별도 배포 경로에 업로드

배포 직전:

```bash
git status --porcelain
```

`dist/`를 커밋하는 정책을 쓰지 않는 한, 배포 트리는 로컬 빌드 산출물만 반영한다. `dist/` 커밋 여부는 아직 사용자 확인 필요 항목이다.

## Public 사이트

```bash
npm run build:site -- --target=public
npm run check:public-leak
```

public URL/소스에서 다음이 0건이어야 한다.

- internal capture slug
- internal wiki page id
- internal 전용 자산 경로

## 키보드 완주 (사람)

마우스 없이 확인한다.

1. Tab으로 네비(Archive / Intake / History) → 모드 토글 → Archive 검색 → All/Pin 탭 → 카드
2. Intake에서 파일 선택 버튼과 Analyze 버튼에 키보드 포커스가 보이는지 확인
3. Enter로 Archive 카드 상세 진입
4. 상세에서 Pin 후 Archive의 Pin 탭에 나타나는지 확인
5. 각 단계에서 `:focus-visible` 링이 보이는지 확인
6. Archive 검색에서 Escape로 검색어 초기화

## 측정 수치

문서에 개수·바이트를 적을 때는 `reports/*-build-report.json`과 `reports/*-site-inventory.json` 값을 다시 읽어 갱신한다. 추정으로 통과시키지 않는다.
