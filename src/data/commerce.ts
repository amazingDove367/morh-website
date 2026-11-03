/**
 * 가격·구성(세트)·배송비·제품 사양의 단일 출처 (상품 화면 · 주문 요약 · 모든 언어 화면이 이 값을 사용)
 *
 * 표시 기준은 사용자가 지정한 값입니다. 실제 판매 이력은 확인되지 않았습니다.
 * - BASE(59,000원)는 '기준가'로만 표기하고, 과거 실제 판매가였다고 표현하지 않습니다.
 * - 첫 구매 혜택가는 첫 구매 여부를 판별하는 시스템 없이 '적용된 상태'를 보여 주는 화면입니다.
 * - 도서산간 배송비는 기본 배송비에 더하는 금액이 아니라 '총 5,000원'입니다.
 * - 주소별 도서산간 자동 판정 기능은 없습니다. 주문/결제 화면에서 지역 유형을 직접 고릅니다.
 */
export const CURRENCY = 'KRW' as const;

export const PRICE = {
  base: 59000,
  firstPurchase: 41300,
} as const;

/** 할인율: (기준가 − 혜택가) ÷ 기준가 × 100, 소수점 아래 버림 → 30% (올려서 과장하지 않도록 버림으로 통일) */
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
 * 구성(세트): 첫 구매 혜택 — 더할수록 커지는 할인폭
 * - 1개 30% · 2개 세트 40% · 3개 세트 50% (기준가 × 개수 대비, 1개당 41,300 → 35,400 → 29,500원)
 * - 2개 이상 세트는 기본 배송비 무료(도서산간은 추가분 2,000원만)
 * - 태그 문구는 사전의 product.setTags[id]. best = 개당 가격이 가장 낮은 구성(태그를 채운 색으로 강조)
 * - 배열 순서 = 화면의 위→아래 순서
 * - id 는 측정(item_variant · set_option)에 그대로 쓰이므로 바꾸지 않음. 가격·구성은 이 표만 고치면 화면 전체에 반영
 */
export const SETS = [
  { id: 'single', units: 1, price: 41300, best: false },
  { id: 'set2', units: 2, price: 70800, best: false },
  { id: 'set3', units: 3, price: 88500, best: true },
] as const;
export type SetId = (typeof SETS)[number]['id'];
export type SetOption = (typeof SETS)[number];
export const setById = (id: string | null | undefined): SetOption => SETS.find((s) => s.id === id) ?? SETS[0];
/** 세트의 기준가 합계 · 할인율(버림) · 1개당 가격 */
export const setBase = (s: SetOption) => PRICE.base * s.units;
export const setPct = (s: SetOption) => Math.floor(((setBase(s) - s.price) / setBase(s)) * 100);
export const setPerUnit = (s: SetOption) => Math.round(s.price / s.units);

/** 배송비: 1개는 기본·도서산간 총액 그대로, 2개 이상 세트는 기본 무료 · 도서산간은 추가분만 */
export function shippingFor(units: number, region: Region) {
  if (units >= 2) return region === 'remote' ? SHIPPING.remoteTotal - SHIPPING.standard : 0;
  return region === 'remote' ? SHIPPING.remoteTotal : SHIPPING.standard;
}

/**
 * 주문 금액 계산 (qty = 고른 구성의 수량)
 * 상품 금액 = 기준가 × 개수 × 수량, 혜택 = 상품 금액 − 구성 가격 × 수량 (현재 모든 주문을 첫 구매로 봄)
 */
export function orderSummary(qty: number, region: Region = 'standard', setId: string = 'single') {
  const s = setById(setId);
  const q = Math.min(PRODUCT.maxQty, Math.max(1, Math.round(qty)));
  const subtotal = setBase(s) * q;
  const benefit = subtotal - s.price * q;
  const shipping = shippingFor(s.units, region);
  return { qty: q, set: s.id, region, subtotal, benefit, shipping, total: subtotal - benefit + shipping };
}
