/*
  개인정보 처리 안내 팝업. 기존 morh-website 저장소 assets/js/privacy.js 의 흐름을 그대로 따릅니다.
  - info 모드: 안내만 확인
  - submit 모드: 동의 체크 → '동의하고 완료하기' → onConfirm(입력값 삭제 → result 이동)
*/
type Mode = 'info' | 'submit';

let mode: Mode = 'info';
let onConfirm: (() => void) | null = null;
let returnFocus: HTMLElement | null = null;

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;

export function openPrivacy(m: Mode, confirm?: () => void) {
  const modal = $<HTMLDialogElement>('privacy-modal');
  const agree = $<HTMLInputElement>('privacy-agree');
  const ok = $<HTMLButtonElement>('privacy-ok');
  if (!modal || !agree || !ok) return;
  mode = m;
  onConfirm = confirm ?? null;
  returnFocus = document.activeElement as HTMLElement | null;
  agree.checked = false;
  ok.disabled = true;
  ok.textContent = m === 'submit' ? '동의하고 완료하기' : '확인했습니다';
  modal.showModal();
  agree.focus();
}

function close() {
  const modal = $<HTMLDialogElement>('privacy-modal');
  if (modal?.open) modal.close();
}

export function initPrivacy() {
  const modal = $<HTMLDialogElement>('privacy-modal');
  const agree = $<HTMLInputElement>('privacy-agree');
  const ok = $<HTMLButtonElement>('privacy-ok');
  const cancel = $<HTMLButtonElement>('privacy-cancel');
  if (!modal || !agree || !ok || !cancel) return;

  agree.addEventListener('change', () => { ok.disabled = !agree.checked; });
  cancel.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  modal.addEventListener('close', () => { returnFocus?.focus?.(); });

  ok.addEventListener('click', () => {
    if (mode !== 'submit') { close(); return; }
    const fn = onConfirm;
    onConfirm = null;
    close();
    fn?.();
  });

  document.querySelectorAll<HTMLElement>('[data-privacy-open]').forEach((b) => {
    b.addEventListener('click', (e) => { e.preventDefault(); openPrivacy('info'); });
  });
}
