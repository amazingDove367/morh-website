/*
  홈 리추얼 장면 — 스크롤 진행도 p(0..1) 하나로 모든 객체를 계산합니다.
  - 휠·터치를 가로채지 않고 현재 스크롤 위치만 읽음 → 멈추면 정지, 역방향 스크롤 시 그대로 이전 상태
  - 닫힌 제품: 실제 정면 사진(뚜껑/몸체 분리, HTML 이미지)
  - 열린 용기 · 뚜껑 · 크림 줄기 · 모래시계: 사용자 제공 실사 누끼컷에서 분리한 레이어(scripts/build-ritual.py)를
    한 캔버스에 같은 좌표계로 그림 → 용기 입구에서 나온 줄기가 항상 모래시계 입구와 크림 표면에서 만남
  - 모래시계 크림은 사진 속 크림을 그대로 위·아래로 옮기고 유리 내부 모양으로 잘라 냄. 이동량은 면적 표로 계산

  타임라인
    0.00–0.04  HOLD   닫힌 제품 + 14 DAYS
    0.04–0.20  OPEN   뚜껑이 들리며 회전, 몸체가 대각선으로 기울며 열린 용기 사진으로 전환, 모래시계 등장
    0.20–0.40  POUR   크림 줄기가 모래시계 입구로 떨어져 위쪽 벌브를 채움
    0.38–0.55  ZOOM   모래시계 확대·중앙, 제품과 뚜껑은 위로 퇴장, 줄기 꼬리가 떨어지며 흐름 마무리
    0.56–0.88  DAYS   DAY 01 → 14, 위쪽 크림이 목을 지나 아래에 쌓임 (같은 진행도)
    0.88–1.00  FINAL  모래시계 축소·이동, 카피와 버튼
*/
import geom from '../data/ritual-geometry.json';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const rad = (d: number) => (d * Math.PI) / 180;

const HG = geom.hourglass;
const JAR = geom.jar;
const HG_CX = HG.cx;
const HG_CY = (HG.content[1] + HG.content[3]) / 2;
const HG_H = HG.content[3] - HG.content[1];
const HG_W = HG.content[2] - HG.content[0];
const [BCX, BCY] = JAR.bodyCenter;
const LID_R = 332 / 1016, BODY_R = 508 / 1016, OVER = 4 / 1016;

/** DAY: 01·07·14 에서 잠시 머물고 중간 숫자는 빠르게 → 크림 이동량도 같은 값 사용 */
function dayAt(t: number) {
  if (t < 0.1) return 1;
  if (t < 0.42) return lerp(1, 7, ease(seg(t, 0.1, 0.42)));
  if (t < 0.56) return 7;
  if (t < 0.88) return lerp(7, 14, ease(seg(t, 0.56, 0.88)));
  return 14;
}

/** 남길 크림 비율(0..1) → 크림 레이어를 아래로 내릴 거리(px, 원본 좌표). 면적 표를 선형 보간으로 역산 */
function shiftFor(table: { step: number; area: number[] }, frac: number) {
  const a = table.area, target = clamp(frac) * a[0];
  if (target >= a[0]) return 0;
  for (let i = 1; i < a.length; i++) {
    if (a[i] <= target) {
      const t = (a[i - 1] - target) / Math.max(1, a[i - 1] - a[i]);
      return (i - 1 + t) * table.step;
    }
  }
  return (a.length - 1) * table.step;
}

function loadImg(src: string) {
  const im = new Image();
  im.decoding = 'async';
  im.src = src;
  // 처음 그릴 때 디코딩으로 프레임이 밀리지 않도록 미리 디코딩
  im.decode?.().catch(() => {});
  return im;
}

