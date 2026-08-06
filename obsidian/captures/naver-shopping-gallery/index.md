---
slug: naver-shopping-gallery
title: "네이버 쇼핑 — 필터형 상품 그리드"
asset: capture.png
visibility: public
capturedAt: 2026-07-28
sourceUrl: https://shopping.naver.com
service: "네이버 쇼핑"
platform: web
screenType: gallery
uiPatterns:
  - card-grid
  - filter-chips
tone: informational
copyTone: instructional
tags:
  - gallery
  - filters
  - cards
insight: "칩 필터를 그리드 위에 고정하면 스크롤 중에도 결과 집합을 제어한다는 느낌이 유지된다."
---

## Layout

상단에 검색·카테고리 행, 바로 아래 가로 스크롤 가능한 필터 칩, 본문은 3열 카드 그리드. 페이지 제목은 그리드 밖에 두어 필터가 1차 조작으로 읽힌다.

## Color

밝은 중립 배경에 활성 칩만 진한 블루 액센트. 관측 액센트 후보: `#03C75A` 인근 그린과 보조 블루(데이터, 사이트 토큰 아님).

## Typography

카드 제목은 본문보다 한 단계 굵고, 가격·배송 메타는 작은 캡션. Typeface: 미확정.

## Interaction

사용자 확인 필요 — 정지 캡처라 칩 토글과 결과 리프레시 타이밍을 확인할 수 없음.
