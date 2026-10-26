/**
 * 측정 이벤트 (GA4 측정 ID 가 설정된 환경에서만 전송, 없으면 아무것도 보내지 않음)
 *
 * view_item               상품 보기(상세페이지 진입)
 * buy_click               구매하기 버튼 클릭 { placement }
 * begin_demo_checkout     주문 체험 시작(주문 체험 화면 진입)
 * demo_checkout_complete  주문 체험 완료(완료 화면, 세션당 1회) — 실제 구매(purchase)·매출로 보지 않음
 *
 * 개인정보(이름·연락처·주소)와 입력값은 어떤 이벤트에도 넣지 않습니다. 금액은 화면 표시 기준(KRW)입니다.
 */
type Params = Record<string, string | number | boolean>;
declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void }
}

const ALLOWED = new Set(['view_item', 'buy_click', 'begin_demo_checkout', 'demo_checkout_complete']);

export function track(name: string, params: Params = {}) {
  if (!ALLOWED.has(name)) return;
  const payload = { ...params, locale: document.documentElement.lang };
  if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  // 개발 확인용: 측정 ID 가 없어도 페이지 안에서만 기록(외부 전송 없음)
  (window as unknown as { __events?: unknown[] }).__events?.push([name, payload]);
}

/** 같은 세션에서 한 번만 보내는 이벤트(새로고침 중복 방지) */
export function trackOnce(key: string, name: string, params: Params = {}) {
  try {
    if (sessionStorage.getItem(`ev:${key}`)) return;
    sessionStorage.setItem(`ev:${key}`, '1');
  } catch { /* 저장소를 쓸 수 없으면 그대로 1회 전송 */ }
  track(name, params);
}
