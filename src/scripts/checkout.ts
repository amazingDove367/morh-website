/*
  주문 체험: 수량·지역 유형에 따라 금액 계산 → 확인 체크 → 완료
  - 계산은 src/data/commerce.ts 의 orderSummary 와 같은 규칙(화면 data-* 값 사용)
  - 직접 입력값은 검증에만 쓰고, 완료 시 즉시 지움. 어떤 이벤트·저장소·URL 에도 넣지 않음
  - 완료 화면에는 개인정보가 아닌 요약(수량·지역 유형·금액)만 sessionStorage 로 전달
*/
import { track } from './analytics';
import { money } from '../i18n/format';
import type { Locale } from '../i18n/locales';

export const SUMMARY_KEY = 'morh:demo-order';

export function initCheckout() {
  const root = document.querySelector<HTMLElement>('[data-checkout]');
  const form = document.getElementById('checkout-form') as HTMLFormElement | null;
  if (!root || !form) return;
  const d = root.dataset;
  const locale = d.locale as Locale;
  const base = Number(d.base), first = Number(d.first), ship = Number(d.ship), remote = Number(d.remote), max = Number(d.max);
  const str = JSON.parse(d.strings || '{}') as { errConfirm: string; errPhone: string; errRequired: string };

  const fromUrl = Number(new URLSearchParams(location.search).get('qty'));
  let qty = Number.isFinite(fromUrl) && fromUrl >= 1 ? Math.min(max, Math.round(fromUrl)) : 1;
  // 주소창의 qty 는 개인정보가 아니지만, 화면 진입 뒤에는 정리해 둠
  if (location.search) history.replaceState(null, '', location.pathname);

  const region = () => (form.querySelector<HTMLInputElement>('[data-region]:checked')?.value === 'remote' ? 'remote' : 'standard');
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
    qty = Math.min(max, Math.max(1, qty + Number(b.dataset.coQty)));
    render();
  }));
  form.querySelectorAll('[data-region]').forEach((r) => r.addEventListener('change', render));

  const own = root.querySelector<HTMLElement>('[data-own-box]')!;
  const sample = root.querySelector<HTMLElement>('[data-sample-box]')!;
  const fields = [...own.querySelectorAll<HTMLInputElement>('input')];
  const phone = document.getElementById('co-phone') as HTMLInputElement;
  const phoneErr = document.getElementById('co-phone-err')!;
  const confirm = document.getElementById('co-confirm') as HTMLInputElement;
  const confirmErr = document.getElementById('co-confirm-err')!;
  const ownMode = () => form.querySelector<HTMLInputElement>('[data-mode]:checked')?.value === 'own';
  form.querySelectorAll('[data-mode]').forEach((m) => m.addEventListener('change', () => {
    own.hidden = !ownMode();
    sample.hidden = ownMode();
    if (!ownMode()) wipe();
  }));

  const setErr = (el: HTMLElement, input: HTMLInputElement, msg: string) => {
    el.textContent = msg; el.hidden = !msg;
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  function wipe() {
    fields.forEach((f) => { f.value = ''; f.removeAttribute('aria-invalid'); });
    phoneErr.hidden = true;
  }

  render();
  track('begin_demo_checkout', { quantity: qty });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad: HTMLElement | null = null;
    if (ownMode()) {
      // 직접 입력을 골랐다면 세 칸 모두 필요(가상 정보로 바꾸면 입력 없이 진행 가능)
      for (const f of fields) {
        const empty = !f.value.trim();
        f.setAttribute('aria-invalid', empty ? 'true' : 'false');
        if (empty) { f.setCustomValidity(str.errRequired); firstBad ??= f; } else f.setCustomValidity('');
      }
      const ok = /^[0-9][0-9\- ]{7,14}[0-9]$/.test(phone.value.trim());
      setErr(phoneErr, phone, phone.value.trim() && !ok ? str.errPhone : '');
      if (phone.value.trim() && !ok) firstBad ??= phone;
      if (firstBad) { (firstBad as HTMLInputElement).reportValidity?.(); }
    }
    setErr(confirmErr, confirm, confirm.checked ? '' : str.errConfirm);
    if (!confirm.checked) firstBad ??= confirm;
    if (firstBad) { firstBad.focus(); return; }

    const s = calc();
    wipe();
    form.reset();
    try { sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(s)); } catch { /* 저장소를 쓸 수 없어도 완료 화면은 표시 */ }
    location.assign(d.complete!);
  });
}
