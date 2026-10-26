/*
  스크롤 연동 모션 유틸. 스크롤을 가로채거나 속도를 바꾸지 않고, 현재 스크롤 위치를 읽어 transform 만 갱신합니다.
  - 'sticky' : 고정 구간 안에서의 진행도 (0 = 구간 시작, 1 = 고정 해제 직전)
  - 'pass'   : 요소가 화면 아래에서 들어와 위로 나갈 때까지의 진행도
*/
type Mode = 'sticky' | 'pass';
type Cb = (p: number) => void;

const subs: { el: Element; mode: Mode; cb: Cb }[] = [];
let ticking = false;

export const reduced = () => document.documentElement.classList.contains('reduce-motion');
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** p 의 [a, b] 구간을 0..1 로 */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function measure(el: Element, mode: Mode) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  if (mode === 'sticky') return clamp(-r.top / Math.max(1, r.height - vh));
  return clamp((vh - r.top) / (r.height + vh));
}

function update() {
  ticking = false;
  for (const s of subs) s.cb(measure(s.el, s.mode));
}

function request() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}

export function onProgress(el: Element | null, mode: Mode, cb: Cb) {
  if (!el) return;
  subs.push({ el, mode, cb });
  if (subs.length === 1) {
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', request);
  }
  request();
}

export function initReveal(root: ParentNode = document) {
  const items = root.querySelectorAll('.reveal');
  if (reduced() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -12% 0px' });
  items.forEach((el) => io.observe(el));
}
