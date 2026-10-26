// 홈 스크롤 장면 트레이스 측정: node scripts/perf-trace.mjs [base] [label]
// Chrome 트레이스에서 프레임 결과(PipelineReporter: 표시/누락)와 렌더러 메인·GPU 스레드 작업 시간을 집계합니다.
// 입력: 실제 휠 이벤트(마우스 휠 한 칸 100px, 40ms 간격 = 빠른 휠) / 트랙패드처럼 잘게(8px, 16ms 간격)
// 헤드리스 측정이라 실제 디스플레이의 vsync·GPU 와는 다를 수 있음 → 같은 조건의 전후 비교용
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'http://127.0.0.1:4322';
const label = process.argv[3] || 'run';

const configs = [
  { name: 'desktop-1440', vp: { width: 1440, height: 900 }, dsf: 2, mobile: false, cpu: 1 },
  { name: 'mobile-390-4xCPU', vp: { width: 390, height: 844 }, dsf: 2, mobile: true, cpu: 4 },
];
const inputs = [
  { name: 'wheel-notch', delta: 100, gap: 40 },
  { name: 'trackpad-fine', delta: 8, gap: 16 },
  { name: 'wheel-notch-reverse', delta: -100, gap: 40 },
];

const browser = await chromium.launch({ channel: 'chrome' });
const out = { label, results: [] };
for (const c of configs) {
  const ctx = await browser.newContext({ viewport: c.vp, deviceScaleFactor: c.dsf, isMobile: c.mobile, hasTouch: c.mobile });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: c.cpu });
  const geo = await page.evaluate(() => {
    const sec = document.querySelector('[data-ritual]');
    const top = sec.getBoundingClientRect().top + scrollY;
    return { top, len: sec.offsetHeight - innerHeight };
  });
  for (const inp of inputs) {
    const start = inp.delta > 0 ? geo.top : geo.top + geo.len;
    await page.evaluate((y) => window.scrollTo(0, y), start);
    await page.mouse.move(c.vp.width / 2, c.vp.height / 2);
    await page.waitForTimeout(400);
    // 장면 구간의 약 70%(진입 경계 포함)를 지나가도록
    const steps = Math.round((geo.len * 0.7) / Math.abs(inp.delta));
    await browser.startTracing(page, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline.frame', 'benchmark', 'cc', 'viz', 'gpu', 'toplevel'] });
    const t0 = Date.now();
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, inp.delta);
      await page.waitForTimeout(inp.gap);
    }
    await page.waitForTimeout(300);
    const dur = Date.now() - t0;
    const buf = await browser.stopTracing();
    const ev = JSON.parse(buf.toString()).traceEvents;
    const threads = {};
    for (const e of ev) if (e.name === 'thread_name') threads[`${e.pid}:${e.tid}`] = e.args.name;
    const busy = { main: 0, gpu: 0, compositor: 0, raster: 0 };
    const frames = { full: 0, partial: 0, dropped: 0 };
    for (const e of ev) {
      const tn = threads[`${e.pid}:${e.tid}`] || '';
      if (e.ph === 'X' && (e.name === 'ThreadControllerImpl::RunTask' || e.name === 'RunTask')) {
        if (tn === 'CrRendererMain') busy.main += e.dur / 1000;
        else if (tn === 'CrGpuMain' || tn === 'VizCompositorThread') busy.gpu += e.dur / 1000;
        else if (tn === 'Compositor') busy.compositor += e.dur / 1000;
        else if (/Raster|CompositorTileWorker/.test(tn)) busy.raster += e.dur / 1000;
      }
      // 화면 갱신 결과: 전체 반영 / 메인 스레드 갱신(캔버스 등) 누락된 부분 반영 / 누락
      if (e.name === 'PipelineReporter' && e.ph === 'b' && e.args?.frame_reporter) {
        const st = e.args.frame_reporter.state;
        if (st === 'STATE_PRESENTED_ALL') frames.full++;
        else if (st === 'STATE_PRESENTED_PARTIAL') frames.partial++;
        else if (st === 'STATE_DROPPED') frames.dropped++;
      }
    }
    const n = frames.full + frames.partial + frames.dropped;
    out.results.push({
      device: c.name, input: inp.name, seconds: +(dur / 1000).toFixed(2),
      frames, janky: n ? +((100 * (frames.partial + frames.dropped)) / n).toFixed(1) : null,
      fullFramesPerSec: +(frames.full / (dur / 1000)).toFixed(1),
      mainMsPerSec: +(busy.main / (dur / 1000)).toFixed(1),
      gpuMsPerSec: +(busy.gpu / (dur / 1000)).toFixed(1),
      rasterMsPerSec: +(busy.raster / (dur / 1000)).toFixed(1),
    });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
