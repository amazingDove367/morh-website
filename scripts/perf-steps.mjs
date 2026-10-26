// 휠 한 칸(100px)마다 장면 진행도(p)가 프레임 사이에 얼마나 크게 건너뛰는지 측정: node scripts/perf-steps.mjs [base]
// window.__ritual().p 를 매 프레임 기록 → 프레임당 Δp 분포(작고 고를수록 부드럽게 보임)와 입력 정지 후 따라오는 시간
import { chromium } from 'playwright-core';
const base = process.argv[2] || 'http://127.0.0.1:4322';
const browser = await chromium.launch({ channel: 'chrome' });
const res = [];
for (const c of [{ name: 'desktop', vp: { width: 1440, height: 900 }, dsf: 2 }, { name: 'mobile', vp: { width: 390, height: 844 }, dsf: 2 }]) {
  const page = await browser.newPage({ viewport: c.vp, deviceScaleFactor: c.dsf });
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const top = await page.evaluate(() => document.querySelector('[data-ritual]').getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top + 300);
  await page.mouse.move(c.vp.width / 2, c.vp.height / 2);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    window.__ps = [];
    const rec = (t) => { const s = window.__ritual?.(); if (s) window.__ps.push([t, s.p]); if (window.__ps.length < 4000) requestAnimationFrame(rec); };
    requestAnimationFrame(rec);
  });
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(120); }
  const stopAt = await page.evaluate(() => performance.now());
  await page.waitForTimeout(800);
  const ps = await page.evaluate(() => window.__ps);
  const d = []; for (let i = 1; i < ps.length; i++) d.push(Math.abs(ps[i][1] - ps[i - 1][1]));
  const moving = d.filter((x) => x > 1e-6).sort((a, b) => a - b);
  const finalP = ps[ps.length - 1][1];
  const settle = ps.find(([t, p]) => t >= stopAt && Math.abs(p - finalP) < 1e-4);
  res.push({
    device: c.name,
    framesMoving: moving.length,
    maxDeltaP: +(moving[moving.length - 1] ?? 0).toFixed(4),
    p95DeltaP: +(moving[Math.floor(moving.length * 0.95)] ?? 0).toFixed(4),
    settleMsAfterInput: settle ? Math.round(settle[0] - stopAt) : null,
  });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(res, null, 1));
