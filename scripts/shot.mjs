// 스크린샷 도구: node scripts/shot.mjs <path> <desktop|mobile> [scrollY|selector] [out] [--reduce]
import { chromium } from 'playwright-core';

const [, , path = '/', dev = 'desktop', scroll = '0', out = 'verification/shot.png', ...rest] = process.argv;
const reduce = rest.includes('--reduce');
const full = rest.includes('--full');
const base = process.env.BASE || 'http://127.0.0.1:4321';
const vp = dev === 'mobile' ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900, deviceScaleFactor: 1 };

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: reduce ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(base + path, { waitUntil: 'networkidle' });
if (/^\d+$/.test(scroll)) {
  // 실제 사용자처럼 여러 번 나눠 스크롤
  const target = Number(scroll);
  for (let y = 0; y <= target; y += 300) { await page.mouse.wheel(0, Math.min(300, target - y) || 0); await page.waitForTimeout(30); }
  await page.evaluate((t) => window.scrollTo(0, t), target);
} else {
  await page.locator(scroll).first().scrollIntoViewIfNeeded();
}
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: full });
console.log(JSON.stringify({ out, errors, scrollY: await page.evaluate(() => scrollY), docH: await page.evaluate(() => document.documentElement.scrollHeight) }));
await browser.close();