export function initRitual() {
  const root = document.querySelector<HTMLElement>('[data-ritual]');
  if (!root || !document.documentElement.classList.contains('js-motion')) return;
  const sec: HTMLElement = root;

  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const stage = q<HTMLElement>('[data-stage]');
  const canvas = q<HTMLCanvasElement>('[data-canvas]');
  const ctx = canvas.getContext('2d')!;
  const days = q<HTMLElement>('[data-days]');
  const sub = q<HTMLElement>('[data-sub]');
  const lid = q<HTMLElement>('[data-lid]');
  const body = q<HTMLElement>('[data-body]');
  const counter = q<HTMLElement>('[data-counter]');
  const dayEl = q<HTMLElement>('[data-day]');
  const fin = q<HTMLElement>('[data-final]');

  const base = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/images/ritual/`;
  const img = {
    lid: loadImg(base + 'jar-lid.webp'),
    body: loadImg(base + 'jar-body.webp'),
    stream: loadImg(base + 'jar-stream.webp'),
    drop: loadImg(base + 'jar-drop.webp'),
    empty: loadImg(base + 'hg-empty.webp'),
    upper: loadImg(base + 'hg-upper.webp'),
    lower: loadImg(base + 'hg-lower.webp'),
    neck: loadImg(base + 'hg-neck.webp'),
    ring: loadImg(base + 'hg-ring.webp'),
  };
  type Key = keyof typeof img;
  const ready = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;

  /*
    표시 크기에 맞춘 축소본: 매 프레임 큰 원본(최대 1024×1536)을 축소해 그리면 저사양에서 캔버스 갱신이 밀림.
    화면 크기가 정해질 때 필요한 최대 배율로 한 번만 축소해 두고(ImageBitmap) 그 결과를 그림.
  */
  const HG_KEYS: Key[] = ['empty', 'upper', 'lower', 'neck', 'ring'];
  const bmp: Partial<Record<Key, { src: CanvasImageSource; f: number }>> = {};
  const want: Partial<Record<Key, number>> = {};
  const S = (k: Key) => bmp[k] ?? { src: img[k], f: 1 };
  function prescale(k: Key) {
    const im = img[k], f = want[k] ?? 1;
    if (!ready(im) || !('createImageBitmap' in window)) return;
    if (f > 0.85) { delete bmp[k]; return; }
    const w = Math.max(1, Math.round(im.naturalWidth * f)), h = Math.max(1, Math.round(im.naturalHeight * f));
    createImageBitmap(im, { resizeWidth: w, resizeHeight: h, resizeQuality: 'high' })
      .then((b) => { if (want[k] === f) { bmp[k] = { src: b, f: b.width / im.naturalWidth }; request(true); } })
      .catch(() => {});
  }
  (Object.keys(img) as Key[]).forEach((k) => img[k].addEventListener('load', () => { prescale(k); request(true); }));

  // 클립 경로·바닥 그림자는 한 번만 만들어 재사용
  const toPath = (pts: number[]) => {
    const path = new Path2D();
    path.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) path.lineTo(pts[i], pts[i + 1]);
    path.closePath();
    return path;
  };
  const clipUp = toPath(HG.clipUpper), clipLo = toPath(HG.clipLower);
  const shadow = document.createElement('canvas');
  shadow.width = 256; shadow.height = 32;
  {
    const sc = shadow.getContext('2d')!;
    const gr = sc.createRadialGradient(128, 16, 2, 128, 16, 128);
    gr.addColorStop(0, 'rgba(105,72,40,0.20)'); gr.addColorStop(1, 'rgba(105,72,40,0)');
    sc.setTransform(1, 0, 0, 0.125, 0, 14); sc.fillStyle = gr; sc.fillRect(0, 0, 256, 256);
  }

  // 같은 값이면 DOM 스타일을 다시 쓰지 않음
  const last = new WeakMap<HTMLElement, Record<string, string>>();
  const css = (el: HTMLElement, prop: 'transform' | 'opacity', v: string) => {
    const m = last.get(el) ?? {};
    if (m[prop] === v) return;
    m[prop] = v; last.set(el, m);
    el.style[prop] = v;
  };

  // 화면 크기에 따라 정해지는 값 (resize 때만 계산)
  let W = 0, H = 0, dpr = 1, mobile = false, J = 0, lidH = 0, bodyH = 0;
  let L = {} as Record<string, number>;

  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    mobile = W < 720;
    // 휴대폰은 캔버스 해상도를 1.5배까지만(채우는 픽셀 수 약 44% 감소) — 사진 레이어라 차이가 거의 보이지 않음
    dpr = Math.min(mobile ? 1.5 : 2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
    J = mobile ? Math.min(W * 0.66, H * 0.32) : Math.min(W * 0.3, H * 0.44);
    lidH = J * LID_R; bodyH = J * BODY_R;
    lid.style.width = body.style.width = `${J}px`;
    days.style.fontSize = `${mobile ? Math.min(W * 0.25, H * 0.13) : Math.min(W * 0.16, H * 0.27)}px`;
    counter.style.fontSize = `${mobile ? Math.min(W * 0.17, H * 0.085) : Math.min(W * 0.08, H * 0.16)}px`;

    const jarH = lidH + bodyH - J * OVER;
    const y1 = mobile ? H * 0.56 : H * 0.6; // 닫힌 용기 중심
    const by1 = y1 + jarH / 2 - bodyH / 2;

    // 붓는 단계: 뚜껑 위끝(사진 y=71)부터 줄기 시작점(y=846)까지가 화면 위쪽 절반 안에 들어오도록 크기 결정
    const kHold = J / JAR.bodyWidth;
    const kP = Math.min(kHold * (mobile ? 0.86 : 0.92), (H * (mobile ? 0.4 : 0.5)) / (JAR.seam - 71));
    const sxP = mobile ? W * 0.47 : W * 0.5;           // 줄기 x = 모래시계 중심 x
    const lidTop = H * 0.05;
    const seamY = lidTop + (JAR.seam - 71) * kP;
    const bxP = sxP - (JAR.streamX - BCX) * kP;
    const byP = seamY - (JAR.seam - BCY) * kP;
    const gP = kP * 0.78;                                // 링 지름 ≈ 몸체 폭의 0.9배
    const ringY = seamY + H * (mobile ? 0.07 : 0.08);   // 링 윗면 화면 y
    const hyP = ringY + (HG_CY - 100) * gP;              // 모래시계 중심 y (링 윗면 = 사진 y 100)
    const gZ = Math.min((H * (mobile ? 0.76 : 0.9)) / HG_H, (W * 0.9) / HG_W);
    const gF = Math.min((H * (mobile ? 0.46 : 0.8)) / HG_H, (W * (mobile ? 0.7 : 0.4)) / HG_W);

    L = {
      by1, bx1: W / 2, ly1: by1 - bodyH / 2 - lidH / 2 + J * OVER,
      kHold, kP, sxP, bxP, byP, seamY, gP, hyP,
      gZ, zX: W / 2, zY: mobile ? H * 0.56 : H * 0.51,
      gF, fX: mobile ? W / 2 : W * 0.3, fY: mobile ? H * 0.29 : H * 0.5,
      daysY: H * 0.2, subY: H * 0.32,
    };
    L.subW = sub.offsetWidth; L.subH = sub.offsetHeight;
    L.daysW = days.offsetWidth; L.daysH = days.offsetHeight;
    L.cW = counter.offsetWidth; L.cH = counter.offsetHeight;

    const gMax = Math.max(L.gP, L.gZ, L.gF) * dpr * 1.05;
    const kMax = Math.max(L.kHold, L.kP * 1.12) * dpr * 1.05;
    (Object.keys(img) as Key[]).forEach((k) => {
      const f = Math.min(1, HG_KEYS.includes(k) ? gMax : kMax);
      if (want[k] !== f) { want[k] = f; prescale(k); }
    });
  }

  const place = (el: HTMLElement, cx: number, cy: number, w: number, h: number, deg = 0, s = 1) => {
    css(el, 'transform', `translate3d(${(cx - w / 2).toFixed(2)}px, ${(cy - h / 2).toFixed(2)}px, 0) rotate(${deg.toFixed(3)}deg) scale(${s.toFixed(4)})`);
  };

  /* ── 캔버스 그리기 도우미 ── */
  const lay = (n: keyof typeof HG.layers) => HG.layers[n];
  const jl = (n: keyof typeof JAR.layers) => JAR.layers[n];
  /** 모래시계 좌표계: 사진 픽셀 → 화면 */
  function hgSpace(hx: number, hy: number, g: number) {
    ctx.setTransform(dpr * g, 0, 0, dpr * g, dpr * (hx - HG_CX * g), dpr * (hy - HG_CY * g));
  }
  const hgToStage = (hx: number, hy: number, g: number, x: number, y: number) => ({ x: hx + (x - HG_CX) * g, y: hy + (y - HG_CY) * g });

  let state: Record<string, unknown> = {};
  let dayShown = -1;

  function frame(p: number) {
    // 단계별 진행값
    const lift = easeOut(seg(p, 0.04, 0.11));
    const tilt = ease(seg(p, 0.06, 0.19));
    const move = ease(seg(p, 0.06, 0.2));
    const swap = smooth(seg(p, 0.1, 0.14));     // 닫힌 사진 → 열린 사진
    const enter = easeOut(seg(p, 0.1, 0.22));
    const zoom = ease(seg(p, 0.38, 0.55));
    const exit = easeIn(seg(p, 0.39, 0.5));
    const fin6 = ease(seg(p, 0.88, 0.94));
    const openReady = ready(img.body) && ready(img.lid);
    const cf = openReady ? swap : 0;

    // 제목·부제
    const tOut = seg(p, 0.03, 0.12);
    css(days, 'transform', `translate3d(${(W / 2 - L.daysW / 2).toFixed(2)}px, ${(L.daysY - L.daysH / 2 - tOut * H * 0.08).toFixed(2)}px, 0)`);
    css(days, 'opacity', (1 - tOut).toFixed(3));
    css(sub, 'transform', `translate3d(${(W / 2 - L.subW / 2).toFixed(2)}px, ${(L.subY - L.subH / 2 + tOut * H * 0.03).toFixed(2)}px, 0)`);
    css(sub, 'opacity', (1 - seg(p, 0.03, 0.09)).toFixed(3));

    // 몸체 중심·크기·기울기 (닫힌 사진과 열린 사진이 같은 값을 공유)
    const exitY = -exit * (H * 1.05);
    const k = lerp(L.kHold, L.kP, move) * lerp(1, 1.12, zoom);
    const bx = lerp(L.bx1, L.bxP, move);
    const by = lerp(L.by1, L.byP, move) + exitY;
    const ang = JAR.angle * tilt; // 0 → -22°

    // 닫힌 제품(HTML 사진): 뚜껑이 살짝 돌며 들리고 몸체는 기울며 사라짐
    const cs = (k / L.kHold);
    place(body, bx, by, J, bodyH, ang, cs);
    const lAng = ang - lift * 8;
    const lUp = lift * J * 0.14;
    const lc = { x: bx + Math.sin(rad(ang)) * (bodyH / 2 + lidH / 2 - J * OVER) * cs, y: by - Math.cos(rad(ang)) * (bodyH / 2 + lidH / 2 - J * OVER) * cs - lUp };
    place(lid, lc.x - lift * J * 0.06, lc.y, J, lidH, lAng, cs);
    css(body, 'opacity', (1 - cf).toFixed(3)); css(lid, 'opacity', (1 - cf).toFixed(3));

    // ── 캔버스 ──
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 모래시계: 아래에서 등장 → (붓기) → 확대·중앙 → 마무리 위치
    let g = L.gP;
    let hx = L.sxP + 0, hy = lerp(H + HG_H * L.gP * 0.1 + (HG_CY - 100) * L.gP, L.hyP, enter);
    g = lerp(g, L.gZ, zoom); hx = lerp(hx, L.zX, zoom); hy = lerp(hy, L.zY, zoom);
    g = lerp(g, L.gF, fin6); hx = lerp(hx, L.fX, fin6); hy = lerp(hy, L.fY, fin6);
    // 줄기 x 는 몸체 위치에서 계산 → 붓는 동안 모래시계 중심과 일치(확대 중에는 함께 이동)
    const streamX = bx + (JAR.streamX - BCX) * k;
    if (zoom === 0) hx = streamX;

    // 크림 양
    const fill = seg(p, 0.25, 0.4);
    const dt = seg(p, 0.56, 0.88);
    const day = dayAt(dt);
    const moved = (day - 1) / 13;
    const upFrac = fill * (1 - moved);
    const loFrac = moved;
    const dyU = shiftFor(HG.upper, upFrac);
    const dyL = shiftFor(HG.lower, loFrac);
    const upSurf = upFrac > 0.001 ? HG.upper.surfaceAtCx + dyU : HG.neck; // 원본 좌표
    const loPeak = HG.lower.peakAtCx + dyL;

    const hgVisible = enter > 0 && ready(img.empty);
    if (hgVisible) {
      // 바닥 그림자
      hgSpace(hx, hy, g);
      ctx.drawImage(shadow, HG_CX - 440, 1438 - 55, 880, 110);

      const e = lay('hg-empty');
      ctx.drawImage(S('empty').src, e.x, e.y, e.w, e.h);
      // 위쪽 크림
      if (upFrac > 0.001 && ready(img.upper)) {
        const u = lay('hg-upper');
        ctx.save(); ctx.clip(clipUp);
        ctx.drawImage(S('upper').src, u.x, u.y + dyU, u.w, u.h);
        ctx.restore();
      }
      // 목을 지나는 줄기: 흐르는 동안만. 시작은 목에서 아래로 내려오고, 끝은 위쪽 끝이 떨어지며 사라짐
      const flowing = moved > 0.0005 && moved < 0.9995 && fill >= 1;
      if (flowing && ready(img.neck)) {
        const n = lay('hg-neck');
        const [t0, t1] = HG.streamThin;
        const end = loPeak + 8;
        const head = lerp(t0, end, smooth(seg(moved, 0, 0.035)));
        const tailTop = lerp(n.y, end, smooth(seg(moved, 0.965, 1)));
        ctx.save();
        ctx.beginPath(); ctx.rect(n.x - 10, tailTop, n.w + 20, Math.max(0, head - tailTop)); ctx.clip();
        const { src: ns, f: nf } = S('neck');
        ctx.drawImage(ns, 0, 0, n.w * nf, (t0 - n.y) * nf, n.x, n.y, n.w, t0 - n.y);
        ctx.drawImage(ns, 0, (t0 - n.y) * nf, n.w * nf, (t1 - t0) * nf, n.x, t0, n.w, Math.max(1, end - t0));
        ctx.restore();
      }
      // 아래쪽 크림
      if (loFrac > 0.001 && ready(img.lower)) {
        const lo = lay('hg-lower');
        ctx.save(); ctx.clip(clipLo);
        ctx.drawImage(S('lower').src, lo.x, lo.y + dyL, lo.w, lo.h);
        ctx.restore();
      }
    }

    // 용기에서 떨어지는 크림 줄기 (화면 좌표에서 직접 계산)
    const seamY = by + (JAR.seam - BCY) * k;
    const surf = hgToStage(hx, hy, g, HG_CX, upSurf + 2);
    const headT = easeIn(seg(p, 0.2, 0.265));
    const tailT = easeIn(seg(p, 0.385, 0.47));
    const streamTop = lerp(seamY, surf.y, tailT);
    const dropH = jl('jar-drop').h * k;
    const fullLen = Math.max(0, surf.y - seamY);
    const headY = seamY + lerp(0, fullLen + dropH, headT); // 끝 방울까지 크림 표면 아래로 들어가면 연결 완료
    const pouring = headT > 0 && tailT < 1 && cf > 0.5 && ready(img.stream) && ready(img.drop) && hgVisible;
    if (pouring) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, streamTop, W, Math.max(0, Math.min(headY, surf.y) - streamTop)); ctx.clip();
      const s = jl('jar-stream'), d = jl('jar-drop');
      const colLen = Math.max(1, headY - dropH - seamY);
      const sx = (x: number) => streamX + (x - JAR.streamX) * k;
      // 기둥은 원래 길이보다 짧으면 위에서부터 잘라 쓰고, 길면 세로로 늘림
      const natural = (JAR.drop - JAR.seam) * k;
      const { src: ss, f: sf } = S('stream');
      const srcH = colLen <= natural ? colLen / k : JAR.drop - JAR.seam;
      ctx.drawImage(ss, 0, (JAR.seam - s.y) * sf, s.w * sf, srcH * sf, sx(s.x), seamY, s.w * k, colLen);
      ctx.drawImage(S('drop').src, sx(d.x), seamY + colLen - 4 * k, d.w * k, d.h * k);
      ctx.restore();
    }

    // 링 앞면: 줄기가 링 뒤로 지나가도록 덮음
    if (hgVisible && ready(img.ring)) {
      hgSpace(hx, hy, g);
      const r = lay('hg-ring');
      ctx.drawImage(S('ring').src, r.x, r.y, r.w, r.h);
    }

    // 열린 용기 몸체·뚜껑(같은 사진 속 위치 관계 유지). 전환 초기에는 닫힌 사진의 기울기에 맞춰 덜 기울어진 상태에서 시작
    if (cf > 0) {
      ctx.globalAlpha = cf;
      const rel = rad(ang - JAR.angle); // 사진 자체 기울기(-22°) 대비 추가 회전
      const b = jl('jar-body');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(bx, by); ctx.rotate(rel); ctx.scale(k, k); ctx.translate(-BCX, -BCY);
      ctx.drawImage(S('body').src, b.x, b.y, b.w, b.h);
      // 뚜껑: 닫힌 뚜껑 위치에서 사진 속 위치로 이동
      const lidNative = { x: bx + (JAR.lidCenter[0] - BCX) * k, y: by + (JAR.lidCenter[1] - BCY) * k };
      const lt = smooth(seg(p, 0.09, 0.2));
      const lx = lerp(lc.x, lidNative.x, lt), ly = lerp(lc.y, lidNative.y, lt);
      const li = jl('jar-lid');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(lx, ly + exitY * 0.08); ctx.rotate(lerp(rad(18), 0, lt)); ctx.scale(k, k); ctx.translate(-JAR.lidCenter[0], -JAR.lidCenter[1]);
      ctx.drawImage(S('lid').src, li.x, li.y, li.w, li.h);
      ctx.globalAlpha = 1;
    }

    // 날짜
    const cIn = seg(p, 0.53, 0.58), cOut = seg(p, 0.88, 0.92);
    css(counter, 'opacity', (cIn * (1 - cOut)).toFixed(3));
    const glassLeft = hx - (HG_W / 2) * g;
    const cxC = mobile ? W / 2 - L.cW / 2 : Math.max(24, Math.min(W * 0.14, glassLeft - L.cW - W * 0.05));
    const cyC = mobile ? H * 0.035 : H / 2 - L.cH / 2;
    css(counter, 'transform', `translate3d(${cxC.toFixed(2)}px, ${cyC.toFixed(2)}px, 0)`);
    const dd = Math.round(day);
    if (dd !== dayShown) { dayShown = dd; dayEl.textContent = String(dd).padStart(2, '0'); }
    dayEl.classList.toggle('is-passing', ![1, 7, 14].includes(dd)); // 01·07·14 는 항상 또렷하게

    // 마무리 카피
    const fIn = seg(p, 0.935, 0.985);
    css(fin, 'opacity', fIn.toFixed(3));
    css(fin, 'transform', `translateY(${((1 - fIn) * 16).toFixed(2)}px)`);
    fin.classList.toggle('is-on', fIn > 0.01);

    // 검증용 상태(화면 좌표). 자동 검사 스크립트가 읽음
    const mouth = hgToStage(hx, hy, g, HG_CX, HG.mouthY);
    const top = hgToStage(hx, hy, g, HG_CX, HG.content[1]);
    const bottom = hgToStage(hx, hy, g, HG_CX, HG.content[3]);
    state = {
      p, W, H, day: dd, moved, upFrac, loFrac, fill,
      jar: { x: bx, y: by, k, ang, open: cf, closed: 1 - cf, top: by - (BCY - 71) * k, bottom: seamY },
      glass: { x: hx, y: hy, g, top: top.y, bottom: bottom.y, left: hx - (HG_W / 2) * g, right: hx + (HG_W / 2) * g, mouthY: mouth.y, visible: hgVisible },
      pour: pouring ? { x: streamX, top: streamTop, bottom: Math.min(headY, surf.y), surfaceY: surf.y, seamY } : null,
      upSurfY: hgToStage(hx, hy, g, HG_CX, upSurf).y, loPeakY: hgToStage(hx, hy, g, HG_CX, loPeak).y,
    };
  }

  /*
    렌더 루프
    - 스크롤 이벤트에서는 목표 진행도만 갱신하고, 그리기는 화면 갱신 주기(requestAnimationFrame)에 한 번만
    - 마우스 휠 한 칸(약 100px)이 한 프레임에 장면의 2% 이상을 건너뛰지 않도록, 표시 진행도를 목표로 짧게 따라가게 함
      (시간 상수 70ms → 입력이 멈추면 약 0.2초 안에 정지, 큰 이동은 바로 맞춤)
    - 값이 같으면 다시 그리지 않음
  */
  const TAU = 0.07;
  let ticking = false, force = false;
  let top0 = 0, shown = -1, lastT = 0, drawn = -1;
  function progress() {
    const r = sec.getBoundingClientRect();
    return clamp((top0 - r.top) / Math.max(1, r.height - H));
  }
  const update = (t: number) => {
    ticking = false;
    // 화면 크기 변경(회전·주소창) 직후 첫 프레임도 새 크기 기준으로 계산
    if (stage.clientWidth !== W || stage.clientHeight !== H) { layout(); force = true; }
    const target = progress();
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    if (shown < 0 || Math.abs(target - shown) > 0.12) shown = target; // 처음·멀리 이동(링크 이동 등)은 즉시 맞춤
    else shown += (target - shown) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(target - shown) < 0.0004) shown = target;
    if (force || shown !== drawn) { frame(shown); drawn = shown; force = false; }
    if (shown !== target) request(); else lastT = 0;
  };
  function request(redraw = false) {
    if (redraw) force = true;
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  const onScroll = () => request();

  function relayout() {
    layout();
    force = true;
    top0 = (document.querySelector('.morh-header') as HTMLElement | null)?.offsetHeight ?? 0;
    request(true);
  }
  relayout();
  new ResizeObserver(relayout).observe(stage);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  document.fonts?.ready.then(relayout);
  (window as unknown as { __ritual: () => Record<string, unknown> }).__ritual = () => state;
  root.classList.add('is-live');
}
