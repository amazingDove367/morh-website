/*
  구매 흐름: 구매하기 → 구매 신청 시트 → 제출 → 개인정보 처리 안내(동의) → 입력값 즉시 삭제 → /result/
  기존 저장소의 id(cta-main, lead-form, cta-submit)를 유지해 GA4·픽셀 이벤트를 같은 방식으로 붙일 수 있습니다.
*/
import { openPrivacy } from './privacy';
import { product, formatKRW } from '../data/product';

declare global {
  interface Window { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }
}

let qty = 1;

function render() {
  document.querySelectorAll('[data-qty-value]').forEach((el) => { el.textContent = String(qty); });
  document.querySelectorAll('[data-total]').forEach((el) => { el.textContent = formatKRW(product.price.value * qty); });
  document.querySelectorAll<HTMLButtonElement>('[data-qty]').forEach((b) => {
    const d = Number(b.dataset.qty);
    b.disabled = (d < 0 && qty <= 1) || (d > 0 && qty >= product.maxQty);
  });
}

function wipe(form: HTMLFormElement) {
  form.querySelectorAll<HTMLInputElement>('input, select, textarea').forEach((el) => {
    if (el.type === 'checkbox' || el.type === 'radio') el.checked = false;
    else el.value = '';
  });
  form.reset();
}

export function initPurchase() {
  const sheet = document.getElementById('purchase-sheet') as HTMLDialogElement | null;
  const form = document.getElementById('lead-form') as HTMLFormElement | null;
  if (!sheet || !form) return;

  document.querySelectorAll<HTMLButtonElement>('[data-qty]').forEach((b) => {
    b.addEventListener('click', () => {
      qty = Math.min(product.maxQty, Math.max(1, qty + Number(b.dataset.qty)));
      render();
    });
  });
  render();

  let opener: HTMLElement | null = null;
  document.querySelectorAll<HTMLElement>('[data-buy-open]').forEach((b) => {
    b.addEventListener('click', () => {
      opener = b;
      sheet.showModal();
      (form.querySelector('input') as HTMLInputElement | null)?.focus();
      window.gtag?.('event', 'begin_checkout');
    });
  });
  sheet.querySelector('[data-sheet-close]')?.addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener('close', () => opener?.focus());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    openPrivacy('submit', () => {
      wipe(form);
      sheet.close();
      // 분석 도구를 붙였다면 개인정보 없이 이벤트 이름만 보냅니다.
      window.gtag?.('event', 'generate_lead');
      window.fbq?.('track', 'Lead');
      location.replace('/result/');
    });
  });

  // 모바일 하단 구매 바: 본문 구매 버튼이 화면에 없을 때만 표시
  const bar = document.querySelector<HTMLElement>('[data-buybar]');
  const main = document.getElementById('cta-main');
  if (bar && main && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      const show = !entry.isIntersecting;
      bar.classList.toggle('is-visible', show);
      bar.toggleAttribute('inert', !show);
      bar.setAttribute('aria-hidden', String(!show));
    }).observe(main);
  }
}
