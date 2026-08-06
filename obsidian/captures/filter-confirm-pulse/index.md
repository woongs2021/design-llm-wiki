---
slug: filter-confirm-pulse
title: "내부 도구 — 필터 확정 펄스"
asset: capture.gif
visibility: internal
capturedAt: 2026-08-03
appVersion: "3.2"
service: "Internal Tools"
platform: web
screenType: search
uiPatterns:
  - filter-chips
  - toast
tone: data-dense
copyTone: instructional
tags:
  - filters
  - motion
  - density
insight: "필터 적용 직후 짧은 펄스와 토스트로 ‘반영됨’을 보여 주면, 결과 지연이 있어도 조작이 실패했다고 느끼지 않는다."
---

## Layout

상단 칩 행과 결과 리스트. 활성 칩 주변에 짧은 하이라이트 링이 두 프레임에 걸쳐 나타난다.

## Color

밀도 높은 툴 UI. 활성 칩은 미드 블루, 펄스는 소프트 블루. 관측: `#16427C`, `#A1D0F6`(데이터).

## Typography

칩 라벨은 작고 굵게, 결과 행은 표에 가깝다. Typeface: 미확정.

## Interaction

모션 GIF에서 칩 확정 후 약 2프레임의 펄스와 하단 토스트가 관측됨. 호버 상태는 사용자 확인 필요.
