/*
  주문/결제: 수량·배송 지역에 따라 금액 계산 → '결제하기' → 배송 정보 입력 창 → '주문 완료'
  - 계산은 src/data/commerce.ts 의 orderSummary 와 같은 규칙(화면 data-* 값 사용)
  - 받는 분·연락처·주소는 검증에만 쓰고, 완료·닫기·나가기 시 즉시 지움. 어떤 이벤트·저장소·URL 에도 넣지 않음
  - 완료 화면에는 개인정보가 아닌 주문 내역(수량·배송 지역·금액)만 sessionStorage 로 전달
*/
import { track } from './analytics';
import { money } from '../i18n/format';
import type { Locale } from '../i18n/locales';

export const SUMMARY_KEY = 'morh:demo-order';

export function initCheckout() {
  const root = document.querySelector<HTMLElement>('[data-checkout]');
  const dialog = document.getElementById('ship-dialog') as HTMLDialogElement | null;
  const form = document.getElementById('ship-form') as HTMLFormElement | null;
  const pay = document.getElementById('cta-pay') as HTMLButtonElement | null;
  if (!root || !dialog || !form || !pay) return;
  const d = root.dataset;
  const locale = d.locale as Locale;
  const base = Number(d.base), first = Number(d.first), ship = Number(d.ship), remote = Number(d.remote), max = Number(d.max);
  const str = JSON.parse(d.strings || '{}') as { errPhone: string; errRequired: string };

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
    qty = Math.min(max, Math.max(1, qty + Number(b.dataset.coQty)));
    render();
  }));
  root.querySelectorAll('[data-region]').forEach((r) => r.addEventListener('change', render));

  // ── 배송 정보 입력 창 ──
  const fields = {
    name: document.getElementById('ship-name') as HTMLInputElement,
    phone: document.getElementById('ship-phone') as HTMLInputElement,
    address: document.getElementById('ship-address') as HTMLInputElement,
  };
  const errs = {
    name: document.getElementById('ship-name-err')!,
    phone: document.getElementById('ship-phone-err')!,
    address: document.getElementById('ship-address-err')!,
  };
  const setErr = (k: keyof typeof fields, msg: string) => {
    errs[k].textContent = msg; errs[k].hidden = !msg;
    fields[k].setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  function wipe() {
    (Object.keys(fields) as (keyof typeof fields)[]).forEach((k) => { fields[k].value = ''; setErr(k, ''); fields[k].removeAttribute('aria-invalid'); });
    form!.reset();
  }

  pay.addEventListener('click', () => {
    dialog.showModal();
    fields.name.focus();
  });
  const leave = () => { wipe(); dialog.close(); };
  dialog.querySelector('[data-ship-close]')?.addEventListener('click', leave);
  dialog.querySelector('[data-ship-exit]')?.addEventListener('click', leave);
  dialog.addEventListener('cancel', () => wipe()); // Esc
  dialog.addEventListener('click', (e) => { if (e.target === dialog) leave(); });
  dialog.addEventListener('close', () => pay.focus());

  render();
  track('begin_demo_checkout', { quantity: qty });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let firstBad: HTMLInputElement | null = null;
    (['name', 'phone', 'address'] as const).forEach((k) => {
      const empty = !fields[k].value.trim();
      setErr(k, empty ? str.errRequired : '');
      if (empty) firstBad ??= fields[k];
    });
    const ph = fields.phone.value.trim();
    if (ph && !/^[0-9][0-9\- ]{7,14}[0-9]$/.test(ph)) { setErr('phone', str.errPhone); firstBad ??= fields.phone; }
    if (firstBad) { (firstBad as HTMLInputElement).focus(); return; }

    const s = calc();
    wipe();
    try { sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(s)); } catch { /* 저장소를 쓸 수 없어도 완료 화면은 표시 */ }
    location.assign(d.complete!);
  });
}
