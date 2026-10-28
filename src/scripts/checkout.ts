/*
  주문/결제: 수량·배송 지역에 따라 금액 계산 → '결제하기'(핵심 전환) → 완료 화면
  - 계산은 src/data/commerce.ts 의 orderSummary 와 같은 규칙(화면 data-* 값 사용)
  - 개인정보는 받지 않음. 완료 화면에는 주문 내역(수량·배송 지역·금액)만 sessionStorage 로 전달
*/
import { track, ecommerce } from './analytics';
import { money } from '../i18n/format';
import type { Locale } from '../i18n/locales';

export const SUMMARY_KEY = 'morh:demo-order';

export function initCheckout() {
  const root = document.querySelector<HTMLElement>('[data-checkout]');
  const pay = document.getElementById('cta-pay') as HTMLButtonElement | null;
  if (!root || !pay) return;
  const d = root.dataset;
  const locale = d.locale as Locale;
  const base = Number(d.base), first = Number(d.first), ship = Number(d.ship), remote = Number(d.remote), max = Number(d.max);

  const fromUrl = Number(new URLSearchParams(location.search).get('qty'));
  let qty = Number.isFinite(fromUrl) && fromUrl >= 1 ? Math.min(max, Math.round(fromUrl)) : 1;
  // 주소창의 qty 는 개인정보가 아니지만, 화면 진입 뒤에는 정리해 둠
  if (location.search) history.replaceState(null, '', location.pathname);

  const region = () => (root.querySelector<HTMLInputElement>('[data-region]:checked')?.value === 'remote' ? 'remote' : 'standard');
  const calc = () => {
    const subtotal = base * qty, benefit = (base - first) * qty, shipping = region() === 'remote' ? remote : ship;
    return { qty, region: region(), subtotal, benefit, shipping, total: subtotal - benefit + shipping };
  };
  const render = () => {
    const s = calc();
    root.querySelector('[data-co-qty-value]')!.textContent = String(qty);
    root.querySelector('[data-sum="subtotal"]')!.textContent = money(locale, s.subtotal);
    root.querySelector('[data-sum="benefit"]')!.textContent = `−${money(locale, s.benefit)}`;
    root.querySelector('[data-sum="shipping"]')!.textContent = money(locale, s.shipping);
    root.querySelector('[data-sum="total"]')!.textContent = money(locale, s.total);
    root.querySelectorAll<HTMLButtonElement>('[data-co-qty]').forEach((b) => {
      const dir = Number(b.dataset.coQty);
      b.disabled = (dir < 0 && qty <= 1) || (dir > 0 && qty >= max);
    });
  };
  root.querySelectorAll<HTMLButtonElement>('[data-co-qty]').forEach((b) => b.addEventListener('click', () => {
    const before = qty;
    qty = Math.min(max, Math.max(1, qty + Number(b.dataset.coQty)));
    render();
    if (qty !== before) track('quantity_change', { quantity: qty, direction: qty > before ? 'increase' : 'decrease', location: 'checkout' });
  }));
  root.querySelectorAll('[data-region]').forEach((r) => r.addEventListener('change', () => {
    render();
    track('shipping_region_select', { shipping_tier: region() });
  }));

  render();
  track('begin_checkout', ecommerce(qty, { checkout_type: 'demo' }));

  // 결제하기 = 1차 전환(주요 이벤트). 실제 결제가 없으므로 purchase 가 아닌 add_payment_info
  pay.addEventListener('click', () => {
    const s = calc();
    track('add_payment_info', ecommerce(qty, { payment_type: 'pay_button', shipping_tier: s.region, shipping: s.shipping, checkout_type: 'demo' }));
    try { sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(calc())); } catch { /* 저장소를 쓸 수 없어도 완료 화면은 표시 */ }
    location.assign(d.complete!);
  });
}
