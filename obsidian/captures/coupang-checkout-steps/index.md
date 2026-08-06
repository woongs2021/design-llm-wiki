---
slug: coupang-checkout-steps
title: "쿠팡 — 결제 단계 진행"
asset: capture.png
visibility: public
capturedAt: 2026-06-30
sourceUrl: https://www.coupang.com
service: "쿠팡"
platform: android
screenType: checkout
uiPatterns:
  - progress-bar
  - data-table
tone: urgent
copyTone: imperative
tags:
  - forms
  - density
  - navigation
insight: "결제 단계에서는 진행 바와 주문 요약을 같은 뷰포트에 두어 ‘지금 어디까지인지’를 먼저 읽게 한다."
---

## Layout

상단 스텝 바(배송→결제→완료), 중단 주소·쿠폰 요약 리스트, 하단 고정 결제 CTA. 스크롤 본문과 CTA가 분리된다.

## Color

흰 배경에 강조용 레드/오렌지 CTA. 관측 액센트 후보: `#E31837` 인근(데이터).

## Typography

금액은 표 형태 숫자 정렬, 안내 문구는 짧고 명령형. Typeface: 미확정.

## Interaction

사용자 확인 필요 — 쿠폰 적용 후 금액 재계산 피드백은 캡처에 없음.
