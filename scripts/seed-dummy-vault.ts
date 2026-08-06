/**
 * Regenerates dummy vault captures, assets, collections, and wiki pages
 * so the gallery looks populated. Safe to re-run (overwrites seeded paths).
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GifWriter } from "omggif";
import { PNG } from "pngjs";

type CaptureSeed = {
  slug: string;
  title: string;
  visibility: "public" | "internal";
  capturedAt: string;
  sourceUrl: string | null;
  service: string;
  platform: string;
  screenType: string;
  uiPatterns: string[];
  tone: string;
  copyTone: string;
  tags: string[];
  insight: string;
  appVersion: string | null;
  kind: "still" | "motion";
  width: number;
  height: number;
  layout: MockLayout;
  layoutText: string;
  colorText: string;
  typographyText: string;
  interactionText: string;
};

type MockLayout =
  | "gallery-chips"
  | "onboarding"
  | "checkout"
  | "empty"
  | "search-mobile"
  | "desktop-files"
  | "dashboard"
  | "detail-tabs"
  | "settings"
  | "timeline"
  | "modal"
  | "command"
  | "split"
  | "dense-tabs"
  | "form";

const CAPTURES: CaptureSeed[] = [
  {
    slug: "naver-shopping-gallery",
    title: "네이버 쇼핑 — 필터형 상품 그리드",
    visibility: "public",
    capturedAt: "2026-07-28",
    sourceUrl: "https://shopping.naver.com",
    service: "네이버 쇼핑",
    platform: "web",
    screenType: "gallery",
    uiPatterns: ["card-grid", "filter-chips"],
    tone: "informational",
    copyTone: "instructional",
    tags: ["gallery", "filters", "cards"],
    insight: "칩 필터를 그리드 위에 고정하면 스크롤 중에도 결과 집합을 제어한다는 느낌이 유지된다.",
    appVersion: null,
    kind: "still",
    width: 1200,
    height: 800,
    layout: "gallery-chips",
    layoutText:
      "상단에 검색·카테고리 행, 바로 아래 가로 스크롤 가능한 필터 칩, 본문은 3열 카드 그리드. 페이지 제목은 그리드 밖에 두어 필터가 1차 조작으로 읽힌다.",
    colorText:
      "밝은 중립 배경에 활성 칩만 진한 블루 액센트. 관측 액센트 후보: `#03C75A` 인근 그린과 보조 블루(데이터, 사이트 토큰 아님).",
    typographyText:
      "카드 제목은 본문보다 한 단계 굵고, 가격·배송 메타는 작은 캡션. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 정지 캡처라 칩 토글과 결과 리프레시 타이밍을 확인할 수 없음.",
  },
  {
    slug: "toss-onboarding-welcome",
    title: "토스 — 온보딩 환영 카드",
    visibility: "public",
    capturedAt: "2026-07-12",
    sourceUrl: "https://toss.im",
    service: "토스",
    platform: "ios",
    screenType: "onboarding",
    uiPatterns: ["hero-band", "progress-bar"],
    tone: "playful",
    copyTone: "friendly",
    tags: ["onboarding", "motion", "typography"],
    insight: "짧은 히어로 밴드와 하단 진행 바로 ‘다음 한 걸음’만 보이도록 단계를 쪼갠다.",
    appVersion: "5.1",
    kind: "still",
    width: 390,
    height: 844,
    layout: "onboarding",
    layoutText:
      "상단 일러스트 영역, 중단에 한 줄 헤드라인과 보조 문장, 하단에 진행 바와 단일 CTA. 부차 링크는 CTA 아래로 밀었다.",
    colorText:
      "밝은 블루 틴트 배경과 흰 카드. 관측 액센트 후보: `#3182F6` 인근(데이터).",
    typographyText:
      "헤드라인은 크고 짧은 한글, 보조 문장은 한 단계 작고 여유 행간. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 스와이프·페이지 전환 모션은 이 정지 캡처에서 보이지 않음.",
  },
  {
    slug: "coupang-checkout-steps",
    title: "쿠팡 — 결제 단계 진행",
    visibility: "public",
    capturedAt: "2026-06-30",
    sourceUrl: "https://www.coupang.com",
    service: "쿠팡",
    platform: "android",
    screenType: "checkout",
    uiPatterns: ["progress-bar", "data-table"],
    tone: "urgent",
    copyTone: "imperative",
    tags: ["forms", "density", "navigation"],
    insight: "결제 단계에서는 진행 바와 주문 요약을 같은 뷰포트에 두어 ‘지금 어디까지인지’를 먼저 읽게 한다.",
    appVersion: null,
    kind: "still",
    width: 412,
    height: 915,
    layout: "checkout",
    layoutText:
      "상단 스텝 바(배송→결제→완료), 중단 주소·쿠폰 요약 리스트, 하단 고정 결제 CTA. 스크롤 본문과 CTA가 분리된다.",
    colorText:
      "흰 배경에 강조용 레드/오렌지 CTA. 관측 액센트 후보: `#E31837` 인근(데이터).",
    typographyText:
      "금액은 표 형태 숫자 정렬, 안내 문구는 짧고 명령형. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 쿠폰 적용 후 금액 재계산 피드백은 캡처에 없음.",
  },
  {
    slug: "notion-empty-workspace",
    title: "Notion — 빈 워크스페이스 안내",
    visibility: "public",
    capturedAt: "2026-07-05",
    sourceUrl: "https://www.notion.so",
    service: "Notion",
    platform: "web",
    screenType: "empty-state",
    uiPatterns: ["hero-band", "card-grid"],
    tone: "calm",
    copyTone: "friendly",
    tags: ["empty-state", "onboarding", "cards"],
    insight: "빈 상태는 ‘오류’가 아니라 ‘시작할 템플릿’으로 바꿔 보여 주면 이탈이 줄어든다.",
    appVersion: null,
    kind: "still",
    width: 1280,
    height: 800,
    layout: "empty",
    layoutText:
      "중앙 정렬 일러스트와 짧은 설명, 아래 2×2 시작 템플릿 카드. 사이드바는 축소된 채 남아 맥락을 유지한다.",
    colorText:
      "거의 무채색 캔버스에 약한 틴트 카드. 관측 액센트는 거의 없고 호버 시만 테두리 강조.",
    typographyText:
      "헤드라인은 절제된 크기, 카드 제목은 본문과 비슷한 무게. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 템플릿 클릭 후 생성 흐름은 보이지 않음.",
  },
  {
    slug: "airbnb-mobile-search",
    title: "Airbnb — 모바일 검색 필터",
    visibility: "public",
    capturedAt: "2026-08-01",
    sourceUrl: "https://www.airbnb.com",
    service: "Airbnb",
    platform: "web-mobile",
    screenType: "search",
    uiPatterns: ["filter-chips", "card-grid", "modal"],
    tone: "editorial",
    copyTone: "restrained",
    tags: ["filters", "gallery", "navigation"],
    insight: "검색 결과 위에서 칩으로 핵심 제약을 먼저 고르게 하면 지도·리스트 전환 전에 노이즈가 줄어든다.",
    appVersion: null,
    kind: "still",
    width: 390,
    height: 844,
    layout: "search-mobile",
    layoutText:
      "상단 검색 요약 필, 가로 필터 칩, 세로 스크롤 숙소 카드. 하단 탭 바로 탐색 맥락을 유지한다.",
    colorText:
      "흰 배경과 로즈/코랄 CTA. 관측 액센트 후보: `#FF5A5F` 인근(데이터).",
    typographyText:
      "숙소명과 가격이 카드의 두 축. 부가 설명은 한 줄로 자른다. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 필터 모달 내부 조작은 이 프레임에 없음.",
  },
  {
    slug: "figma-community-gallery",
    title: "Figma — 커뮤니티 파일 브라우저",
    visibility: "public",
    capturedAt: "2026-07-20",
    sourceUrl: "https://www.figma.com/community",
    service: "Figma",
    platform: "desktop",
    screenType: "gallery",
    uiPatterns: ["card-grid", "side-nav", "filter-chips"],
    tone: "data-dense",
    copyTone: "neutral",
    tags: ["gallery", "cards", "navigation", "filters"],
    insight: "사이드 내비로 분류를 고정하고 본문 칩으로 세분하면, 데스크톱 넓은 폭에서도 탐색 경로가 끊기지 않는다.",
    appVersion: "124",
    kind: "still",
    width: 1440,
    height: 900,
    layout: "desktop-files",
    layoutText:
      "좌측 사이드 내비, 상단 검색·칩, 본문 썸네일 카드 그리드. 카드에 미리보기·작성자·좋아요 메타가 붙는다.",
    colorText:
      "다크에 가까운 앱 셸과 밝은 캔버스 대비. 관측 액센트 후보: `#A259FF` 인근(데이터).",
    typographyText:
      "파일명은 중간 무게, 메타는 작은 캡션. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 호버 프리뷰·더블클릭 열기는 정지 캡처에서 확인 불가.",
  },
  {
    slug: "ops-admin-dashboard",
    title: "내부 운영 — 지표 대시보드",
    visibility: "internal",
    capturedAt: "2026-08-02",
    sourceUrl: null,
    service: "Ops Console",
    platform: "web",
    screenType: "dashboard",
    uiPatterns: ["data-table", "tab-row", "side-nav"],
    tone: "data-dense",
    copyTone: "neutral",
    tags: ["dashboard", "density", "navigation"],
    insight: "밀도 높은 운영 화면은 탭으로 관심사를 나누고, 표는 스크롤 영역만 남겨 헤더를 고정하는 편이 읽기 쉽다.",
    appVersion: "2.4.0",
    kind: "still",
    width: 1440,
    height: 900,
    layout: "dashboard",
    layoutText:
      "좌측 내비, 상단 탭(요약/장애/배포), 본문은 KPI 카드 행 + 로그 테이블. 필터는 테이블 툴바에만 둔다.",
    colorText:
      "쿨 블루 셸과 밝은 표 영역. 경고 행만 약한 로즈 틴트.",
    typographyText:
      "숫자 KPI는 크게, 테이블은 모노스페이스에 가까운 정렬감. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 행 클릭 드릴다운은 캡처에 없음.",
  },
  {
    slug: "crm-contact-detail",
    title: "CRM — 연락처 상세 탭",
    visibility: "internal",
    capturedAt: "2026-07-18",
    sourceUrl: null,
    service: "Internal CRM",
    platform: "web",
    screenType: "detail",
    uiPatterns: ["tab-row", "data-table"],
    tone: "informational",
    copyTone: "restrained",
    tags: ["navigation", "density", "forms"],
    insight: "상세 화면에서 신원 요약은 고정하고, 활동·메모·거래는 탭으로 분리하면 스크롤 피로가 줄어든다.",
    appVersion: "1.9",
    kind: "still",
    width: 1280,
    height: 800,
    layout: "detail-tabs",
    layoutText:
      "좌측 프로필 요약 패널, 우측 탭(활동/메모/거래)과 리스트. 1차 CTA는 요약 패널 상단에 둔다.",
    colorText:
      "중립 회색 패널과 흰 콘텐츠. 상태 뱃지만 약한 컬러.",
    typographyText:
      "이름·회사는 강조, 타임스탬프는 캡션. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 탭 전환과 인라인 편집은 보이지 않음.",
  },
  {
    slug: "ds-settings-tokens",
    title: "디자인 시스템 — 토큰 설정",
    visibility: "internal",
    capturedAt: "2026-06-22",
    sourceUrl: null,
    service: "Design System Admin",
    platform: "web",
    screenType: "settings",
    uiPatterns: ["side-nav", "data-table"],
    tone: "informational",
    copyTone: "instructional",
    tags: ["color", "typography", "forms"],
    insight: "토큰 편집은 미리보기 면과 폼을 나란히 두면, 값이 바뀌는 순간 화면 영향을 같이 볼 수 있다.",
    appVersion: "0.8",
    kind: "still",
    width: 1280,
    height: 800,
    layout: "settings",
    layoutText:
      "좌측 설정 내비(Color/Type/Space), 중앙 폼 필드, 우측 라이브 프리뷰 카드.",
    colorText:
      "캔버스는 라이트, 프리뷰는 실제 토큰 색을 반영. 관측 샘플 스와치: `#4065F8`, `#A1D0F6`(데이터).",
    typographyText:
      "라벨-헬프-입력 3단 계층. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 값 변경 시 프리뷰 갱신 지연은 확인 불가.",
  },
  {
    slug: "warehouse-event-timeline",
    title: "물류 — 이벤트 타임라인",
    visibility: "internal",
    capturedAt: "2026-07-25",
    sourceUrl: null,
    service: "Warehouse Ops",
    platform: "web",
    screenType: "dashboard",
    uiPatterns: ["timeline", "filter-chips"],
    tone: "urgent",
    copyTone: "tense",
    tags: ["dashboard", "filters", "motion"],
    insight: "장애·지연 이벤트는 시간축에 심각도를 색으로 얹어, 필터 없이도 ‘언제 커졌는지’가 보이게 한다.",
    appVersion: null,
    kind: "still",
    width: 1280,
    height: 800,
    layout: "timeline",
    layoutText:
      "상단 심각도 칩, 본문은 세로 타임라인과 우측 상세 패널. 현재 시각 마커가 있다.",
    colorText:
      "기본 라인은 쿨 그레이, critical만 로즈. 관측 경고색 후보: `#FF105C` 인근(데이터).",
    typographyText:
      "시간 스탬프는 고정폭 느낌, 이벤트 제목은 본문. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 실시간 스트림 갱신은 캡처에 없음.",
  },
  {
    slug: "filter-confirm-pulse",
    title: "내부 도구 — 필터 확정 펄스",
    visibility: "internal",
    capturedAt: "2026-08-03",
    sourceUrl: null,
    service: "Internal Tools",
    platform: "web",
    screenType: "search",
    uiPatterns: ["filter-chips", "toast"],
    tone: "data-dense",
    copyTone: "instructional",
    tags: ["filters", "motion", "density"],
    insight: "필터 적용 직후 짧은 펄스와 토스트로 ‘반영됨’을 보여 주면, 결과 지연이 있어도 조작이 실패했다고 느끼지 않는다.",
    appVersion: "3.2",
    kind: "motion",
    width: 960,
    height: 640,
    layout: "gallery-chips",
    layoutText:
      "상단 칩 행과 결과 리스트. 활성 칩 주변에 짧은 하이라이트 링이 두 프레임에 걸쳐 나타난다.",
    colorText:
      "밀도 높은 툴 UI. 활성 칩은 미드 블루, 펄스는 소프트 블루. 관측: `#16427C`, `#A1D0F6`(데이터).",
    typographyText:
      "칩 라벨은 작고 굵게, 결과 행은 표에 가깝다. Typeface: 미확정.",
    interactionText:
      "모션 GIF에서 칩 확정 후 약 2프레임의 펄스와 하단 토스트가 관측됨. 호버 상태는 사용자 확인 필요.",
  },
  {
    slug: "modal-bulk-edit",
    title: "운영 — 일괄 수정 모달",
    visibility: "internal",
    capturedAt: "2026-06-15",
    sourceUrl: null,
    service: "Ops Console",
    platform: "web",
    screenType: "form",
    uiPatterns: ["modal", "data-table"],
    tone: "informational",
    copyTone: "imperative",
    tags: ["forms", "density", "cards"],
    insight: "일괄 수정은 배경 표를 흐리게 남기고 모달에 영향 범위를 숫자로 보여 주면 실수 부담이 줄어든다.",
    appVersion: "2.4.0",
    kind: "still",
    width: 1200,
    height: 800,
    layout: "modal",
    layoutText:
      "배경에 선택된 행이 보이는 테이블, 중앙 모달에 필드 3개와 영향 N건 요약, 하단 취소/적용.",
    colorText:
      "오버레이는 반투명 딥 네이비, 모달은 흰 카드. 적용 버튼만 프라이머리.",
    typographyText:
      "모달 제목 > 영향 요약 > 필드 라벨 순. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 적용 후 토스트·테이블 갱신은 캡처에 없음.",
  },
  {
    slug: "command-palette-ops",
    title: "운영 — 커맨드 팔레트",
    visibility: "internal",
    capturedAt: "2026-07-08",
    sourceUrl: null,
    service: "Ops Console",
    platform: "desktop",
    screenType: "search",
    uiPatterns: ["command-palette", "toast"],
    tone: "data-dense",
    copyTone: "neutral",
    tags: ["navigation", "density", "filters"],
    insight: "자주 쓰는 운영 액션은 팔레트에 동사형으로 모아 두면, 깊은 내비 트리를 외우지 않아도 된다.",
    appVersion: "2.4.0",
    kind: "still",
    width: 1100,
    height: 700,
    layout: "command",
    layoutText:
      "화면 중앙 팔레트: 검색 인풋, 최근/추천 그룹, 키보드 힌트. 배경 앱은 흐림 처리.",
    colorText:
      "딥 셸 위 밝은 패널. 선택 행만 약한 틴트.",
    typographyText:
      "명령어는 짧고, 단축키는 우측 정렬 캡션. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 키보드 내비와 실행 피드백은 보이지 않음.",
  },
  {
    slug: "split-ab-compare",
    title: "실험 — A/B 화면 비교",
    visibility: "internal",
    capturedAt: "2026-08-04",
    sourceUrl: null,
    service: "Experiment Lab",
    platform: "web",
    screenType: "detail",
    uiPatterns: ["split-view", "tab-row"],
    tone: "editorial",
    copyTone: "restrained",
    tags: ["typography", "color", "cards"],
    insight: "변형 비교는 동일한 스크롤 위치를 공유하는 스플릿이 아니면 ‘레이아웃 차이’와 ‘콘텐츠 차이’를 헷갈리기 쉽다.",
    appVersion: "1.1",
    kind: "still",
    width: 1440,
    height: 900,
    layout: "split",
    layoutText:
      "좌우 동일 폭 프리뷰, 상단에 A/B 탭과 동기 스크롤 토글. 하단 메모 패널.",
    colorText:
      "중립 프레임, 변형 배지만 서로 다른 틴트(A=소프트, B=틴트).",
    typographyText:
      "변형 라벨은 작고, 본문 카피는 실제 서비스 크기를 유지. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 동기 스크롤 on/off 동작은 캡처에 없음.",
  },
  {
    slug: "analytics-tab-dense",
    title: "분석 — 밀도 높은 탭 리포트",
    visibility: "internal",
    capturedAt: "2026-05-28",
    sourceUrl: null,
    service: "Analytics Suite",
    platform: "web",
    screenType: "dashboard",
    uiPatterns: ["tab-row", "data-table", "filter-chips"],
    tone: "data-dense",
    copyTone: "neutral",
    tags: ["dashboard", "density", "filters"],
    insight: "리포트 탭이 많아도 칩으로 ‘기간·세그먼트’를 전역으로 두면, 탭을 옮겨도 비교 기준이 유지된다.",
    appVersion: "4.0",
    kind: "still",
    width: 1440,
    height: 900,
    layout: "dense-tabs",
    layoutText:
      "상단 전역 칩(기간/세그먼트), 탭 행, 본문은 차트 플레이스홀더 + 상세 표.",
    colorText:
      "차트 영역은 틴트, 표는 흰 배경. 시리즈 컬러는 쿨 블루 계열.",
    typographyText:
      "축 라벨·범례는 캡션, 표 헤더는 중간 무게. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 차트 툴팁·드릴다운은 보이지 않음.",
  },
  {
    slug: "mobile-settings-privacy",
    title: "앱 — 개인정보 설정 목록",
    visibility: "internal",
    capturedAt: "2026-06-08",
    sourceUrl: null,
    service: "Member App",
    platform: "ios",
    screenType: "settings",
    uiPatterns: ["side-nav", "tab-row"],
    tone: "calm",
    copyTone: "instructional",
    tags: ["navigation", "forms", "empty-state"],
    insight: "민감 설정은 그룹 헤더와 한 줄 설명으로 ‘무엇을 끄는지’를 먼저 읽게 하는 것이 토글 자체보다 중요하다.",
    appVersion: "3.0.1",
    kind: "still",
    width: 390,
    height: 844,
    layout: "form",
    layoutText:
      "그룹 섹션(알림/개인정보/보안), 각 행은 라벨+짧은 설명+토글. 하단 위험 구역은 분리.",
    colorText:
      "시스템 라이트 그레이 리스트. 위험 액션만 경고 로즈 텍스트.",
    typographyText:
      "행 라벨 > 설명 캡션. Typeface: 미확정.",
    interactionText:
      "사용자 확인 필요 — 토글 즉시 저장 여부는 캡처에 없음.",
  },
];

function hex(rgb: string): [number, number, number] {
  const h = rgb.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
  ];
}

function fillRect(
  png: PNG,
  x0: number,
  y0: number,
  w: number,
  h: number,
  color: [number, number, number],
  alpha = 255,
): void {
  const x1 = Math.min(png.width, Math.max(0, x0 + w));
  const y1 = Math.min(png.height, Math.max(0, y0 + h));
  const xs = Math.max(0, x0);
  const ys = Math.max(0, y0);
  for (let y = ys; y < y1; y++) {
    for (let x = xs; x < x1; x++) {
      const i = (png.width * y + x) << 2;
      png.data[i] = color[0];
      png.data[i + 1] = color[1];
      png.data[i + 2] = color[2];
      png.data[i + 3] = alpha;
    }
  }
}

const PALETTES: Record<string, { bg: string; panel: string; accent: string; muted: string; ink: string }> = {
  "naver-shopping-gallery": { bg: "#F5F7FA", panel: "#FFFFFF", accent: "#03C75A", muted: "#D9E2EC", ink: "#102A43" },
  "toss-onboarding-welcome": { bg: "#E8F3FF", panel: "#FFFFFF", accent: "#3182F6", muted: "#BFD8FF", ink: "#191F28" },
  "coupang-checkout-steps": { bg: "#FFFFFF", panel: "#F7F7F7", accent: "#E31837", muted: "#E5E5E5", ink: "#111111" },
  "notion-empty-workspace": { bg: "#F7F6F3", panel: "#FFFFFF", accent: "#37352F", muted: "#E3E2DE", ink: "#37352F" },
  "airbnb-mobile-search": { bg: "#FFFFFF", panel: "#F7F7F7", accent: "#FF5A5F", muted: "#EBEBEB", ink: "#222222" },
  "figma-community-gallery": { bg: "#2C2C2C", panel: "#FFFFFF", accent: "#A259FF", muted: "#444444", ink: "#1E1E1E" },
  "ops-admin-dashboard": { bg: "#0F2744", panel: "#FCFCFF", accent: "#4065F8", muted: "#16427C", ink: "#010102" },
  "crm-contact-detail": { bg: "#EEF2F6", panel: "#FFFFFF", accent: "#16427C", muted: "#CBD5E1", ink: "#0F172A" },
  "ds-settings-tokens": { bg: "#FCFCFF", panel: "#FFFFFF", accent: "#4065F8", muted: "#CAF7FF", ink: "#010102" },
  "warehouse-event-timeline": { bg: "#F8FAFC", panel: "#FFFFFF", accent: "#FF105C", muted: "#E2E8F0", ink: "#0F172A" },
  "filter-confirm-pulse": { bg: "#F0F4F8", panel: "#FFFFFF", accent: "#16427C", muted: "#A1D0F6", ink: "#010102" },
  "modal-bulk-edit": { bg: "#001C33", panel: "#FFFFFF", accent: "#4065F8", muted: "#334E68", ink: "#010102" },
  "command-palette-ops": { bg: "#0B1220", panel: "#F8FAFC", accent: "#4065F8", muted: "#334155", ink: "#0F172A" },
  "split-ab-compare": { bg: "#F1F5F9", panel: "#FFFFFF", accent: "#16427C", muted: "#A1D0F6", ink: "#010102" },
  "analytics-tab-dense": { bg: "#F8FAFC", panel: "#FFFFFF", accent: "#4065F8", muted: "#CAF7FF", ink: "#0F172A" },
  "mobile-settings-privacy": { bg: "#F2F2F7", panel: "#FFFFFF", accent: "#007AFF", muted: "#D1D1D6", ink: "#1C1C1E" },
};

function paintMock(capture: CaptureSeed): PNG {
  const png = new PNG({ width: capture.width, height: capture.height });
  const p = PALETTES[capture.slug] ?? PALETTES["ops-admin-dashboard"]!;
  const bg = hex(p.bg);
  const panel = hex(p.panel);
  const accent = hex(p.accent);
  const muted = hex(p.muted);
  const ink = hex(p.ink);
  fillRect(png, 0, 0, capture.width, capture.height, bg);

  const w = capture.width;
  const h = capture.height;

  switch (capture.layout) {
    case "gallery-chips": {
      fillRect(png, 0, 0, w, Math.floor(h * 0.1), panel);
      for (let i = 0; i < 5; i++) {
        const x = 24 + i * 110;
        fillRect(png, x, Math.floor(h * 0.12), 96, 36, i === 0 ? accent : muted);
      }
      const cols = 3;
      const cardW = Math.floor((w - 80) / cols);
      const cardH = Math.floor(h * 0.28);
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < cols; c++) {
          const x = 24 + c * (cardW + 16);
          const y = Math.floor(h * 0.22) + r * (cardH + 16);
          fillRect(png, x, y, cardW, cardH, panel);
          fillRect(png, x, y, cardW, Math.floor(cardH * 0.55), muted);
          fillRect(png, x + 12, y + Math.floor(cardH * 0.65), Math.floor(cardW * 0.5), 14, ink, 180);
        }
      }
      break;
    }
    case "onboarding": {
      fillRect(png, 24, 48, w - 48, Math.floor(h * 0.42), muted);
      fillRect(png, 40, Math.floor(h * 0.55), w - 80, 28, ink, 200);
      fillRect(png, 40, Math.floor(h * 0.6), Math.floor(w * 0.7), 16, ink, 120);
      fillRect(png, 40, Math.floor(h * 0.78), w - 80, 8, muted);
      fillRect(png, 40, Math.floor(h * 0.78), Math.floor((w - 80) * 0.35), 8, accent);
      fillRect(png, 40, Math.floor(h * 0.84), w - 80, 52, accent);
      break;
    }
    case "checkout": {
      fillRect(png, 0, 0, w, 64, panel);
      for (let i = 0; i < 3; i++) {
        fillRect(png, 24 + i * Math.floor(w / 3.2), 20, Math.floor(w / 4), 10, i === 1 ? accent : muted);
      }
      for (let i = 0; i < 4; i++) {
        fillRect(png, 16, 90 + i * 70, w - 32, 58, panel);
        fillRect(png, 28, 108 + i * 70, Math.floor(w * 0.4), 12, ink, 160);
      }
      fillRect(png, 0, h - 72, w, 72, panel);
      fillRect(png, 16, h - 56, w - 32, 40, accent);
      break;
    }
    case "empty": {
      fillRect(png, 0, 0, Math.floor(w * 0.18), h, muted);
      fillRect(png, Math.floor(w * 0.35), Math.floor(h * 0.18), Math.floor(w * 0.3), Math.floor(h * 0.22), panel);
      fillRect(png, Math.floor(w * 0.38), Math.floor(h * 0.42), Math.floor(w * 0.24), 18, ink, 160);
      for (let i = 0; i < 4; i++) {
        const x = Math.floor(w * 0.28) + (i % 2) * Math.floor(w * 0.22);
        const y = Math.floor(h * 0.55) + Math.floor(i / 2) * Math.floor(h * 0.16);
        fillRect(png, x, y, Math.floor(w * 0.2), Math.floor(h * 0.13), panel);
      }
      break;
    }
    case "search-mobile": {
      fillRect(png, 16, 24, w - 32, 48, panel);
      for (let i = 0; i < 4; i++) {
        fillRect(png, 16 + i * 88, 88, 76, 32, i === 0 ? accent : muted);
      }
      for (let i = 0; i < 3; i++) {
        const y = 140 + i * 200;
        fillRect(png, 16, y, w - 32, 180, panel);
        fillRect(png, 16, y, w - 32, 110, muted);
        fillRect(png, 28, y + 124, Math.floor(w * 0.45), 14, ink, 170);
      }
      fillRect(png, 0, h - 64, w, 64, panel);
      break;
    }
    case "desktop-files": {
      fillRect(png, 0, 0, Math.floor(w * 0.18), h, hex(p.bg));
      fillRect(png, Math.floor(w * 0.18), 0, w, 72, muted);
      for (let i = 0; i < 4; i++) {
        fillRect(png, Math.floor(w * 0.2) + i * 120, 20, 100, 32, i === 1 ? accent : panel);
      }
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 4; c++) {
          const x = Math.floor(w * 0.2) + c * Math.floor(w * 0.19);
          const y = 100 + r * Math.floor(h * 0.38);
          fillRect(png, x, y, Math.floor(w * 0.17), Math.floor(h * 0.32), panel);
          fillRect(png, x, y, Math.floor(w * 0.17), Math.floor(h * 0.2), muted);
        }
      }
      break;
    }
    case "dashboard": {
      fillRect(png, 0, 0, Math.floor(w * 0.16), h, muted);
      fillRect(png, Math.floor(w * 0.16), 0, w, 64, panel);
      for (let i = 0; i < 3; i++) {
        fillRect(png, Math.floor(w * 0.2) + i * 140, 18, 120, 28, i === 0 ? accent : muted);
      }
      for (let i = 0; i < 4; i++) {
        fillRect(png, Math.floor(w * 0.2) + i * Math.floor(w * 0.19), 90, Math.floor(w * 0.17), 90, panel);
        fillRect(png, Math.floor(w * 0.22) + i * Math.floor(w * 0.19), 120, 80, 24, accent);
      }
      fillRect(png, Math.floor(w * 0.2), 210, Math.floor(w * 0.75), Math.floor(h * 0.65), panel);
      for (let i = 0; i < 8; i++) {
        fillRect(png, Math.floor(w * 0.22), 230 + i * 48, Math.floor(w * 0.7), 36, i % 2 === 0 ? muted : panel);
      }
      break;
    }
    case "detail-tabs": {
      fillRect(png, 0, 0, Math.floor(w * 0.28), h, muted);
      fillRect(png, 24, 40, Math.floor(w * 0.2), Math.floor(w * 0.2), panel);
      fillRect(png, 24, Math.floor(h * 0.35), Math.floor(w * 0.2), 20, ink, 180);
      fillRect(png, Math.floor(w * 0.3), 24, Math.floor(w * 0.65), 48, panel);
      for (let i = 0; i < 3; i++) {
        fillRect(png, Math.floor(w * 0.32) + i * 120, 36, 100, 24, i === 0 ? accent : muted);
      }
      for (let i = 0; i < 6; i++) {
        fillRect(png, Math.floor(w * 0.3), 100 + i * 70, Math.floor(w * 0.65), 58, panel);
      }
      break;
    }
    case "settings": {
      fillRect(png, 0, 0, Math.floor(w * 0.18), h, muted);
      fillRect(png, Math.floor(w * 0.2), 40, Math.floor(w * 0.35), Math.floor(h * 0.8), panel);
      for (let i = 0; i < 5; i++) {
        fillRect(png, Math.floor(w * 0.22), 70 + i * 70, Math.floor(w * 0.3), 40, muted);
      }
      fillRect(png, Math.floor(w * 0.58), 40, Math.floor(w * 0.36), Math.floor(h * 0.8), muted);
      fillRect(png, Math.floor(w * 0.62), 80, Math.floor(w * 0.28), 120, accent);
      fillRect(png, Math.floor(w * 0.62), 220, Math.floor(w * 0.28), 80, hex("#A1D0F6"));
      break;
    }
    case "timeline": {
      for (let i = 0; i < 4; i++) {
        fillRect(png, 24 + i * 120, 24, 100, 32, i === 0 ? accent : muted);
      }
      fillRect(png, 80, 100, 4, h - 140, muted);
      for (let i = 0; i < 5; i++) {
        const y = 120 + i * 100;
        fillRect(png, 68, y, 28, 28, i === 1 ? accent : hex(p.accent));
        fillRect(png, 120, y - 10, Math.floor(w * 0.45), 70, panel);
        fillRect(png, Math.floor(w * 0.65), 100, Math.floor(w * 0.3), h - 140, panel);
      }
      break;
    }
    case "modal": {
      fillRect(png, 40, 40, w - 80, h - 80, muted);
      for (let i = 0; i < 6; i++) {
        fillRect(png, 60, 60 + i * 50, w - 120, 36, panel);
      }
      fillRect(png, Math.floor(w * 0.2), Math.floor(h * 0.18), Math.floor(w * 0.6), Math.floor(h * 0.55), panel);
      fillRect(png, Math.floor(w * 0.24), Math.floor(h * 0.22), Math.floor(w * 0.4), 20, ink, 180);
      for (let i = 0; i < 3; i++) {
        fillRect(png, Math.floor(w * 0.24), Math.floor(h * 0.3) + i * 60, Math.floor(w * 0.5), 40, muted);
      }
      fillRect(png, Math.floor(w * 0.45), Math.floor(h * 0.62), 120, 40, muted);
      fillRect(png, Math.floor(w * 0.58), Math.floor(h * 0.62), 120, 40, accent);
      break;
    }
    case "command": {
      fillRect(png, Math.floor(w * 0.2), Math.floor(h * 0.15), Math.floor(w * 0.6), Math.floor(h * 0.65), panel);
      fillRect(png, Math.floor(w * 0.22), Math.floor(h * 0.18), Math.floor(w * 0.56), 48, muted);
      for (let i = 0; i < 6; i++) {
        fillRect(
          png,
          Math.floor(w * 0.22),
          Math.floor(h * 0.28) + i * 48,
          Math.floor(w * 0.56),
          40,
          i === 1 ? muted : panel,
        );
        fillRect(png, Math.floor(w * 0.24), Math.floor(h * 0.3) + i * 48, 160, 14, ink, 160);
        fillRect(png, Math.floor(w * 0.68), Math.floor(h * 0.3) + i * 48, 60, 14, ink, 100);
      }
      break;
    }
    case "split": {
      fillRect(png, 0, 0, w, 64, panel);
      fillRect(png, 24, 16, 80, 32, accent);
      fillRect(png, 120, 16, 80, 32, muted);
      fillRect(png, 24, 88, Math.floor(w * 0.46) - 24, h - 120, panel);
      fillRect(png, Math.floor(w * 0.52), 88, Math.floor(w * 0.46) - 24, h - 120, panel);
      fillRect(png, 40, 110, Math.floor(w * 0.4), Math.floor(h * 0.35), muted);
      fillRect(png, Math.floor(w * 0.54), 110, Math.floor(w * 0.4), Math.floor(h * 0.35), hex("#CAF7FF"));
      break;
    }
    case "dense-tabs": {
      for (let i = 0; i < 5; i++) {
        fillRect(png, 24 + i * 110, 20, 96, 32, i < 2 ? accent : muted);
      }
      for (let i = 0; i < 4; i++) {
        fillRect(png, 24 + i * 140, 70, 120, 36, i === 0 ? accent : panel);
      }
      fillRect(png, 24, 130, Math.floor(w * 0.6), Math.floor(h * 0.35), muted);
      fillRect(png, Math.floor(w * 0.64), 130, Math.floor(w * 0.32), Math.floor(h * 0.35), panel);
      fillRect(png, 24, Math.floor(h * 0.55), w - 48, Math.floor(h * 0.4), panel);
      for (let i = 0; i < 6; i++) {
        fillRect(png, 40, Math.floor(h * 0.58) + i * 40, w - 80, 28, i % 2 ? muted : panel);
      }
      break;
    }
    case "form": {
      fillRect(png, 0, 0, w, 56, panel);
      fillRect(png, 16, 16, 120, 24, ink, 180);
      for (let g = 0; g < 3; g++) {
        const y0 = 80 + g * 220;
        fillRect(png, 16, y0, 100, 16, ink, 120);
        for (let i = 0; i < 3; i++) {
          fillRect(png, 16, y0 + 36 + i * 56, w - 32, 48, panel);
          fillRect(png, w - 72, y0 + 48 + i * 56, 40, 24, g === 2 && i === 2 ? accent : muted);
        }
      }
      break;
    }
  }

  // Unique salt pixels so hashes never collide across captures.
  const salt = capture.slug.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
  fillRect(png, w - 3, h - 3, 2, 2, [(salt * 17) % 255, (salt * 31) % 255, (salt * 47) % 255]);

  return png;
}

function writePng(path: string, png: PNG): void {
  writeFileSync(path, PNG.sync.write(png));
}

function packRgb(r: number, g: number, b: number): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

function writePulseGif(path: string, width: number, height: number): void {
  const frameCount = 2;
  // omggif expects an array of packed RGB ints; length must be power of 2.
  const palette = [
    packRgb(240, 244, 248),
    packRgb(255, 255, 255),
    packRgb(22, 66, 124),
    packRgb(161, 208, 246),
  ];

  const buf = Buffer.alloc(width * height * frameCount * 2 + 4096);
  const writer = new GifWriter(buf, width, height, { palette, loop: 0 });

  for (let f = 0; f < frameCount; f++) {
    const indexed = Buffer.alloc(width * height);
    indexed.fill(0);
    for (let y = 0; y < Math.floor(height * 0.12); y++) {
      for (let x = 0; x < width; x++) indexed[y * width + x] = 1;
    }
    for (let i = 0; i < 4; i++) {
      const x0 = 24 + i * 120;
      for (let y = Math.floor(height * 0.16); y < Math.floor(height * 0.16) + 36; y++) {
        for (let x = x0; x < x0 + 100; x++) {
          if (x < width && y < height) indexed[y * width + x] = i === 0 ? 2 : 1;
        }
      }
      if (f === 1 && i === 0) {
        for (let y = Math.floor(height * 0.14); y < Math.floor(height * 0.16) + 48; y++) {
          for (let x = x0 - 6; x < x0 + 106; x++) {
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            const onEdge =
              x < x0 ||
              x >= x0 + 100 ||
              y < Math.floor(height * 0.16) ||
              y >= Math.floor(height * 0.16) + 36;
            if (onEdge) indexed[y * width + x] = 3;
          }
        }
      }
    }
    for (let r = 0; r < 5; r++) {
      const y0 = Math.floor(height * 0.28) + r * 70;
      for (let y = y0; y < y0 + 56; y++) {
        for (let x = 24; x < width - 24; x++) {
          if (y < height) indexed[y * width + x] = 1;
        }
      }
    }
    if (f === 1) {
      for (let y = height - 80; y < height - 32; y++) {
        for (let x = Math.floor(width * 0.3); x < Math.floor(width * 0.7); x++) {
          indexed[y * width + x] = 2;
        }
      }
    }
    writer.addFrame(0, 0, width, height, indexed, { delay: 40 });
  }

  writeFileSync(path, buf.subarray(0, writer.end()));
}

function yamlList(items: string[], indent = 2): string {
  const pad = " ".repeat(indent);
  return items.map((item) => `${pad}- ${item}`).join("\n");
}

function writeCapture(capture: CaptureSeed): void {
  const dir = join("obsidian/captures", capture.slug);
  mkdirSync(dir, { recursive: true });
  const assetName = capture.kind === "motion" ? "capture.gif" : "capture.png";
  const assetPath = join(dir, assetName);

  if (capture.kind === "motion") {
    writePulseGif(assetPath, capture.width, capture.height);
  } else {
    writePng(assetPath, paintMock(capture));
  }

  const optionalLines = [
    capture.sourceUrl === null ? null : `sourceUrl: ${capture.sourceUrl}`,
    capture.appVersion === null ? null : `appVersion: ${JSON.stringify(capture.appVersion)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  const fm = `---
slug: ${capture.slug}
title: ${JSON.stringify(capture.title)}
asset: ${assetName}
visibility: ${capture.visibility}
capturedAt: ${capture.capturedAt}
${optionalLines ? `${optionalLines}\n` : ""}service: ${JSON.stringify(capture.service)}
platform: ${capture.platform}
screenType: ${capture.screenType}
uiPatterns:
${yamlList(capture.uiPatterns)}
tone: ${capture.tone}
copyTone: ${capture.copyTone}
tags:
${yamlList(capture.tags)}
insight: ${JSON.stringify(capture.insight)}
---

## Layout

${capture.layoutText}

## Color

${capture.colorText}

## Typography

${capture.typographyText}

## Interaction

${capture.interactionText}
`;
  writeFileSync(join(dir, "index.md"), fm);
}

function writeCollections(): void {
  mkdirSync("obsidian/collections", { recursive: true });

  writeFileSync(
    "obsidian/collections/filter-patterns.md",
    `---
slug: filter-patterns
title: 필터 패턴 모음
description: 칩·검색·결과 그리드가 같이 쓰인 캡처를 모아 비교한다.
captures:
  - naver-shopping-gallery
  - airbnb-mobile-search
  - figma-community-gallery
  - filter-confirm-pulse
  - analytics-tab-dense
---

# 필터 패턴 모음

필터가 1차 조작인 화면들을 한곳에 모아 두었다.
`,
  );

  writeFileSync(
    "obsidian/collections/public-gallery.md",
    `---
slug: public-gallery
title: 공개 갤러리 시드
description: public 번들에 포함되는 외부 서비스 캡처만 모은 컬렉션.
captures:
  - naver-shopping-gallery
  - toss-onboarding-welcome
  - coupang-checkout-steps
  - notion-empty-workspace
  - airbnb-mobile-search
  - figma-community-gallery
---

# 공개 갤러리 시드

사외 공개용 번들 검증과 데모용.
`,
  );

  writeFileSync(
    "obsidian/collections/ops-dense-tools.md",
    `---
slug: ops-dense-tools
title: 운영 밀도 UI
description: 내부 운영·분석처럼 정보 밀도가 높은 화면.
captures:
  - ops-admin-dashboard
  - warehouse-event-timeline
  - modal-bulk-edit
  - command-palette-ops
  - analytics-tab-dense
---

# 운영 밀도 UI

표·탭·팔레트가 겹치는 내부 도구 패턴.
`,
  );

  writeFileSync(
    "obsidian/collections/onboarding-empty.md",
    `---
slug: onboarding-empty
title: 온보딩과 빈 상태
description: 처음 진입·빈 데이터 안내 화면.
captures:
  - toss-onboarding-welcome
  - notion-empty-workspace
  - mobile-settings-privacy
---

# 온보딩과 빈 상태

첫 화면에서 다음 행동을 알려 주는 패턴.
`,
  );
}

function writeWiki(): void {
  mkdirSync("obsidian/wiki/patterns", { recursive: true });
  mkdirSync("obsidian/wiki/services", { recursive: true });
  mkdirSync("obsidian/wiki/comparisons", { recursive: true });
  mkdirSync("obsidian/wiki/questions", { recursive: true });

  writeFileSync(
    "obsidian/wiki/index.md",
    `---
title: Wiki 인덱스
summary: LLM이 유지하는 디자인 지식 페이지 목록.
---

# Wiki 인덱스

ingest / query / lint 할 때마다 갱신하는 콘텐츠 카탈로그.

## Patterns

- [필터형 갤러리](patterns/filterable-gallery.md) — 칩 필터와 카드 그리드를 함께 쓰는 탐색 패턴.
- [필터 확정 모션](patterns/internal-filter-motion.md) — 내부 도구에서 필터 반영을 짧게 확인시키는 펄스.
- [밀도 높은 운영 대시보드](patterns/dense-ops-dashboard.md) — 탭·표·KPI가 겹치는 운영 화면.

## Services

- [네이버 쇼핑](services/naver-shopping.md) — 공개 캡처가 있는 커머스 탐색 UI.
- [토스](services/toss.md) — 온보딩·친화적 카피 톤 참고.
- [Ops Console](services/ops-console.md) — 내부 운영 콘솔(비공개).

## Comparisons

- [공개 커머스 필터 비교](comparisons/commerce-filters.md) — 네이버 쇼핑과 Airbnb 필터 배치 비교.

## Questions

- [칩 필터의 기본값](questions/chip-filter-defaults.md) — 첫 진입 시 칩을 전부 꺼둘지, 추천 칩을 켤지.
`,
  );

  writeFileSync(
    "obsidian/wiki/patterns/filterable-gallery.md",
    `---
title: 필터형 갤러리
summary: 칩 필터를 카드 그리드 위에 두어 결과 집합을 먼저 제어하게 하는 패턴.
visibility: public
---

# 필터형 갤러리

스크롤 전에 필터가 보이면, 사용자는 그리드를 ‘탐색 결과’가 아니라 ‘내가 좁힌 결과’로 읽는다.

## 관찰

- 칩은 그리드보다 위, 검색보다 아래에 두는 경우가 많다.
- 활성 칩만 색을 올리고 나머지는 중립으로 둔다.

## 관련 캡처

- [[naver-shopping-gallery]]
- [[airbnb-mobile-search]]
- [[figma-community-gallery]]
`,
  );

  writeFileSync(
    "obsidian/wiki/patterns/internal-filter-motion.md",
    `---
title: 필터 확정 모션
summary: 필터 적용 직후 짧은 펄스와 토스트로 반영을 확인시키는 내부 패턴.
visibility: internal
---

# 필터 확정 모션

결과 API가 느려도 ‘조작이 먹혔다’는 신호를 먼저 주는 것이 핵심이다.

## 관련 캡처

- [[filter-confirm-pulse]]
- [[analytics-tab-dense]]
- [[warehouse-event-timeline]]
`,
  );

  writeFileSync(
    "obsidian/wiki/patterns/dense-ops-dashboard.md",
    `---
title: 밀도 높은 운영 대시보드
summary: KPI·탭·테이블이 한 화면에 겹칠 때 헤더와 스크롤 영역을 나누는 방법.
visibility: internal
---

# 밀도 높은 운영 대시보드

운영자는 한눈에 이상치를 찾고, 바로 표로 내려가 증거를 본다.

## 관련 캡처

- [[ops-admin-dashboard]]
- [[analytics-tab-dense]]
- [[warehouse-event-timeline]]
`,
  );

  writeFileSync(
    "obsidian/wiki/services/naver-shopping.md",
    `---
title: 네이버 쇼핑
summary: 공개 번들에 포함된 커머스 갤러리·필터 참고 서비스.
visibility: public
---

# 네이버 쇼핑

상품 탐색에서 필터와 카드 메타(가격·배송) 계층을 보는 샘플.

## 관련 캡처

- [[naver-shopping-gallery]]
`,
  );

  writeFileSync(
    "obsidian/wiki/services/toss.md",
    `---
title: 토스
summary: 짧은 온보딩과 친화적 카피 톤 참고.
visibility: public
---

# 토스

한 화면에 한 행동만 남기는 온보딩 리듬.

## 관련 캡처

- [[toss-onboarding-welcome]]
`,
  );

  writeFileSync(
    "obsidian/wiki/services/ops-console.md",
    `---
title: Ops Console
summary: 내부 운영 콘솔. public 번들에서는 제외된다.
visibility: internal
---

# Ops Console

대시보드·모달·커맨드 팔레트가 한 제품 안에서 어떻게 역할 분담하는지 본다.

## 관련 캡처

- [[ops-admin-dashboard]]
- [[modal-bulk-edit]]
- [[command-palette-ops]]
`,
  );

  writeFileSync(
    "obsidian/wiki/comparisons/commerce-filters.md",
    `---
title: 공개 커머스 필터 비교
summary: 네이버 쇼핑(웹)과 Airbnb(모바일 웹)의 필터 배치 차이.
visibility: public
---

# 공개 커머스 필터 비교

| | 네이버 쇼핑 | Airbnb |
|---|---|---|
| 플랫폼 | web | web-mobile |
| 필터 위치 | 그리드 직상단 칩 | 검색 요약 아래 칩 + 모달 |
| 결과 형태 | 3열 카드 | 세로 카드 |

## 관련 캡처

- [[naver-shopping-gallery]]
- [[airbnb-mobile-search]]
`,
  );

  writeFileSync(
    "obsidian/wiki/questions/chip-filter-defaults.md",
    `---
title: 칩 필터의 기본값
summary: 첫 진입 시 칩을 모두 비활성으로 둘지, 추천 칩을 켤지에 대한 미해결 질문.
visibility: internal
---

# 칩 필터의 기본값

아직 확정하지 않은 질문. 캡처만으로는 A/B 결과를 알 수 없다.

## 단서 캡처

- [[naver-shopping-gallery]]
- [[filter-confirm-pulse]]
- [[figma-community-gallery]]
`,
  );

  // Remove obsolete sample service page if present.
  rmSync("obsidian/wiki/services/example-design.md", { force: true });

  writeFileSync(
    "obsidian/wiki/log.md",
    `# Wiki log

Append-only timeline. Each entry starts with \`## [YYYY-MM-DD] <operation> | <title>\`.

## [2026-08-05] ingest | dummy vault seed

실제 화면처럼 보이도록 캡처 16건, 컬렉션 4개, wiki 패턴/서비스/비교/질문 페이지를 더미 데이터로 재구성했다. 분석 본문은 전문용어를 제외하고 한글로 작성.

## [2026-08-05] lint | public capture refs

public wiki 페이지는 public 캡처만 링크하도록 정리했다. 내부 모션·운영 패턴은 internal 페이지로 분리.

## [2026-08-03] query | filter pattern overlap

\`naver-shopping-gallery\`와 \`figma-community-gallery\`는 tags/uiPatterns 교집합이 커서 related에 같이 뜬다.
`,
  );
}

function main(): void {
  // Remove previous sample captures and obsolete collections.
  for (const slug of [
    "sample-public-still",
    "sample-internal-motion",
    "sample-default-visibility",
  ]) {
    rmSync(join("obsidian/captures", slug), { recursive: true, force: true });
  }
  for (const file of ["seed-gallery.md", "public-seed.md"]) {
    rmSync(join("obsidian/collections", file), { force: true });
  }

  for (const capture of CAPTURES) {
    writeCapture(capture);
    console.log(`wrote capture ${capture.slug} (${capture.kind})`);
  }

  writeCollections();
  writeWiki();
  console.log(`OK: seeded ${CAPTURES.length} captures, 4 collections, wiki pages`);
}

main();
