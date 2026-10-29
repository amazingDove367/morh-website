/**
 * 측정 이벤트 (GA4 측정 ID 가 설정된 환경에서만 GA4 로 전송, 없으면 페이지 안에만 기록)
 *
 * 전체 이벤트 목록과 핵심·보조 구분은 EVENTS 에 있습니다(이름·파라미터를 바꾸면 Notion 'MORH 웹사이트 — 버전 기록'도 갱신).
 * - 버튼·링크: HTML 요소에 data-ga="이벤트" data-ga-파라미터="값" 을 붙이면 클릭 시 자동 전송(initClickTracking)
 * - 그 밖의 행동(입력 칸·스크롤·확대 등)은 각 컴포넌트 스크립트에서 track() 호출
 * - 같은 순간 Meta 픽셀에도 전송(META_EVENTS 매핑, 없는 이름은 trackCustom). 페이지 조회·스크롤은 제외
 * - 모든 이벤트에 page_locale(언어)·page_type(화면 종류)을 붙임
 * - 이름·연락처·이메일·주소 등 입력값은 어떤 이벤트에도 넣지 않음(입력 칸은 칸 이름만 보냄)
 * - 주소 끝에 ?ga_debug=1 → GA4 DebugView 로 보내고(debug_mode) 화면 오른쪽 아래에 확인 패널 표시
 */
import { PRICE, PRODUCT } from '../data/commerce';

type Params = Record<string, string | number | boolean | unknown[]>;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void; __events?: unknown[] }
}

/** GA4 이벤트 → Meta 픽셀 표준 이벤트. 목록에 없는 이벤트는 trackCustom 으로 GA4 이름 그대로 전송 */
const META_EVENTS: Record<string, string> = {
  generate_lead: 'Lead',
  sign_up: 'CompleteRegistration',
  contact_click: 'Contact',
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  purchase: 'Purchase',
  search: 'Search',
};
/** Meta 로 보내지 않는 이벤트: 페이지 조회·스크롤(홈 장면 스크롤 진행 ritual_progress 포함) */
const META_SKIP = new Set(['page_view', 'scroll', 'ritual_progress']);

/** GA4 와 같은 순간 Meta 픽셀 이벤트 전송 (픽셀이 없으면 호출되지 않음) */
function metaTrack(name: string, params: Params) {
  if (META_SKIP.has(name)) return;
  const meta = META_EVENTS[name];
  if (!meta) window.fbq!('trackCustom', name);
  else if (meta === 'Purchase') window.fbq!('track', meta, { value: params.value, currency: 'KRW' });
  else window.fbq!('track', meta);
}

/** 이벤트 목록: tier = 'core'(전환 퍼널) | 'aux'(관심·탐색 진단) / key = GA4 주요 이벤트 */
export const EVENTS = {
  // 핵심 — 전환 퍼널
  view_item: { tier: 'core' },
  add_to_cart: { tier: 'core' },
  begin_checkout: { tier: 'core' },
  add_payment_info: { tier: 'core', key: true }, // 결제하기 클릭 = 1차 전환
  form_start: { tier: 'core' },
  generate_lead: { tier: 'core', key: true }, // 출시 알림 신청 = 2차 전환
  // 보조 — 탐색·관심·이탈 진단
  nav_click: { tier: 'aux' },
  cta_click: { tier: 'aux' },
  language_menu_open: { tier: 'aux' },
  language_change: { tier: 'aux' },
  ritual_progress: { tier: 'aux' },
  select_content: { tier: 'aux' },
  texture_open: { tier: 'aux' },
  texture_close: { tier: 'aux' },
  texture_zoom: { tier: 'aux' },
  texture_pan: { tier: 'aux' },
  quantity_change: { tier: 'aux' },
  review_more: { tier: 'aux' },
  review_page: { tier: 'aux' },
  lightbox_navigate: { tier: 'aux' },
  lightbox_close: { tier: 'aux' },
  tab_click: { tier: 'aux' },
  faq_open: { tier: 'aux' },
  shipping_region_select: { tier: 'aux' },
  form_field_focus: { tier: 'aux' },
  form_field_complete: { tier: 'aux' },
  form_error: { tier: 'aux' },
} as const;
export type EventName = keyof typeof EVENTS;

