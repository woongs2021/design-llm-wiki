---
slug: warehouse-event-timeline
title: "물류 — 이벤트 타임라인"
asset: capture.png
visibility: internal
capturedAt: 2026-07-25
service: "Warehouse Ops"
platform: web
screenType: dashboard
uiPatterns:
  - timeline
  - filter-chips
tone: urgent
copyTone: tense
tags:
  - dashboard
  - filters
  - motion
insight: "장애·지연 이벤트는 시간축에 심각도를 색으로 얹어, 필터 없이도 ‘언제 커졌는지’가 보이게 한다."
---

## Layout

상단 심각도 칩, 본문은 세로 타임라인과 우측 상세 패널. 현재 시각 마커가 있다.

## Color

기본 라인은 쿨 그레이, critical만 로즈. 관측 경고색 후보: `#FF105C` 인근(데이터).

## Typography

시간 스탬프는 고정폭 느낌, 이벤트 제목은 본문. Typeface: 미확정.

## Interaction

사용자 확인 필요 — 실시간 스트림 갱신은 캡처에 없음.
