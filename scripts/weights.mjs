// 첫 로드 전송량(유형별)과 로컬 LCP 측정: node scripts/weights.mjs
import { chromium } from 'playwright-core';
const b = await chromium.launch({ channel: 'chrome' });
for (const path of ['/prototype/hero-a/', '/prototype/hero-b/', '/prototype/product-a/', '/prototype/product-b/']) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const by = {};
  p.on('response', async (r) => { try { const t = r.request().resourceType(); by[t] = (by[t] || 0) + (await r.body()).length; } catch {} });
  await p.goto('http://127.0.0.1:4321' + path, { waitUntil: 'networkidle' });
  const lcp = await p.evaluate(() => new Promise((res) => new PerformanceObserver((l) => { const e = l.getEntries().at(-1); res({ ms: Math.round(e.startTime), el: e.element?.tagName }); }).observe({ type: 'largest-contentful-paint', buffered: true })));
  console.log(path, JSON.stringify(Object.fromEntries(Object.entries(by).map(([k, v]) => [k, Math.round(v / 1024) + 'KB']))), 'LCP(local)', JSON.stringify(lcp));
}
await b.close();
