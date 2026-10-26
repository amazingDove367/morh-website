// 홈 장면 진행도별 스크린샷: node scripts/shot-scene.mjs <path> <desktop|mobile> <out-prefix> [p1,p2,...]
import { chromium } from 'playwright-core';
const [, , path = '/', dev = 'desktop', prefix = 'verification/scene', list] = process.argv;
const ps = (list || '0,0.16,0.3,0.52,0.6,0.73,0.88,1').split(',').map(Number);
const base = process.env.BASE || 'http://127.0.0.1:4321';
const vp = dev === 'mobile' ? { width: 390, height: 844, dsf: 2, mobile: true } : { width: 1440, height: 900, dsf: 1, mobile: false };
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dsf, isMobile: vp.mobile, hasTouch: vp.mobile });
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
for (const p of ps) {
  await page.evaluate((p) => {
    const sec = document.querySelector('[data-ritual]');
    const top0 = document.querySelector('.morh-header').offsetHeight;
    const H = document.querySelector('[data-stage]').clientHeight;
    scrollTo(0, Math.round(sec.getBoundingClientRect().top + scrollY - top0 + p * (sec.offsetHeight - H)));
  }, p);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${prefix}-${String(p).replace('.', '_')}.png` });
}
await browser.close();