const debug = typeof location !== 'undefined' && new URLSearchParams(location.search).get('ga_debug') === '1';

/** GA4 전자상거래 items (언어와 관계없이 고정값) */
export function items(quantity = 1) {
  return [{ item_id: PRODUCT.id, item_name: 'MORH Brightening Cream', item_brand: 'MORH', item_category: 'Skincare', price: PRICE.firstPurchase, quantity }];
}
/** 금액·통화·상품을 함께 */
export const ecommerce = (quantity = 1, extra: Params = {}): Params => ({ currency: 'KRW', value: PRICE.firstPurchase * quantity, items: items(quantity), ...extra });

export function track(name: EventName, params: Params = {}) {
  if (!(name in EVENTS)) return;
  const payload: Params = {
    ...params,
    page_locale: document.documentElement.dataset.locale || document.documentElement.lang,
    page_type: document.body.dataset.page || 'other',
    ...(debug ? { debug_mode: true } : {}),
  };
  // 결제하기처럼 곧바로 페이지를 떠나는 클릭도 전송되도록 beacon 사용
  if (typeof window.gtag === 'function') window.gtag('event', name, { ...payload, transport_type: 'beacon' });
  if (window.fbq) metaTrack(name, payload);
  window.__events?.push([name, payload]);
  if (debug) panel(name, payload);
}

/** 같은 세션에서 한 번만 보내는 이벤트(새로고침 중복 방지) */
export function trackOnce(key: string, name: EventName, params: Params = {}) {
  try {
    if (sessionStorage.getItem(`ev:${key}`)) return;
    sessionStorage.setItem(`ev:${key}`, '1');
  } catch { /* 저장소를 쓸 수 없으면 그대로 1회 전송 */ }
  track(name, params);
}

/** data-ga 속성 클릭 추적 (문서 전체에 한 번) */
export function initClickTracking() {
  const w = window as unknown as { __gaClicks?: boolean };
  if (w.__gaClicks) return;
  w.__gaClicks = true;
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-ga]');
    if (!el) return;
    const name = el.dataset.ga as EventName;
    const params: Params = {};
    for (const a of [...el.attributes]) {
      if (a.name.startsWith('data-ga-')) params[a.name.slice(8).replace(/-/g, '_')] = a.value;
    }
    track(name, params);
  }, { capture: true });
}

/** 폼 입력 진행 추적: 첫 입력(form_start)·칸 포커스·칸 작성 완료(값은 보내지 않고 칸 이름만) */
export function trackFormFields(form: HTMLFormElement, formId: string) {
  let started = false;
  form.querySelectorAll<HTMLInputElement>('input, textarea, select').forEach((input) => {
    const field = input.dataset.field || input.id;
    input.addEventListener('focus', () => {
      if (!started) { started = true; track('form_start', { form_id: formId }); }
      track('form_field_focus', { form_id: formId, field_name: field });
    });
    input.addEventListener('change', () => {
      if (input.value.trim()) track('form_field_complete', { form_id: formId, field_name: field });
    });
  });
}

/* ── ?ga_debug=1 확인 패널 ── */
let box: HTMLElement | null = null;
function panel(name: string, p: Params) {
  if (!box) {
    box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.dataset.gaPanel = '';
    box.style.cssText = 'position:fixed;right:8px;bottom:8px;z-index:9999;width:min(340px,calc(100vw - 16px));max-height:40vh;overflow:auto;background:#2b1a1f;color:#fcfaf6;font:12px/1.5 ui-monospace,monospace;padding:8px 10px;opacity:.94;pointer-events:none';
    const head = document.createElement('b');
    head.textContent = `${typeof window.gtag === 'function' ? '✅ GA4 연결됨' : '⚠️ GA4 미연결(측정 ID 없음)'} · ★ 핵심 · 보조`;
    box.append(head);
    document.body.append(box);
  }
  const row = document.createElement('div');
  const tier = EVENTS[name as EventName]?.tier === 'core' ? '★' : '·';
  const { page_locale: _l, page_type: _t, debug_mode: _d, items: _i, ...rest } = p;
  row.textContent = `${tier} ${name} ${JSON.stringify(rest)}`;
  box.append(row);
  box.scrollTop = box.scrollHeight;
}
