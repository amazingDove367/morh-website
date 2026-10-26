// 1단계 프로토타입 자동 검증. 실행: npm run build && npx astro preview 후 npm run verify
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://127.0.0.1:4321';
const PAGES = ['/', '/prototype/hero-a/', '/prototype/hero-b/', '/prototype/transition-a/', '/prototype/transition-b/',
  '/prototype/product-a/', '/prototype/product-b/', '/prototype/story/', '/prototype/system/', '/prototype/compare/', '/result/', '/privacy/'];
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const browser = await chromium.launch({ channel: 'chrome' });
const ctxFor = (dev, extra = {}) => browser.newContext(dev === 'mobile'
  ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, ...extra }
  : { viewport: { width: 1440, height: 900 }, ...extra });

// ── 1. 페이지별: 콘솔 오류, 가로 넘침, CLS, 전송량 ──
for (const dev of ['desktop', 'mobile']) {
  const ctx = await ctxFor(dev);
  for (const path of PAGES) {
    const page = await ctx.newPage();
    const errors = [];
    let bytes = 0, imgBytes = 0;
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('response', async (r) => {
      try { const b = (await r.body()).length; bytes += b; if (r.request().resourceType() === 'image') imgBytes += b; } catch {}
    });
    await page.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(h, 6000); y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(40); }
    await page.waitForTimeout(300);
    const m = await page.evaluate(() => {
      const se = document.scrollingElement;
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const r = el.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(el).position !== 'fixed' && !el.closest('.cmp__viewport, .tz__sticky, .gal__stage, .sc__stage, .hero-a, .hero-b, .ly');
      }).slice(0, 3).map((el) => el.className || el.tagName);
      return { overflowX: se.scrollWidth - innerWidth, cls: window.__cls, wide };
    });
    const label = `[${dev}] ${path}`;
    ok(`${label} 콘솔 오류 없음`, errors.length === 0, errors.join(' | '));
    ok(`${label} 가로 넘침 없음`, m.overflowX <= 0 && m.wide.length === 0, `scrollWidth-vw=${m.overflowX} ${m.wide.join(',')}`);
    ok(`${label} 레이아웃 이동(CLS) < 0.1`, m.cls < 0.1, `CLS=${m.cls.toFixed(4)}`);
    console.log(`      전송량 ${(bytes / 1024).toFixed(0)}KB (이미지 ${(imgBytes / 1024).toFixed(0)}KB, 스크롤 후 지연 로드 포함)`);
    await page.close();
  }
  await ctx.close();
}

// ── 2. 갤러리 A: 선택·이전/다음·키보드·확대 ──
{
  const ctx = await ctxFor('desktop');
  const p = await ctx.newPage();
  await p.goto(BASE + '/prototype/product-a/', { waitUntil: 'networkidle' });
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.gal__img')].findIndex((i) => !i.hidden));
  await p.click('[data-thumb="3"]');
  ok('갤러리: 썸네일(뒷면) 선택', (await vis()) === 3 && (await p.textContent('[data-caption]')) === '뒷면');
  await p.click('.gal__nav--next');
  ok('갤러리: 다음 버튼', (await vis()) === 4);
  await p.click('.gal__nav--next');
  ok('갤러리: 마지막→처음 순환', (await vis()) === 0);
  await p.focus('[data-thumb="0"]'); await p.keyboard.press('ArrowRight');
  ok('갤러리: 방향키로 사진 전환 + 포커스 이동', (await vis()) === 1 && (await p.evaluate(() => document.activeElement?.getAttribute('data-thumb'))) === '1');
  await p.click('[data-zoom]');
  const z = await p.evaluate(() => ({ pressed: document.querySelector('[data-zoom]').getAttribute('aria-pressed'), t: document.querySelector('.gal__img:not([hidden])').style.transform }));
  ok('갤러리: 확대 버튼(aria-pressed, scale 2.2)', z.pressed === 'true' && z.t.includes('2.2'), JSON.stringify(z));
  await p.waitForTimeout(500);
  const natural = await p.evaluate(() => document.querySelector('.gal__img:not([hidden])').currentSrc);
  ok('갤러리: 확대 시 1254px 원본 사용', natural.includes('1254'), natural);
  await p.keyboard.press('ArrowRight');
  const origin = await p.evaluate(() => document.querySelector('.gal__img:not([hidden])').style.transformOrigin);
  ok('갤러리: 확대 중 방향키로 위치 이동', origin.startsWith('58'), origin);
  await p.keyboard.press('Escape');
  ok('갤러리: Esc로 확대 해제', (await p.getAttribute('[data-zoom]', 'aria-pressed')) === 'false');
  // 클릭으로 확대 → 드래그 이동
  const box = await p.locator('[data-stage]').boundingBox();
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  ok('갤러리: 사진 클릭으로 확대', (await p.getAttribute('[data-zoom]', 'aria-pressed')) === 'true');
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  ok('갤러리: 다시 클릭하면 해제', (await p.getAttribute('[data-zoom]', 'aria-pressed')) === 'false');
  await ctx.close();
  // 터치: 탭으로 확대
  const mctx = await ctxFor('mobile');
  const m = await mctx.newPage();
  await m.goto(BASE + '/prototype/product-a/', { waitUntil: 'networkidle' });
  const mb = await m.locator('[data-stage]').boundingBox();
  await m.touchscreen.tap(mb.x + mb.width / 2, mb.y + mb.height / 2);
  ok('갤러리(터치): 탭으로 확대 (호버 불필요)', (await m.getAttribute('[data-zoom]', 'aria-pressed')) === 'true');
  await m.click('[data-zoom]');
  await m.click('[data-thumb="4"]');
  ok('갤러리(터치): 썸네일 탭으로 항공샷', (await m.textContent('[data-caption]')) === '항공샷');
  await mctx.close();
}

