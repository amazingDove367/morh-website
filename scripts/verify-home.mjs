// 홈 리추얼 장면 검증: node scripts/verify-home.mjs (프리뷰 서버 실행 중)
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const res = [];
const ok = (n, pass, d = '') => { res.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`); };
const browser = await chromium.launch({ channel: 'chrome' });
const desk = { viewport: { width: 1440, height: 900 } };
const mob = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

async function open(opts, path = '/') {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
}
const range = (page) => page.evaluate(() => { const r = document.querySelector('[data-ritual]'); return r.offsetHeight - document.querySelector('[data-stage]').clientHeight; });
async function goP(page, p) { const R = await range(page); await page.evaluate((y) => scrollTo(0, y), Math.round(p * R)); await page.waitForTimeout(120); }

// 무대 기준 측정값
const snap = (page) => page.evaluate(() => {
  const st = document.querySelector('[data-stage]').getBoundingClientRect();
  const rel = (s) => { const r = document.querySelector(s).getBoundingClientRect(); return { l: r.left - st.left, r: r.right - st.left, t: r.top - st.top, b: r.bottom - st.top, w: r.width, h: r.height, cx: r.left - st.left + r.width / 2 }; };
  const g = rel('[data-glass]');
  const k = g.h / 340;
  const rb = document.querySelector('[data-rb-body]');
  const d = rb.getAttribute('d') || '';
  let ribbon = null;
  if (d) { const bb = rb.getBBox(); ribbon = { t: bb.y, b: bb.y + bb.height, cx: bb.x + bb.width / 2 }; }
  const bodyEl = document.querySelector('[data-body]');
  const m = new DOMMatrix(getComputedStyle(bodyEl).transform);
  const deg = Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI);
  const pathH = (s) => { const el = document.querySelector(s); return el.getAttribute('d') ? el.getBBox().height : 0; };
  return {
    W: st.width, H: st.height, lid: rel('[data-lid]'), body: rel('[data-body]'), glass: g, deg, ribbon,
    ring: g.t + 15 * k, neck: g.t + 171 * k,
    day: document.querySelector('[data-day]').textContent, counterOp: +getComputedStyle(document.querySelector('[data-counter]')).opacity,
    up: pathH('[data-up-body]'), lo: pathH('[data-lo-body]'), daysOp: +getComputedStyle(document.querySelector('[data-days]')).opacity,
    finOp: +getComputedStyle(document.querySelector('[data-final]')).opacity, overflowX: document.scrollingElement.scrollWidth - innerWidth,
  };
});

for (const [label, opts] of [['desktop', desk], ['mobile', mob]]) {
  const { ctx, page, errors } = await open(opts);
  let s = await snap(page);
  ok(`[${label}] HOLD: 닫힌 제품(뚜껑이 몸체 위에 맞붙음)·14 DAYS 표시`, Math.abs(s.lid.b - s.body.t) < 6 && s.deg === 0 && s.daysOp === 1, `lid.b=${s.lid.b.toFixed(1)} body.t=${s.body.t.toFixed(1)}`);
  ok(`[${label}] HOLD: 제품이 화면 가운데에 크게`, Math.abs(s.body.cx - s.W / 2) < 4 && s.body.w > s.W * (label === 'mobile' ? 0.5 : 0.2));

  await goP(page, 0.12); s = await snap(page);
  ok(`[${label}] OPEN: 뚜껑이 분리되고 몸체가 기울기 시작`, s.lid.b < s.body.t - 2 || s.deg !== 0, `deg=${s.deg}`);
  await goP(page, 0.22); s = await snap(page);
  ok(`[${label}] OPEN: 입구가 아래 모래시계를 향하도록 기울어짐(약 -100°)`, s.deg <= -95 && s.deg >= -110 && s.glass.t < s.H, `deg=${s.deg}, glass.t=${s.glass.t.toFixed(0)}`);

  for (const p of [0.3, 0.36]) {
    await goP(page, p); s = await snap(page);
    const r = s.ribbon;
    const cond = r && r.t <= s.body.b && r.b >= s.ring && r.b <= s.neck + 2 && Math.abs(r.cx - s.glass.cx) < s.glass.w * 0.18;
    ok(`[${label}] POUR p=${p}: 크림 리본이 용기 입구에서 모래시계 입구 안까지 연결`, !!cond, r ? `ribbon ${r.t.toFixed(0)}→${r.b.toFixed(0)}, body.b=${s.body.b.toFixed(0)}, ring=${s.ring.toFixed(0)}, neck=${s.neck.toFixed(0)}` : 'no ribbon');
    ok(`[${label}] POUR p=${p}: 제품·뚜껑이 화면 안 (가로)`, s.lid.l > -2 && s.body.r < s.W + 2 && s.body.l > -2);
  }
  await goP(page, 0.4); s = await snap(page);
  ok(`[${label}] POUR 끝: 위쪽 벌브가 크림으로 채워짐`, s.up > s.glass.h * 0.12, `up=${s.up.toFixed(0)}`);

  await goP(page, 0.56); s = await snap(page);
  ok(`[${label}] ZOOM 끝: 제품·뚜껑이 화면 위로 사라짐`, s.body.b < 0 && s.lid.b < 0, `body.b=${s.body.b.toFixed(0)} lid.b=${s.lid.b.toFixed(0)}`);
  ok(`[${label}] ZOOM 끝: 크림 흐름 마무리(리본 없음)`, s.ribbon === null);
  ok(`[${label}] ZOOM 끝: 모래시계만 중앙에 크게`, Math.abs(s.glass.cx - s.W / 2) < 4 && s.glass.h > s.H * 0.6, `h=${(s.glass.h / s.H).toFixed(2)}H`);

  // DAYS: 날짜와 크림 잔량이 같은 진행도로 함께 변함
  const seq = [];
  for (let p = 0.56; p <= 0.885; p += 0.01) { await goP(page, p); const t = await snap(page); seq.push([+t.day, t.up, t.lo, t.counterOp]); }
  const mono = seq.every((x, i) => i === 0 || (x[0] >= seq[i - 1][0] && x[1] <= seq[i - 1][1] + 0.5 && x[2] >= seq[i - 1][2] - 0.5));
  ok(`[${label}] DAYS: 날짜↑ · 위쪽 크림↓ · 아래쪽 크림↑ 가 함께 단조 변화`, mono, seq.map((x) => x[0]).join(','));
  const days = [...new Set(seq.map((x) => x[0]))];
  ok(`[${label}] DAYS: DAY 01·07·14 표시 + 중간 날짜는 짧게 지나감`, days.includes(1) && days.includes(7) && days.includes(14) && seq.filter((x) => x[0] === 7).length >= 3 && seq.filter((x) => x[0] === 4).length <= 2, `7일 머문 샘플 ${seq.filter((x) => x[0] === 7).length}, 4일 ${seq.filter((x) => x[0] === 4).length}`);
  const last = seq[seq.length - 1];
  ok(`[${label}] DAY 14: 위쪽 크림이 모두 내려옴`, last[0] === 14 && last[1] === 0 && last[2] > 0, `up=${last[1]} lo=${last[2].toFixed(0)}`);
  // 스크롤을 멈추면 시간도 멈춤
  await goP(page, 0.7); const a1 = await snap(page); await page.waitForTimeout(800); const a2 = await snap(page);
  ok(`[${label}] 스크롤을 멈추면 날짜·크림도 멈춤`, a1.day === a2.day && a1.up === a2.up && a1.lo === a2.lo);

  await goP(page, 1); s = await snap(page);
  const fin = await page.evaluate(() => {
    const a = document.querySelector('.ritual__cta'); const r = a.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const fr = document.querySelector('[data-final]').getBoundingClientRect(); const g = document.querySelector('[data-glass]').getBoundingClientRect();
    const overlap = !(fr.right < g.left || fr.left > g.right || fr.bottom < g.top || fr.top > g.bottom);
    return { href: a.getAttribute('href'), hit: !!hit?.closest('.ritual__cta'), h2: document.querySelector('.ritual__headline').textContent, sub: document.querySelector('.ritual__copy').textContent, overlap, inView: r.bottom <= innerHeight && r.top >= 0 };
  });
  ok(`[${label}] FINAL: 헤드라인·보조문구·버튼 표시`, s.finOp === 1 && fin.h2 === '매일의 루틴이 쌓이는 14일' && fin.sub === 'MORH와 함께하는 나만의 시간' && fin.inView, JSON.stringify(fin));
  ok(`[${label}] FINAL: 버튼이 클릭 가능하고 상세페이지로 연결`, fin.hit && fin.href === '/prototype/product-a/');
  ok(`[${label}] FINAL: 카피와 모래시계가 겹치지 않음`, !fin.overlap);
  await Promise.all([page.waitForURL('**/prototype/product-a/'), page.click('.ritual__cta')]);
  ok(`[${label}] 버튼 클릭 → 상세페이지 이동`, page.url().endsWith('/prototype/product-a/'));

  // 가로 넘침 (전 구간)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  let maxO = 0; for (let p = 0; p <= 1.001; p += 0.05) { await goP(page, p); maxO = Math.max(maxO, (await snap(page)).overflowX); }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(200);
  maxO = Math.max(maxO, await page.evaluate(() => document.scrollingElement.scrollWidth - innerWidth));
  ok(`[${label}] 전 구간 가로 스크롤 없음`, maxO <= 0, `max=${maxO}`);
  // 헤더 클릭 가능
  await goP(page, 0.45);
  const nav = await page.evaluate(() => [...document.querySelectorAll('.home-header__nav a')].every((a) => { const r = a.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a') === a; }));
  ok(`[${label}] 장면 진행 중에도 내비게이션 클릭 가능`, nav);
  // 고정 해제 후 다음 콘텐츠·Footer
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(200);
  const tail = await page.evaluate(() => ({ about: document.querySelector('#about').getBoundingClientRect().top < innerHeight * 2, footer: document.querySelector('.site-footer').getBoundingClientRect().top < innerHeight }));
  ok(`[${label}] 고정 해제 후 About·Footer 로 이어짐`, tail.about && tail.footer);
  ok(`[${label}] 콘솔 오류 없음`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 역방향 스크롤: 앞으로 갔다가 되돌아오면 같은 상태
{
  const { ctx, page } = await open(desk);
  const state = () => page.evaluate(() => JSON.stringify({
    t: ['[data-lid]', '[data-body]', '[data-glass]', '[data-days]', '[data-counter]', '[data-final]'].map((s) => [document.querySelector(s).style.transform, document.querySelector(s).style.opacity]),
    d: ['[data-rb-body]', '[data-up-body]', '[data-lo-body]', '[data-stream]'].map((s) => document.querySelector(s).getAttribute('d') ?? document.querySelector(s).getAttribute('height')),
    day: document.querySelector('[data-day]').textContent,
  }));
  await goP(page, 0.3); const fwd = await state();
  await goP(page, 0.8); await goP(page, 0.6); await goP(page, 0.45);
  await goP(page, 0.3); const back = await state();
  ok('역방향 스크롤: 0.3 → 0.8 → 0.3 복귀 시 모든 객체 위치·크림·날짜가 동일', fwd === back);
  // 화면 크기 변경 후에도 리본 연결 유지
  for (const vp of [{ width: 1024, height: 700 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(vp); await page.waitForTimeout(250); await goP(page, 0.33);
    const s = await snap(page); const r = s.ribbon;
    const cond = r && r.t <= s.body.b && r.b >= s.ring && r.b <= s.neck + 2 && Math.abs(r.cx - s.glass.cx) < s.glass.w * 0.18;
    ok(`화면 크기 ${vp.width}×${vp.height} 로 변경: 크림 출발·도착점 일치`, !!cond, r ? `ribbon ${r.t.toFixed(0)}→${r.b.toFixed(0)} ring=${s.ring.toFixed(0)} neck=${s.neck.toFixed(0)}` : 'none');
    ok(`화면 크기 ${vp.width}×${vp.height}: 가로 스크롤 없음`, s.overflowX <= 0);
  }
  await ctx.close();
}

// 움직임 줄이기 / JS 꺼짐 → 정적 장면
for (const [label, opts] of [['움직임 줄이기', { ...mob, reducedMotion: 'reduce' }], ['JS 꺼짐', { ...desk, javaScriptEnabled: false }]]) {
  const { ctx, page } = await open(opts);
  const r = await page.evaluate(() => {
    const vis = (s) => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.9; };
    return { sec: document.querySelector('[data-ritual]').offsetHeight / innerHeight, pin: getComputedStyle(document.querySelector('.ritual__pin')).position,
      h1: vis('.ritual__days'), jar: vis('[data-body]'), glass: vis('[data-glass]'), h2: vis('.ritual__headline'), cta: vis('.ritual__cta'), href: document.querySelector('.ritual__cta').getAttribute('href') };
  });
  ok(`${label}: 고정 구간 없이 정적 장면(제품·모래시계·카피·버튼)`, r.pin !== 'sticky' && r.sec < 3.2 && r.h1 && r.jar && r.glass && r.h2 && r.cta && r.href === '/prototype/product-a/', JSON.stringify(r));
  await page.screenshot({ path: `verification/home-static-${label === 'JS 꺼짐' ? 'nojs' : 'reduce'}.png`, fullPage: true });
  await ctx.close();
}

// 초기 HTML(스크립트 전)에 핵심 문구와 링크
{
  const html = await (await fetch(BASE + '/')).text();
  const need = ['14 DAYS', 'YOUR DAILY RITUAL', '매일의 루틴이 쌓이는 14일', 'MORH와 함께하는 나만의 시간', '제품 자세히 보기', 'href="/prototype/product-a/"', '<h1', '<meta name="description"', 'og:title'];
  const miss = need.filter((x) => !html.includes(x));
  ok('초기 HTML에 핵심 카피·제품 링크·메타데이터', miss.length === 0, miss.join(','));
  ok('스토리보드 표기(HOLD/OPEN/POUR/ZOOM)·레퍼런스 이미지 미노출', !/>\s*(HOLD|OPEN|POUR|ZOOM)\s*</.test(html) && !html.includes('홈페이지리뉴얼'));
}

// 성능: 스크롤 중 프레임 간격
{
  const { ctx, page } = await open(desk);
  const gaps = await page.evaluate(async () => {
    const R = document.querySelector('[data-ritual]').offsetHeight; const out = []; let last = performance.now();
    for (let y = 0; y < R; y += 40) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); out.push(n - last); last = n; }
    return out;
  });
  const slow = gaps.filter((g) => g > 50).length;
  ok('스크롤 중 50ms 넘는 프레임 없음(데스크톱 Chrome)', slow === 0, `프레임 ${gaps.length}개, 평균 ${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1)}ms, 최대 ${Math.max(...gaps).toFixed(1)}ms`);
  const cls = await page.evaluate(() => new Promise((r) => { let v = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) v += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => r(v), 300); }));
  ok('홈 로드 레이아웃 이동(CLS) < 0.1', cls < 0.1, `CLS=${cls.toFixed(4)}`);
  await ctx.close();
}

await browser.close();
const fail = res.filter((x) => !x).length;
console.log(`\n홈 검증 ${res.length}개 중 통과 ${res.length - fail}, 실패 ${fail}`);
process.exit(fail ? 1 : 0);
