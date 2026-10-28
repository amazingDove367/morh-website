// 브라우저 검증: node scripts/verify.mjs [base]   (npm run build && npm run preview 실행 중, 시스템 Chrome 사용)
// 홈 장면 · 상세페이지 · 후기 · 주문 체험 · 다국어/RTL · 모바일 · 키보드 · 측정 이벤트 · 개인정보 전송 여부
import { chromium } from 'playwright-core';

const BASE = process.argv[2] || process.env.BASE || 'http://127.0.0.1:4321';
let pass = 0, fail = 0;
const ok = (name, cond, info = '') => {
  if (cond) pass++; else fail++;
  console.log(`${cond ? '✓' : '✗'} ${name}${!cond && info ? `  → ${typeof info === 'string' ? info : JSON.stringify(info)}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome' });
const DESKTOP = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

async function open(path, opts = DESKTOP) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [], requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { ctx, page, errors, requests };
}
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/* ───────── 홈 장면 ───────── */
async function scrollToP(page, p) {
  await page.evaluate((p) => {
    const sec = document.querySelector('[data-ritual]');
    const top0 = document.querySelector('.morh-header').offsetHeight;
    const H = document.querySelector('[data-stage]').clientHeight;
    scrollTo(0, Math.round(sec.getBoundingClientRect().top + scrollY - top0 + p * (sec.offsetHeight - H)));
  }, p);
  await page.waitForTimeout(450); // 보간이 목표에 도착할 때까지
  return page.evaluate(() => window.__ritual());
}

for (const [label, opts] of [['데스크톱', DESKTOP], ['모바일', MOBILE]]) {
  const { ctx, page, errors } = await open('/', opts);
  await page.waitForTimeout(800);
  let s = await scrollToP(page, 0);
  ok(`[홈 ${label}] 첫 화면: 닫힌 제품 + 14 DAYS, 모래시계 없음`, s.jar.closed > 0.99 && !s.glass.visible && (await page.isVisible('[data-days]')));
  s = await scrollToP(page, 0.16);
  ok(`[홈 ${label}] 회전·열림: 열린 용기 사진으로 전환, 대각선 기울기`, s.jar.open > 0.99 && s.jar.ang < -15, s.jar);
  s = await scrollToP(page, 0.3);
  ok(`[홈 ${label}] 크림 낙하: 줄기 x = 모래시계 중심 x (±2px)`, s.pour && Math.abs(s.pour.x - s.glass.x) <= 2, { pour: s.pour, glass: s.glass.x });
  ok(`[홈 ${label}] 크림 낙하: 용기 입구 → 모래시계 입구 → 크림 표면으로 연결`, s.pour && s.pour.top <= s.pour.seamY + 1 && s.pour.seamY < s.glass.mouthY && Math.abs(s.pour.bottom - s.pour.surfaceY) < 2, s.pour);
  ok(`[홈 ${label}] 크림 낙하: 위쪽 벌브가 채워지는 중`, s.upFrac > 0.1 && s.upFrac < 1 && s.loFrac === 0, s);
  s = await scrollToP(page, 0.52);
  ok(`[홈 ${label}] 확대: 제품이 화면 위로 퇴장, 모래시계 확대, 외부 크림 줄기 끝남`, s.jar.bottom < 0 && s.glass.g > 0.3 && !s.pour, { jar: s.jar.bottom, g: s.glass.g });
  const days = [];
  for (let p = 0.56; p <= 0.885; p += 0.0125) { const st = await scrollToP(page, p); days.push([st.day, st.upFrac, st.loFrac]); }
  ok(`[홈 ${label}] 14일: 날짜 01 → 14 순서대로 증가`, days[0][0] === 1 && days.at(-1)[0] === 14 && days.every((d, i) => i === 0 || d[0] >= days[i - 1][0]), days.map((d) => d[0]).join(','));
  ok(`[홈 ${label}] 14일: 위쪽 감소·아래쪽 증가, 합계 일정(같은 진행도)`, days.every((d, i) => Math.abs(d[1] + d[2] - 1) < 1e-6 && (i === 0 || d[2] >= days[i - 1][2])));
  const at7 = await scrollToP(page, 0.73);
  ok(`[홈 ${label}] 14일: DAY 07 에서 머무름(진하게 표시)`, at7.day === 7 && !(await page.getAttribute('[data-day]', 'class')).includes('is-passing'));
  s = await scrollToP(page, 0.99);
  const cta = page.locator('.ritual__cta');
  ok(`[홈 ${label}] 마지막: 위는 비고 아래에 모임 + 카피·버튼 표시`, s.upFrac === 0 && s.loFrac === 1 && (await cta.isVisible()) && (await page.textContent('.ritual__headline')).length > 0);
  const box = await cta.boundingBox();
  const glassRight = s.glass.right, glassLeft = s.glass.left;
  ok(`[홈 ${label}] 마지막: 모래시계와 카피가 겹치지 않음`, label === '모바일' ? box.y > s.glass.bottom + 4 - 30 /* 헤더 보정 */ : box.x > glassRight || box.x + box.width < glassLeft, { box, glassLeft, glassRight });
  // 역방향
  const fwd = await scrollToP(page, 0.3);
  await scrollToP(page, 0.8);
  const back = await scrollToP(page, 0.3);
  ok(`[홈 ${label}] 역방향 스크롤: 같은 위치에서 같은 상태`, JSON.stringify(fwd) === JSON.stringify(back));
  ok(`[홈 ${label}] 가로 넘침 없음`, (await overflowX(page)) <= 0);
  // 고정 해제 → 브랜드 소개·푸터
  await page.evaluate(() => document.querySelector('#about').scrollIntoView());
  await page.waitForTimeout(300);
  ok(`[홈 ${label}] 장면 뒤 브랜드 소개·푸터로 이어짐`, (await page.isVisible('#about-title')) && (await page.locator('.morh-footer').count()) === 1);
  ok(`[홈 ${label}] 콘솔 오류 없음`, errors.length === 0, errors);
  if (label === '데스크톱') {
    await scrollToP(page, 0.99);
    await Promise.all([page.waitForURL(/\/product\/$/), cta.click()]);
    ok('[홈] 마지막 버튼 → 제품 상세페이지', page.url().endsWith('/product/'));
  }
  await ctx.close();
}

// 움직임 줄이기 · 화면 크기 변경
{
  const ctx = await browser.newContext({ ...DESKTOP, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const st = await page.evaluate(() => ({
    cls: document.documentElement.className,
    canvas: getComputedStyle(document.querySelector('[data-canvas]')).display,
    glass: document.querySelector('.ritual__glass img').getBoundingClientRect().height,
    cta: !!document.querySelector('.ritual__cta[href$="/product/"]'),
    h: document.querySelector('[data-ritual]').offsetHeight,
  }));
  ok('[홈] 움직임 줄이기: 정적 장면(캔버스 없음, DAY 14 모래시계 사진, 카피·버튼, 고정 구간 없음)', st.cls.includes('reduce-motion') && st.canvas === 'none' && st.glass > 100 && st.cta && st.h < 3000, st);
  await ctx.close();
  const { ctx: c2, page: p2 } = await open('/', DESKTOP);
  for (const vp of [{ width: 1024, height: 700 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await p2.setViewportSize(vp);
    const s = await scrollToP(p2, 0.3);
    ok(`[홈] ${vp.width}×${vp.height}: 줄기와 모래시계 정렬 유지, 가로 넘침 없음`, s.pour && Math.abs(s.pour.x - s.glass.x) <= 2 && (await overflowX(p2)) <= 0, s.pour);
  }
  await c2.close();
}

/* ───────── 상세페이지 ───────── */
{
  const { ctx, page, errors, requests } = await open('/product/');
  const txt = (s) => page.textContent(s);
  ok('[상세] 기준가 42,000원 취소선 · 첫 구매 혜택가 35,000원 · 16%', (await txt('[data-base-price]')) === '42,000원' && (await page.evaluate(() => document.querySelector('[data-base-price]').tagName)) === 'S' && (await txt('[data-first-price]')) === '35,000원' && (await txt('.pp__pct')) === '16%');
  ok('[상세] 첫 구매 조건 안내가 가격 바로 아래', (await page.locator('.pp__price .pp__note').count()) === 1);
  ok('[상세] 배송비 안내(3,000원 · 도서산간 총 5,000원)', (await txt('.pp__ship')).includes('3,000원') && (await txt('.pp__ship')).includes('5,000원'));
  await page.click('[data-qty="1"]');
  ok('[상세] 수량 +1 → 총액 70,000원, 구매 링크 qty=2', (await txt('.pp__total [data-total]')) === '70,000원' && (await page.getAttribute('#cta-main', 'href')).endsWith('/checkout/?qty=2'));
  // 구매후기 요약 위치·수치
  const order = await page.evaluate(() => {
    const y = (s) => document.querySelector(s).getBoundingClientRect().top + scrollY;
    return { grid: y('.pdp__grid'), summary: y('[data-review-summary]'), tabs: y('[data-tabs]') };
  });
  ok('[상세] 순서: 갤러리·구매 정보 → 구매후기 요약 → 탭', order.grid < order.summary && order.summary < order.tabs, order);
  const nums = await page.evaluate(() => ({
    avg: document.querySelector('[data-rs-average]').textContent,
    count: Number(document.querySelector('[data-rs-count]').dataset.rsCount),
    tab: Number(document.querySelector('[data-tab-count]').textContent),
    items: document.querySelectorAll('[data-review-list] > li').length,
    notices: document.querySelectorAll('[data-sample-notice]').length,
    panel: document.querySelector('.pp__rating').textContent,
  }));
  ok('[상세] 평균 4.8 · 10건이 요약·탭·목록·패널에서 일치', nums.avg === '4.8' && nums.count === 10 && nums.tab === 10 && nums.items === 10 && nums.panel.includes('4.8') && nums.panel.includes('10'), nums);
  ok('[상세] 샘플 후기 안내 1회', nums.notices === 1);
  // 텍스처
  await page.click('#acc-texture-btn');
  await page.waitForTimeout(400);
  const tex = await page.evaluate(() => ({ texVisible: !document.querySelector('[data-pg-tex]').hidden, orbit: document.querySelector('[data-pg-orbit]').hidden, zoom: document.querySelector('[data-pg-zoom]').hidden, productHidden: [...document.querySelectorAll('[data-pg-img]')].every((i) => i.hidden) }));
  ok('[상세] THE TEXTURE: 크림 사진으로 전환, 360 대신 확대 슬라이더', tex.texVisible && tex.orbit && !tex.zoom && tex.productHidden, tex);
  await page.fill('[data-pg-range]', '3'); await page.dispatchEvent('[data-pg-range]', 'input');
  const stage = await page.locator('[data-pg-stage]').boundingBox();
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
  await page.mouse.down(); await page.mouse.move(stage.x + stage.width / 2 + 120, stage.y + stage.height / 2 + 60, { steps: 6 }); await page.mouse.up();
  const tr = await page.evaluate(() => document.querySelector('[data-pg-tex]').style.transform);
  ok('[상세] 텍스처 확대 3× + 드래그로 이동', /scale\(3\)/.test(tr) && /translate\(1\d\dpx, \d+px\)/.test(tr), tr);
  await page.click('#acc-texture-btn');
  const back = await page.evaluate(() => ({ tex: document.querySelector('[data-pg-tex]').hidden, orbit: document.querySelector('[data-pg-orbit]').hidden, zoom: document.querySelector('[data-pg-zoom]').hidden }));
  ok('[상세] THE TEXTURE 닫기: 제품 사진·360 복귀, 슬라이더 숨김', back.tex && !back.orbit && back.zoom, back);
  // 후기 탭 이동·페이지
  await page.click('.rs__all');
  await page.waitForTimeout(700);
  const rv = await page.evaluate(() => ({ sel: document.querySelector('#tab-reviews').getAttribute('aria-selected'), detailHidden: document.querySelector('#panel-detail').hidden, visible: [...document.querySelectorAll('[data-review-list] > li')].filter((l) => !l.hidden).length, top: document.querySelector('#reviews-list').getBoundingClientRect().top }));
  ok('[상세] 전체 후기 보기 → 구매후기 탭, 상세 설명 숨김, 5개 표시', rv.sel === 'true' && rv.detailHidden && rv.visible === 5, rv);
  await page.click('[data-page-go="2"]');
  await page.waitForTimeout(700);
  const p2 = await page.evaluate(() => ({ first: [...document.querySelectorAll('[data-review-list] > li')].find((l) => !l.hidden).id, cur: document.querySelector('[aria-current="page"][data-page-go]').dataset.pageGo, top: document.querySelector('#reviews-list').getBoundingClientRect().top, focus: document.activeElement.id }));
  ok('[상세] 2페이지 이동: 6~10번째 후기, 목록 시작점(고정 헤더·탭 바로 아래)으로 이동·포커스', p2.first === 'review-s06' && p2.cur === '2' && p2.top >= 100 && p2.top <= 260 && p2.focus === 'reviews-list', p2);
  // 사진 확대 모달
  const thumb = page.locator('[data-review-list] > li:not([hidden]) [data-review-open="s09"]').first();
  await thumb.click();
  await page.waitForTimeout(200);
  const lb1 = await page.evaluate(() => ({ open: document.querySelector('[data-lightbox]').open, count: document.querySelector('[data-lb-count]').textContent, alt: document.querySelector('[data-lb-img]').alt }));
  await page.keyboard.press('ArrowRight');
  const lb2 = await page.evaluate(() => document.querySelector('[data-lb-count]').textContent);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  const lb3 = await page.evaluate(() => ({ open: document.querySelector('[data-lightbox]').open, focus: document.activeElement?.dataset?.reviewOpen }));
  ok('[상세] 후기 사진 확대: 여러 장 →, Esc 로 닫기, 포커스 복원', lb1.open && lb1.count === '1 / 2' && lb2 === '2 / 2' && !lb3.open && !!lb3.focus && lb1.alt.includes('고객 사진이 아닌'), { lb1, lb2, lb3 });
  // 탭 키보드
  await page.focus('#tab-reviews'); await page.keyboard.press('ArrowLeft');
  ok('[상세] 탭 키보드(←/→) 이동', (await page.getAttribute('#tab-detail', 'aria-selected')) === 'true' && (await page.evaluate(() => document.activeElement.id)) === 'tab-detail');
  // 정보 아코디언 해시
  await page.goto(BASE + '/product/#info-shipping', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  ok('[상세] #info-shipping 링크 → 배송비 안내 펼침', await page.evaluate(() => document.querySelector('#info-shipping').open));
  ok('[상세] 제품 정보 6항목 + 미확정 항목 표시', (await page.locator('.pi__item').count()) === 6 && (await page.locator('.pi__table .pending').count()) >= 5);
  const ld = await page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
  ok('[상세] 구조화 데이터에 가격·평점·후기 없음', !ld.offers && !ld.aggregateRating && !ld.review, Object.keys(ld));
  ok('[상세] 외부 요청 없음(분석 도구 미설정)', requests.every((u) => u.startsWith(BASE)), requests.filter((u) => !u.startsWith(BASE)));
  ok('[상세] 콘솔 오류 없음', errors.length === 0, errors);
  await ctx.close();
}
// 모바일 상세
{
  const { ctx, page } = await open('/product/', MOBILE);
  const m = await page.evaluate(() => { const ul = document.querySelector('.rs__photos'); return { sw: ul.scrollWidth, cw: ul.clientWidth }; });
  ok('[상세 모바일] 포토 후기 가로 스와이프(목록만 가로 스크롤)', m.sw > m.cw && (await overflowX(page)) <= 0, m);
  await page.evaluate(() => document.querySelector('.rs__photos').scrollBy(200, 0));
  await page.locator('.rs__thumb').first().scrollIntoViewIfNeeded();
  await page.locator('.rs__thumb').first().tap();
  await page.waitForTimeout(300);
  const lb = await page.evaluate(() => { const d = document.querySelector('[data-lightbox]').getBoundingClientRect(); const c = document.querySelector('[data-lb-close]').getBoundingClientRect(); const i = document.querySelector('[data-lb-img]').getBoundingClientRect(); return { d: [d.top, d.bottom, d.left, d.right], c: [c.top, c.right], i: [i.top, i.bottom], vh: innerHeight, vw: innerWidth }; });
  ok('[상세 모바일] 확대 사진·닫기 버튼이 화면 안', lb.d[0] >= 0 && lb.d[1] <= lb.vh && lb.d[2] >= 0 && lb.d[3] <= lb.vw && lb.c[0] >= 0 && lb.c[1] <= lb.vw && lb.i[1] <= lb.vh, lb);
  await page.click('[data-lb-close]');
  await page.evaluate(() => document.querySelector('[data-tabs]').scrollIntoView());
  await page.waitForTimeout(400);
  ok('[상세 모바일] 하단 구매 바(본문 버튼이 지나간 뒤 표시)', await page.evaluate(() => document.querySelector('[data-buybar]').classList.contains('is-visible')));
  await ctx.close();
}
// 후기 없음
{
  const { ctx, page } = await open('/qa/reviews-empty/');
  const e = await page.evaluate(() => ({ empty: document.querySelector('[data-rs-empty]')?.textContent, photos: document.querySelectorAll('.rs__photos').length, insight: document.querySelectorAll('.rs__insight').length, rating: document.querySelectorAll('.pp__rating').length, tab: document.querySelector('[data-tab-count]').textContent, notice: document.querySelectorAll('[data-sample-notice]').length }));
  ok('[후기 없음] 빈 상태 문구만 표시, 사진·요약·평점·샘플 안내 숨김, 탭 0', e.empty === '아직 등록된 구매후기가 없습니다' && !e.photos && !e.insight && !e.rating && e.tab === '0' && !e.notice, e);
  await ctx.close();
}

/* ───────── 주문 체험 ───────── */
{
  const { ctx, page, errors, requests } = await open('/product/');
  await page.click('[data-qty="1"]');
  await Promise.all([page.waitForURL(/checkout/), page.click('#cta-main')]);
  await page.waitForLoadState('networkidle');
  const sum = () => page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-sum]')].map((e) => [e.dataset.sum, e.textContent])));
  let s = await sum();
  ok('[주문] 수량 2 전달 · 84,000 − 14,000 + 3,000 = 73,000원', s.subtotal === '84,000원' && s.benefit === '−14,000원' && s.shipping === '3,000원' && s.total === '73,000원', s);
  ok('[주문] 주소창에서 수량 값 정리', !page.url().includes('?'));
  const before = await page.evaluate(() => {
    const txt = document.body.innerText;
    return { txt, pay: document.getElementById('cta-pay').textContent.trim(), title: document.querySelector('h1').textContent };
  });
  ok('[주문] 결제 전 화면에 포트폴리오·체험 문구 없음, 버튼은 결제하기', !/포트폴리오|체험/.test(before.txt) && before.pay === '결제하기' && before.title === '주문/결제', before.title + ' / ' + before.pay);
  await page.check('[data-region][value="remote"]');
  s = await sum();
  ok('[주문] 도서산간: 배송비 총 5,000원(추가 아님) → 75,000원', s.shipping === '5,000원' && s.total === '75,000원', s);
  const ev1 = await page.evaluate(() => window.__events.map((e) => e[0]));
  await Promise.all([page.waitForURL(/complete/), page.click('#cta-pay')]);
  await page.waitForLoadState('networkidle');
  const done = await page.evaluate(() => {
    const lead = document.getElementById('launch-alert').getBoundingClientRect();
    return { title: document.querySelector('h1').textContent, text: document.querySelector('.done__hero').innerText, img: document.querySelector('.done__figure img').naturalWidth,
      sum: document.querySelector('[data-summary-list]').textContent, store: sessionStorage.getItem('morh:demo-order'), events: window.__events, leadTop: lead.top, leadBottom: lead.bottom, vh: innerHeight };
  });
  ok('[주문] 결제하기 → 바로 완료 화면: 감사 인사 + 포트폴리오 공개 + 사진 + 주문 내역(75,000원)', done.title.includes('결제하기까지') && done.text.includes('포트폴리오') && done.text.includes('반짝이는') && done.img > 0 && done.sum.includes('75,000원'), done.title);
  ok('[주문] 출시 알림 받기가 첫 화면 아래쪽에 살짝 보임(스크롤하면 전체)', done.leadTop < done.vh - 40 && done.leadBottom > done.vh, { top: done.leadTop, bottom: done.leadBottom, vh: done.vh });
  await page.click('#cta-lead');
  ok('[알림] 빈 칸 신청 불가 + 오류', (await page.isVisible('#lead-name-err')) && (await page.isVisible('#lead-email-err')));
  await page.fill('#lead-name', '홍길동'); await page.fill('#lead-email', 'hong@');
  await page.click('#cta-lead');
  ok('[알림] 이메일 형식 오류', (await page.textContent('#lead-email-err')).length > 0 && (await page.isHidden('[data-lead-done]')));
  await page.fill('#lead-email', 'hong@example.com');
  await page.click('#cta-lead');
  const lead = await page.evaluate(() => ({ done: !document.querySelector('[data-lead-done]').hidden, formHidden: document.getElementById('lead-form').hidden && document.getElementById('lead-form').offsetHeight === 0, n: document.getElementById('lead-name').value, m: document.getElementById('lead-email').value, events: window.__events, store: JSON.stringify({ ...sessionStorage }) + JSON.stringify({ ...localStorage }) + document.cookie }));
  const doneTxt = await page.textContent('[data-lead-done]');
  ok('[알림] 신청 전에는 저장 안내 없음 → 신청 후 저장되지 않았다는 안내·감사 인사·홈 버튼, 입력값 즉시 삭제', lead.done && lead.formHidden && lead.n === '' && lead.m === '' && doneTxt.includes('저장되지 않고') && doneTxt.includes('감사') && (await page.isVisible('[data-lead-done] a[href$="/"]')) && !(await page.locator('.lead__note').count()), doneTxt.slice(0, 60));
  const all = JSON.stringify({ url: page.url(), store: done.store, lstore: lead.store, events: lead.events, ev1, requests });
  ok('[주문·알림] 입력한 이름·이메일이 URL·저장소·이벤트·요청 어디에도 없음', !/홍길동|hong@/.test(all), all.slice(0, 300));
  ok('[측정] 주문서 시작(begin_checkout) → 알림 신청(generate_lead: launch_alert), purchase 없음', ev1.includes('begin_checkout') && lead.events.some((e) => e[0] === 'generate_lead' && e[1].lead_type === 'launch_alert') && !/"purchase"/.test(all));
  ok('[주문] 콘솔 오류 없음', errors.length === 0, errors);
  await ctx.close();
}
// 모바일 주문
{
  const { ctx, page } = await open('/checkout/?qty=1', MOBILE);
  ok('[주문 모바일] 가로 넘침 없음', (await overflowX(page)) <= 0);
  await ctx.close();
}

// 결제 전 화면(홈·상세·개인정보)에 포트폴리오·체험 문구 없음
for (const path of ['/', '/product/', '/privacy/', '/checkout/']) {
  const { ctx, page } = await open(path);
  const txt = await page.evaluate(() => document.body.innerText);
  ok(`[문구] ${path} 에 포트폴리오·체험·데모 문구 없음`, !/포트폴리오|체험|데모/.test(txt), (txt.match(/.{0,20}(포트폴리오|체험|데모).{0,20}/) || [''])[0]);
  await ctx.close();
}

/* ───────── 측정 이벤트 전체 ───────── */
{
  // 페이지를 넘어가는 클릭도 확인하도록, 테스트에서는 gtag 대신 탭 저장소(sessionStorage)에 기록
  const ctx = await browser.newContext(DESKTOP);
  await ctx.addInitScript(() => {
    window.gtag = (cmd, name, params) => {
      if (cmd !== 'event') return;
      const l = JSON.parse(sessionStorage.getItem('__ga') || '[]'); l.push([name, params]); sessionStorage.setItem('__ga', JSON.stringify(l));
    };
  });
  const page = await ctx.newPage();
  const go = async (path) => { await page.goto(BASE + path, { waitUntil: 'networkidle' }); await page.waitForTimeout(300); };
  // 홈: 장면 진행 · 헤더 · 언어 메뉴
  await go('/');
  await page.evaluate(() => { const sec = document.querySelector('[data-ritual]'); scrollTo(0, sec.getBoundingClientRect().top + scrollY + sec.offsetHeight); });
  await page.waitForTimeout(800);
  await page.click('[data-lang] summary');
  await page.evaluate(() => document.querySelector('[data-ga="cta_click"][data-ga-cta-location="about_product"]').click());
  await page.waitForLoadState('networkidle');
  // 상세
  await go('/product/');
  await page.click('.pg__nav--next');
  await page.click('#acc-product-btn');
  await page.click('#acc-texture-btn');
  await page.click('[data-pg-zoom-step="0.5"]');
  await page.evaluate(() => document.querySelector('[data-pg-stage]').scrollIntoView({ block: 'center' }));
  const st = await page.locator('[data-pg-stage]').boundingBox();
  await page.mouse.move(st.x + st.width / 2, st.y + st.height / 2); await page.mouse.down(); await page.mouse.move(st.x + st.width / 2 + 80, st.y + st.height / 2 + 40, { steps: 5 }); await page.mouse.up();
  await page.click('#acc-texture-btn');
  await page.click('[data-qty="1"]');
  await page.locator('.rs__thumb').first().click(); await page.click('[data-lb-close]');
  await page.locator('.rs__thumb').nth(1).click(); await page.click('[data-lb-step="1"]'); await page.keyboard.press('Escape');
  await page.click('.rs__all'); await page.waitForTimeout(500);
  await page.click('[data-page-go="2"]'); await page.waitForTimeout(400);
  await page.click('#tab-detail');
  await page.locator('#info-shipping summary').click();
  await Promise.all([page.waitForURL(/checkout/), page.click('#cta-main')]);
  await page.waitForLoadState('networkidle');
  // 주문/결제
  await page.click('[data-co-qty="1"]');
  await page.check('[data-region][value="remote"]');
  await Promise.all([page.waitForURL(/complete/), page.click('#cta-pay')]);
  await page.waitForLoadState('networkidle');
  // 공개 화면 · 알림 신청
  await page.click('.done__more');
  await page.click('#cta-lead');
  await page.fill('#lead-name', '김테스트'); await page.fill('#lead-email', 'tester@example.com');
  await page.locator('#lead-email').blur();
  await page.click('#cta-lead');
  await page.click('[data-lead-done] a');
  await page.waitForLoadState('networkidle');
  // 푸터 · 언어 변경
  await page.click('.morh-footer a[data-ga-menu-name="privacy"]'); await page.waitForLoadState('networkidle');
  await page.click('[data-lang] summary');
  await Promise.all([page.waitForURL(/\/en\//), page.click('[data-lang] a[hreflang="en"]')]);
  await page.waitForLoadState('networkidle');
  const log = await page.evaluate(() => JSON.parse(sessionStorage.getItem('__ga') || '[]'));
  const src = (await import('node:fs')).readFileSync(new URL('../src/scripts/analytics.ts', import.meta.url), 'utf8');
  const defined = [...src.slice(src.indexOf('export const EVENTS'), src.indexOf('} as const')).matchAll(/^  (\w+): \{ tier/gm)].map((m) => m[1]);
  const seen = new Set(log.map((e) => e[0]));
  const missing = defined.filter((n) => !seen.has(n));
  ok(`[측정] 정의한 이벤트 ${defined.length}개가 모두 실제 행동으로 발생`, missing.length === 0, missing);
  const pay = log.find((e) => e[0] === 'add_payment_info')?.[1];
  ok('[측정] 결제하기(add_payment_info): 상세 +1·주문서 +1 → 3개, KRW 105,000·items·배송 지역', pay && pay.currency === 'KRW' && pay.value === 105000 && pay.items?.[0]?.quantity === 3 && pay.shipping_tier === 'remote', pay);
  ok('[측정] 모든 이벤트에 page_locale·page_type', log.every((e) => e[1].page_locale && e[1].page_type), log.filter((e) => !e[1].page_type).map((e) => e[0]));
  ok('[측정] 입력한 이름·이메일이 어떤 이벤트에도 없음(칸 이름만)', !/김테스트|tester@/.test(JSON.stringify(log)) && log.some((e) => e[0] === 'form_field_complete' && e[1].field_name === 'email'));
  ok('[측정] 핵심 퍼널 순서: view_item → add_to_cart → begin_checkout → add_payment_info → form_start → generate_lead', (() => {
    const order = ['view_item', 'add_to_cart', 'begin_checkout', 'add_payment_info', 'form_start', 'generate_lead'].map((n) => log.findIndex((e) => e[0] === n));
    return order.every((v, i) => v >= 0 && (i === 0 || v > order[i - 1]));
  })());
  await ctx.close();
}

/* ───────── 다국어 ───────── */
const LOCS = [['', 'ko', 'ltr'], ['/en', 'en', 'ltr'], ['/ja', 'ja', 'ltr'], ['/zh-cn', 'zh-Hans', 'ltr'], ['/ar', 'ar', 'rtl']];
for (const [pre, lang, dir] of LOCS) {
  for (const path of ['/', '/product/', '/checkout/', '/checkout/complete/', '/privacy/']) {
    const { ctx, page, errors } = await open(`${pre}${path}`, path === '/' ? MOBILE : DESKTOP);
    const h = await page.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir, title: document.title, robots: document.querySelector('meta[name=robots]')?.content }));
    const of = await overflowX(page);
    ok(`[${lang}] ${path} lang·dir·제목·noindex·가로 넘침·오류`, h.lang === lang && h.dir === dir && h.title.length > 0 && h.robots?.includes('noindex') && of <= 0 && errors.length === 0, { h, of, errors });
    await ctx.close();
  }
}
{
  const { ctx, page } = await open('/ja/product/');
  await page.click('[data-lang] summary');
  const links = await page.evaluate(() => [...document.querySelectorAll('[data-lang] a')].map((a) => a.getAttribute('href')));
  await Promise.all([page.waitForURL(/\/ar\/product\/$/), page.click('[data-lang] a[hreflang="ar"]')]);
  ok('[언어 선택] 같은 화면의 다른 언어로 이동(/ja/product/ → /ar/product/)', links.join(',') === '/product/,/en/product/,/ja/product/,/zh-cn/product/,/ar/product/' && page.url().endsWith('/ar/product/'), links);
  const rtl = await page.evaluate(() => {
    const panel = document.querySelector('.pp').getBoundingClientRect(), gal = document.querySelector('.pg').getBoundingClientRect();
    const img = getComputedStyle(document.querySelector('[data-pg-img]')).transform;
    const prevBtn = document.querySelector('.pg__nav--prev').getBoundingClientRect();
    return { panelLeftOfGallery: panel.right <= gal.left + 1, imgTransform: img, prevOnRight: prevBtn.left > gal.left + gal.width / 2, price: document.querySelector('[data-first-price]').textContent, logo: getComputedStyle(document.querySelector('.morh-header__logo')).direction };
  });
  ok('[ar] RTL 배치: 정보 패널 왼쪽·갤러리 오른쪽, 이전 버튼 오른쪽, 사진·로고 반전 없음, 서양식 숫자 가격', rtl.panelLeftOfGallery && rtl.prevOnRight && rtl.imgTransform === 'none' && rtl.logo === 'ltr' && /35,000/.test(rtl.price), rtl);
  await page.goto(BASE + '/ar/checkout/complete/', { waitUntil: 'networkidle' });
  const inp = await page.evaluate(() => getComputedStyle(document.querySelector('#lead-name')).direction);
  ok('[ar] 입력란 오른쪽→왼쪽', inp === 'rtl');
  await ctx.close();
}

/* ───────── 검색 설정 ───────── */
{
  const { ctx, page } = await open('/robots.txt');
  ok('[검색] 미리보기 robots.txt 전체 차단', (await page.textContent('body')).includes('Disallow: /'));
  await ctx.close();
}

await browser.close();
console.log(`\n결과: ${pass} 통과 / ${fail} 실패`);
process.exit(fail ? 1 : 0);