// ── 3. 탭: 클릭·키보드·hidden·#reviews ──
{
  const ctx = await ctxFor('desktop');
  const p = await ctx.newPage();
  await p.goto(BASE + '/prototype/product-a/', { waitUntil: 'networkidle' });
  const st = () => p.evaluate(() => ({
    sel: document.querySelector('[role=tab][aria-selected=true]').id,
    d: document.getElementById('panel-detail').hidden, r: document.getElementById('panel-reviews').hidden,
    dh: document.getElementById('panel-detail').getBoundingClientRect().height,
  }));
  await p.click('#tab-reviews');
  let s = await st();
  ok('탭: 구매후기 선택 시 상세 설명 숨김(빈 공간 0)', s.sel === 'tab-reviews' && s.d && !s.r && s.dh === 0, JSON.stringify(s));
  await p.keyboard.press('ArrowLeft');
  s = await st();
  ok('탭: ← 키로 상세 설명', s.sel === 'tab-detail' && !s.d && s.r);
  await p.keyboard.press('End');
  ok('탭: End 키', (await st()).sel === 'tab-reviews');
  await p.keyboard.press('Home');
  ok('탭: Home 키 + 로빙 tabindex', (await st()).sel === 'tab-detail' && (await p.getAttribute('#tab-reviews', 'tabindex')) === '-1');
  const after = await p.evaluate(() => !!document.querySelector('#faq') && document.querySelector('#faq').getBoundingClientRect().height > 0);
  ok('탭: 탭 뒤 공통 콘텐츠(FAQ) 항상 표시', after);
  await p.goto(BASE + '/prototype/product-b/#reviews', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  ok('탭: #reviews 로 진입 시 구매후기 선택', (await st()).sel === 'tab-reviews');
  await ctx.close();
}

// ── 4. 구매 흐름 ──
{
  const ctx = await ctxFor('desktop');
  const p = await ctx.newPage();
  await p.goto(BASE + '/prototype/product-a/', { waitUntil: 'networkidle' });
  await p.click('[data-qty="1"]'); await p.click('[data-qty="1"]');
  ok('수량 +2 → 총액 114,000원', (await p.textContent('.buy__total [data-total]')) === '114,000원');
  await p.click('#cta-main');
  ok('구매하기 → 구매 신청 시트 열림', await p.evaluate(() => document.getElementById('purchase-sheet').open));
  ok('시트에 수량·총액 반영', (await p.textContent('#purchase-sheet [data-total]')) === '114,000원');
  await p.click('#cta-submit');
  ok('빈 입력 제출 → 개인정보 팝업 안 열림(검증)', !(await p.evaluate(() => document.getElementById('privacy-modal').open)));
  ok('입력칸에 name 속성 없음(값 전송 불가)', await p.evaluate(() => [...document.querySelectorAll('#lead-form input')].every((i) => !i.name)));
  await p.fill('#f-name', '홍길동'); await p.fill('#f-contact', '010-1234-5678');
  await p.click('#cta-submit');
  ok('제출 → 개인정보 처리 안내 팝업', await p.evaluate(() => document.getElementById('privacy-modal').open));
  ok('동의 전 완료 버튼 비활성', await p.isDisabled('#privacy-ok'));
  ok('완료 버튼 문구 "동의하고 완료하기"', (await p.textContent('#privacy-ok')) === '동의하고 완료하기');
  await p.check('#privacy-agree');
  const reqs = [];
  p.on('request', (r) => reqs.push(r.url()));
  await Promise.all([p.waitForURL('**/result/'), p.click('#privacy-ok')]);
  const u = new URL(p.url());
  ok('동의 → /result/ 이동, 주소에 입력값 없음', u.pathname === '/result/' && u.search === '', p.url());
  ok('외부로 보낸 요청 없음', reqs.every((r) => r.startsWith(BASE)), reqs.filter((r) => !r.startsWith(BASE)).join(','));
  ok('완료 페이지 noindex', (await p.getAttribute('meta[name=robots]', 'content'))?.includes('noindex'));
  await p.goBack(); await p.waitForLoadState('networkidle');
  // location.replace 이므로 뒤로가기 시 상세가 아닌 이전 기록. 입력값 잔존 여부 확인
  await p.goto(BASE + '/prototype/product-a/'); await p.click('#cta-main');
  ok('재진입 시 입력값 비어 있음', (await p.inputValue('#f-name')) === '' && (await p.inputValue('#f-contact')) === '');
  await p.keyboard.press('Escape');
  await p.click('.buy__demo [data-privacy-open]');
  ok('개인정보 안내(정보 모드) 열기', await p.evaluate(() => document.getElementById('privacy-modal').open) && (await p.textContent('#privacy-ok')) === '확인했습니다');
  await p.keyboard.press('Escape');
  ok('Esc로 닫기 + 버튼으로 포커스 복귀', await p.evaluate(() => !document.getElementById('privacy-modal').open && document.activeElement?.hasAttribute('data-privacy-open')));
  await ctx.close();
}

// ── 5. 모바일 하단 구매 바 ──
for (const path of ['/prototype/product-a/', '/prototype/product-b/']) {
  const ctx = await ctxFor('mobile');
  const p = await ctx.newPage();
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const bar = document.querySelector('[data-buybar]');
    const pb = parseFloat(getComputedStyle(document.body).paddingBottom);
    return { visible: bar.classList.contains('is-visible'), barH: bar.getBoundingClientRect().height, pb, inert: bar.hasAttribute('inert') };
  });
  ok(`[mobile] ${path} 하단 바 높이만큼 본문 하단 여백 확보`, r.pb >= r.barH, JSON.stringify(r));
  await p.locator('#cta-main').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
  const v = await p.evaluate(() => ({ vis: document.querySelector('[data-buybar]').classList.contains('is-visible'), inert: document.querySelector('[data-buybar]').hasAttribute('inert') }));
  ok(`[mobile] ${path} 본문 구매 버튼 보이면 하단 바 숨김+inert`, !v.vis && v.inert, JSON.stringify(v));
  await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(500);
  const last = await p.evaluate(() => {
    const ft = document.querySelector('.site-footer__note').getBoundingClientRect();
    const bar = document.querySelector('[data-buybar]').getBoundingClientRect();
    return { noteBottom: ft.bottom, barTop: bar.top, vis: document.querySelector('[data-buybar]').classList.contains('is-visible') };
  });
  ok(`[mobile] ${path} 맨 아래에서도 마지막 콘텐츠가 바에 가리지 않음`, !last.vis || last.noteBottom <= last.barTop + 1, JSON.stringify(last));
  await p.click('#cta-mobile').catch(() => {});
  await ctx.close();
}

