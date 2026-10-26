// 홈 스크롤 장면 프레임 측정: node scripts/perf-ritual.mjs [base] [label]
// - 페이지 스크립트보다 먼저 requestAnimationFrame 을 감싸 콜백 실행 시간(JS)과 프레임 간격을 기록
// - 패턴: 느린 스크롤 / 빠른 스크롤 / 빠른 역방향 / 섹션 경계 통과
// - 데스크톱(1440×900, DPR1) · 모바일(390×844, DPR2, CPU 4배 느리게)
// 주의: 헤드리스 Chrome 측정이므로 실제 기기의 GPU 합성·래스터 비용은 일부만 반영됩니다(전후 비교용).
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'http://127.0.0.1:4322';
const label = process.argv[3] || 'run';

const init = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.__perf = { cb: [], frames: [], on: false };
  let frameCb = 0, last = 0;
  window.requestAnimationFrame = (fn) => raf((t) => {
    const s = performance.now();
    try { fn(t); } finally { frameCb += performance.now() - s; }
  });
  const tick = (t) => {
    if (window.__perf.on) {
      if (last) window.__perf.frames.push(t - last);
      window.__perf.cb.push(frameCb);
    }
    frameCb = 0; last = t;
    raf(tick);
  };
  raf(tick);
};

const configs = [
  { name: 'desktop', vp: { width: 1440, height: 900 }, dsf: 1, mobile: false, cpu: 1 },
  { name: 'mobile-4xCPU', vp: { width: 390, height: 844 }, dsf: 2, mobile: true, cpu: 4 },
];

const stats = (a) => {
  if (!a.length) return {};
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: a.length, p50: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), max: +s[s.length - 1].toFixed(2) };
};

const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-gpu-rasterization'] });
const out = { label, base, results: [] };
for (const c of configs) {
  const ctx = await browser.newContext({ viewport: c.vp, deviceScaleFactor: c.dsf, isMobile: c.mobile, hasTouch: c.mobile });
  await ctx.addInitScript(init);
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.cpu });
  const geo = await page.evaluate(() => {
    const sec = document.querySelector('[data-ritual]');
    const top = sec.getBoundingClientRect().top + scrollY;
    return { top, end: top + sec.offsetHeight, H: innerHeight };
  });
  const patterns = [
    { name: 'slow', from: geo.top - 200, to: geo.end - geo.H + 300, step: 12 },
    { name: 'fast', from: geo.top - 200, to: geo.end - geo.H + 300, step: 90 },
    { name: 'fast-reverse', from: geo.end - geo.H + 300, to: geo.top - 200, step: -90 },
  ];
  for (const pt of patterns) {
    await page.evaluate((y) => window.scrollTo(0, y), pt.from);
    await page.waitForTimeout(300);
    const r = await page.evaluate(({ to, step }) => new Promise((res) => {
      window.__perf.frames = []; window.__perf.cb = []; window.__perf.on = true;
      let prev = -1, stuck = 0, n = 0;
      const go = () => {
        const y = scrollY;
        stuck = y === prev ? stuck + 1 : 0; prev = y; n++;
        if ((step > 0 && y >= to) || (step < 0 && y <= to) || stuck > 5 || n > 3000) {
          window.__perf.on = false;
          res({ frames: window.__perf.frames, cb: window.__perf.cb });
          return;
        }
        window.scrollBy(0, step);
        requestAnimationFrame(go);
      };
      requestAnimationFrame(go);
    }), { to: pt.to, step: pt.step });
    const long = r.frames.filter((f) => f > 20).length;
    out.results.push({
      device: c.name, pattern: pt.name,
      frameInterval: stats(r.frames),
      jsPerFrame: stats(r.cb),
      framesOver20ms: long, framesOver20msPct: +((100 * long) / Math.max(1, r.frames.length)).toFixed(1),
    });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
