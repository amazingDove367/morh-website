// 홈 장면 진행도별 스크린샷 + 모음: node scripts/shot-ritual.mjs <desktop|mobile> <out-prefix> [p1,p2,...]
import { chromium } from 'playwright-core';
const [, , dev = 'desktop', prefix = 'verification/ritual', list] = process.argv;
const ps = (list || '0,0.1,0.14,0.24,0.32,0.4,0.47,0.56,0.7,0.78,0.88,1').split(',').map(Number);
const base = process.env.BASE || 'http://127.0.0.1:4321';
const vp = dev === 'mobile' ? { width: 390, height: 844, dsf: 2, mobile: true } : { width: 1440, height: 900, dsf: 1, mobile: false };
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dsf, isMobile: vp.mobile, hasTouch: vp.mobile });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const files = [];
for (const p of ps) {
  await page.evaluate((p) => {
    const sec = document.querySelector('[data-ritual]');
    const top0 = document.querySelector('.morh-header').offsetHeight;
    const H = document.querySelector('[data-stage]').clientHeight;
    const y = sec.getBoundingClientRect().top + scrollY - top0 + p * (sec.offsetHeight - H);
    window.scrollTo(0, Math.round(y));
  }, p);
  await page.waitForTimeout(250);
  const f = `${prefix}-${String(p).replace('.', '_')}.png`;
  await page.screenshot({ path: f });
  files.push({ f, state: await page.evaluate(() => window.__ritual?.()) });
}
console.log(JSON.stringify({ errors, files: files.map((x) => x.f) }));
await browser.close();