// ── 6. 움직임 줄이기 ──
{
  const ctx = await ctxFor('desktop', { reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(BASE + '/prototype/story/', { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => ({
    cls: document.documentElement.className,
    tzH: document.querySelector('.tz').getBoundingClientRect().height,
    sticky: getComputedStyle(document.querySelector('.tz__sticky')).position,
    anim: getComputedStyle(document.querySelector('.hero-a__tex img')).animationName,
    endOpacity: getComputedStyle(document.querySelector('.tz__end')).opacity,
  }));
  ok('모션 줄이기: reduce-motion 클래스', r.cls.includes('reduce-motion'));
  ok('모션 줄이기: 텍스처 확대 고정 구간 해제', r.sticky !== 'sticky' && r.tzH < 1800, JSON.stringify(r));
  ok('모션 줄이기: 전환 끝 문장 처음부터 보임', r.endOpacity === '1');
  await p.goto(BASE + '/prototype/product-b/', { waitUntil: 'networkidle' });
  const b = await p.evaluate(() => ({ stage: getComputedStyle(document.querySelector('.sc__stage')).display, imgs: [...document.querySelectorAll('.sc__static')].filter((i) => getComputedStyle(i).display !== 'none').length }));
  ok('모션 줄이기: 쇼케이스 B → 사진 5장 순서 나열', b.stage === 'none' && b.imgs === 5, JSON.stringify(b));
  await p.goto(BASE + '/prototype/hero-b/', { waitUntil: 'networkidle' });
  ok('모션 줄이기: 떠 있는 용기 정지', await p.evaluate(() => { const a = getComputedStyle(document.querySelector('.hero-b__float')); return a.animationName === 'none' || parseFloat(a.animationDuration) < 0.001; }));
  await p.goto(BASE + '/prototype/hero-a/?motion=off', { waitUntil: 'networkidle' });
  ok('?motion=off 미리보기도 동일 적용', await p.evaluate(() => document.documentElement.classList.contains('reduce-motion')));
  await ctx.close();
}

// ── 7. 키보드 포커스 표시 ──
{
  const ctx = await ctxFor('desktop');
  const p = await ctx.newPage();
  await p.goto(BASE + '/prototype/product-a/', { waitUntil: 'networkidle' });
  const missing = [];
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(() => {
      const el = document.activeElement; if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { tag: el.tagName + '.' + (el.className || el.id), ok: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2, visible: el.getBoundingClientRect().height > 0 };
    });
    if (f && (!f.ok || !f.visible)) missing.push(f.tag);
  }
  ok('Tab 40회: 모든 포커스에 2px 이상 외곽선 표시', missing.length === 0, missing.slice(0, 5).join(', '));
  await p.goto(BASE + '/prototype/hero-a/'); await p.keyboard.press('Tab');
  ok('첫 Tab = 본문 바로가기 링크', (await p.evaluate(() => document.activeElement?.className)) === 'skip-link');
  await ctx.close();
}

// ── 8. 초기 HTML(스크립트 실행 전)에 핵심 정보 존재 ──
{
  const html = await (await fetch(BASE + '/prototype/product-a/')).text();
  const need = ['<h1', '모르 브라이트닝 크림', '38,000원', '컨실러로 한 겹 더 가리지 않아도', '자주 묻는 질문', '구매후기', '아침·저녁 스킨케어 마지막 단계', 'application/ld+json', '개인정보 처리 안내'];
  const miss = need.filter((s) => !html.includes(s));
  ok('상세: 초기 HTML에 제품명·가격·요약·FAQ·후기·구조화데이터', miss.length === 0, miss.join(','));
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  ok('구조화 데이터: Product, 예시 값(가격·평점·후기) 미포함', ld['@type'] === 'Product' && !ld.offers && !ld.aggregateRating && !ld.review, Object.keys(ld).join(','));
  const home = await (await fetch(BASE + '/prototype/hero-a/')).text();
  ok('홈 히어로: 초기 HTML에 h1 문구·CTA 링크', home.includes('가리지 않아도') && home.includes('href="/prototype/product-a/"'));
  const imgsAlt = [...html.matchAll(/<img [^>]*>/g)].map((m) => m[0]).filter((t) => !/alt=/.test(t));
  ok('모든 img 에 alt 속성', imgsAlt.length === 0, imgsAlt.slice(0, 2).join(' '));
  const refs = await fetch(BASE + '/references/02-home.png');
  ok('디자인 레퍼런스 이미지가 배포 결과에 없음', refs.status === 404, String(refs.status));
}

await browser.close();
const fail = results.filter((r) => !r.pass);
console.log(`\n총 ${results.length}개 중 통과 ${results.length - fail.length}, 실패 ${fail.length}`);
process.exit(fail.length ? 1 : 0);
