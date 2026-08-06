---
slug: modal-bulk-edit
title: "운영 — 일괄 수정 모달"
asset: capture.png
visibility: internal
capturedAt: 2026-06-15
appVersion: "2.4.0"
service: "Ops Console"
platform: web
screenType: form
uiPatterns:
  - modal
  - data-table
tone: informational
copyTone: imperative
tags:
  - forms
  - density
  - cards
insight: "일괄 수정은 배경 표를 흐리게 남기고 모달에 영향 범위를 숫자로 보여 주면 실수 부담이 줄어든다."
---

## Layout

배경에 선택된 행이 보이는 테이블, 중앙 모달에 필드 3개와 영향 N건 요약, 하단 취소/적용.

## Color

오버레이는 반투명 딥 네이비, 모달은 흰 카드. 적용 버튼만 프라이머리.

## Typography

모달 제목 > 영향 요약 > 필드 라벨 순. Typeface: 미확정.

## Interaction

사용자 확인 필요 — 적용 후 토스트·테이블 갱신은 캡처에 없음.
