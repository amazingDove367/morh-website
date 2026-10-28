/**
 * 가격·배송비·제품 사양의 단일 출처 (상품 화면 · 주문 요약 · 모든 언어 화면이 이 값을 사용)
 *
 * 표시 기준은 사용자가 지정한 값입니다. 실제 판매 이력은 확인되지 않았습니다.
 * - BASE(42,000원)는 '기준가'로만 표기하고, 과거 실제 판매가였다고 표현하지 않습니다.
 * - 첫 구매 혜택가는 첫 구매 여부를 판별하는 시스템 없이 '적용된 상태'를 보여 주는 화면입니다.
 * - 도서산간 배송비는 기본 배송비에 더하는 금액이 아니라 '총 5,000원'입니다.
 * - 주소별 도서산간 자동 판정 기능은 없습니다. 주문/결제 화면에서 지역 유형을 직접 고릅니다.
 */
export const CURRENCY = 'KRW' as const;

export const PRICE = {
  base: 42000,
  firstPurchase: 35000,
} as const;

/** 할인율: (기준가 − 혜택가) ÷ 기준가 × 100, 소수점 아래 버림 → 16% (16.67%를 올려 과장하지 않도록 버림으로 통일) */
export const DISCOUNT_PCT = Math.floor(((PRICE.base - PRICE.firstPurchase) / PRICE.base) * 100);

export const SHIPPING = {
  standard: 3000,
  /** 도서산간 지역 총 배송비(기본 배송비 포함) */
  remoteTotal: 5000,
} as const;

export type Region = 'standard' | 'remote';

export const PRODUCT = {
  id: 'morh-brightening-cream',
  volumeMl: 50,        // 사용자 지정 — 출시 전 확인 필요
  originCountry: 'KR', // 사용자 지정(대한민국) — 출시 전 확인 필요
  maxQty: 5,
} as const;

/**
 * 주문 금액 계산
 * 첫 구매 혜택은 수량과 관계없이 이번 주문의 모든 수량에 1개당 (기준가 − 혜택가)만큼 적용합니다(현재 모든 주문을 첫 구매로 봄).
 */
export function orderSummary(qty: number, region: Region = 'standard') {
  const q = Math.min(PRODUCT.maxQty, Math.max(1, Math.round(qty)));
  const subtotal = PRICE.base * q;
  const benefit = (PRICE.base - PRICE.firstPurchase) * q;
  const shipping = region === 'remote' ? SHIPPING.remoteTotal : SHIPPING.standard;
  return { qty: q, region, subtotal, benefit, shipping, total: subtotal - benefit + shipping };
}
