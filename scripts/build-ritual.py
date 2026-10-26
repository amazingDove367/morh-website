"""
홈 리추얼 장면용 실사 레이어 생성 스크립트.

원본(사용자 제공 누끼컷, source-assets/ritual/ 에 복사본):
  - open-jar-pour.png : 열린 용기 + 분리된 뚜껑 + 흘러내리는 크림 (1024x1536, 알파 포함)
  - hourglass.png     : 위·아래에 크림이 든 모래시계 (1024x1536, 알파 포함)

생성하는 것 (public/images/ritual/):
  - jar-lid / jar-body : 같은 사진에서 연결 영역으로 분리한 뚜껑과 몸체(몸체는 y<846)
  - jar-stream / jar-drop : 몸체 아래로 이어지는 크림 줄기와 끝 방울
      → 줄기가 화면에서 가는 선으로 보이지 않도록 가로 폭만 행마다 최대 1.6배 넓힘(세로 원통이라 음영이 유지됨)
  - hg-empty : 크림 픽셀을 같은 사진의 '빈 유리' 행 프로필로 바꾼 빈 모래시계
  - hg-upper / hg-lower / hg-neck : 사진 속 크림을 위·아래·목 줄기로 나눈 레이어 (표면 모양은 원본 그대로)
  - hg-ring : 위쪽 링 앞면(크림 줄기가 링 뒤로 지나가도록 덮는 용도)
  - hg-day14 : 정적 대체 화면용 합성(위는 비고 아래에 크림이 모인 상태)
  - src/data/ritual-geometry.json : 유리 내부 폭, 크림 이동량(px)↔면적 표, 각 레이어 위치

실행: python3 -I scripts/build-ritual.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets" / "ritual"
OUT = ROOT / "public" / "images" / "ritual"
DEBUG = ROOT / "scripts" / ".debug"
GEOM = ROOT / "src" / "data" / "ritual-geometry.json"

CX = 512          # 모래시계 중심 x
Y_NECK = 781      # 목
Y_TOP_IN = 190    # 위쪽 벌브 내부 시작(링 아래)
Y_BOT_IN = 1288   # 아래쪽 벌브 내부 끝(받침 위)
WALL = 9          # 유리 벽 두께(px)

# 아래 크림 더미 윗면: 원본을 확대해 직접 따라 그린 좌표(왼쪽은 자동 검출이 반사광에 흔들려 수동)
LOWER_SURFACE = [(214, 1290), (230, 1262), (250, 1240), (300, 1190), (350, 1160), (400, 1135), (450, 1103),
                 (490, 1086), (520, 1078), (560, 1085), (575, 1095), (625, 1130), (675, 1160), (725, 1190),
                 (775, 1230), (800, 1262), (812, 1290)]


def save(im: Image.Image, name: str, q=88):
    im.save(OUT / f"{name}.webp", "WEBP", quality=q, method=6)
    return im.size


def smooth(v: np.ndarray, k: int):
    pad = np.pad(v, k, mode="edge")
    return np.convolve(pad, np.ones(2 * k + 1) / (2 * k + 1), mode="same")[k:-k]


# ───────────────────────── 모래시계 ─────────────────────────
def build_hourglass(geom: dict):
    im = Image.open(SRC / "hourglass.png").convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3]
    H, W = al.shape

    # 1) 유리 바깥 반폭: 기둥과 떨어진 행(446~1144)은 실측, 나머지(넓은 구간)는 293
    hwo = np.full(H, 293.0)
    for y in range(446, 1145):
        row = al[y]
        l = next(x for x in range(214, CX) if row[x] > 120)
        r = next(x for x in range(810, CX, -1) if row[x] > 120)
        hwo[y] = (r - l) / 2
    hwo = smooth(hwo, 2)
    hwi = hwo - WALL

    ys, xs = np.mgrid[0:H, 0:W]
    idx = np.arange(W)

    # 1-1) 아래쪽 벌브 바닥: 열마다 크림(밝은 무채색)이 끝나는 y — 둥근 바닥 곡선
    bot = np.full(W, np.nan)
    for x in range(CX - 280, CX + 281):
        y = 1236
        while y < 1380 and al[y, x] > 240 and a[y, x, 0] > 196 and (a[y, x, 0] - a[y, x, 2]) < 34:
            y += 1
        if y > 1240:
            bot[x] = y
    ok = ~np.isnan(bot)
    bot = np.interp(idx, idx[ok], bot[ok])
    bot = smooth(np.maximum(bot, bot[::-1] if False else bot[(2 * CX - idx).clip(0, W - 1)]), 8)
    # 넓은 구간 아래쪽 벽: 바닥 곡선이 벽과 만나는 지점까지
    inside = (np.abs(xs - CX) <= hwo[:, None]) & (ys >= Y_TOP_IN) & (ys <= bot[None, :])

    # 2) 위쪽 크림 윗면: 열마다 '아래로 60px 이상 불투명'이 시작되는 y (반사 띠는 범위 밖이면 보간)
    up = np.full(W, np.nan)
    for x in range(CX - 290, CX + 291):
        for y in range(200, 460):
            if (al[y:y + 60, x] > 240).all():
                if 295 <= y <= 420:
                    up[x] = y
                break
    ok = ~np.isnan(up)
    up = np.interp(idx, idx[ok], up[ok])
    up = smooth(up, 6)

    lo_x, lo_y = zip(*LOWER_SURFACE)
    lo = np.interp(idx, lo_x, lo_y)

    m_up = inside & (ys >= up[None, :]) & (ys <= Y_NECK + 2)
    m_lo = inside & (ys >= lo[None, :]) & (ys > Y_NECK)

    # 3) 목 + 가는 줄기: x=512 를 포함하는 불투명 연속 구간 (y 760 ~ 더미 윗면)
    m_st = np.zeros_like(m_up)
    st_rows = {}
    for y in range(760, 1110):
        row = al[y]
        c = CX if row[CX] > 230 else (CX - 2 if row[CX - 2] > 230 else None)
        if c is None:
            continue
        l = c
        while l > CX - 70 and row[l - 1] > 200:
            l -= 1
        r = c
        while r < CX + 70 and row[r + 1] > 200:
            r += 1
        m_st[y, l:r + 1] = True
        st_rows[y] = (l, r)

    cream = m_up | m_lo | m_st

    # 4) 빈 유리 만들기 — 같은 사진의 '크림이 없는 유리' 행을 옮겨 씀(평균·생성 없음)
    #   · 아래 벌브 860~1078행: 가는 줄기 부분만 양옆 픽셀로 가로 보간 → clean
    #   · 위 벌브 좁아지는 구간: 모래시계가 목 기준 상하 대칭이므로 아래 벌브 행(1562-y)을 반폭에 맞춰 가로 보정해 사용
    #   · 목: 885행을 목 폭에 맞춰 사용
    #   · 넓은 구간(위 292~480, 아래 1078~바닥): 위쪽 빈 행(215~292)을 세로로 늘려 사용(아래는 상하 반전)
    pm = a.copy()
    pm[..., :3] *= a[..., 3:4] / 255  # 프리멀티플라이
    clean = pm.copy()
    for y in range(860, 1079):
        if y not in st_rows:
            continue
        l, r = st_rows[y]
        l, r = l - 3, r + 3
        for ch in range(4):
            clean[y, l:r + 1, ch] = np.linspace(pm[y, l - 1, ch], pm[y, r + 1, ch], r - l + 1)

    def sample(sy, y):
        k = hwo[sy] / hwo[y]
        sx = np.clip(np.round(CX + (np.arange(W) - CX) * k).astype(int), 0, W - 1)
        return clean[sy, sx]

    def source(y):
        stretched_up = lambda: sample(int(np.clip(215 + (y - 292) * 77 / 188, 215, 292)), y)
        if 740 <= y <= 880:
            return sample(960, y)
        if y < 484:
            return stretched_up()
        if y < 600:  # 넓은 구간 → 대칭 구간으로 서서히 전환
            t = (y - 484) / 116
            return stretched_up() * (1 - t) + sample(max(885, 2 * Y_NECK - y), y) * t
        if y < 740:
            return sample(max(885, 2 * Y_NECK - y), y)
        if y <= 1078:
            return clean[y]
        return sample(int(np.clip(1074 - (y - 1078) * 0.35, 1000, 1074)), y)

    soft = np.asarray(Image.fromarray((cream * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.6))).astype(np.float32) / 255
    # 크림 표면 바로 위의 원본 빈 유리를 아래로 이어 붙여 경계를 없앰(표면에서 멀어질수록 위 소스로 전환)
    surf = np.where(np.arange(W) > 0, 0, 0).astype(float)
    out_pm = pm.copy()
    for y in range(Y_TOP_IN, int(bot.max()) + 4):
        if soft[y].max() <= 0:
            continue
        repl = source(y)
        sref = up if y < Y_NECK else lo
        d = y - sref
        wext = np.clip(1 - d / 110, 0, 1)
        wext[(d < 0)] = 0
        if y >= 740:
            wext[:] = 0
        ry = np.clip((sref - 6).astype(int), 0, H - 1)
        ext = clean[ry, np.arange(W)]
        repl = ext * wext[:, None] + repl * (1 - wext[:, None])
        w = soft[y][:, None]
        out_pm[y] = pm[y] * (1 - w) + repl * w
    empty = out_pm.copy()
    empty[..., :3] = out_pm[..., :3] / np.maximum(out_pm[..., 3:4] / 255, 1e-3)

    def layer(mask, feather=1.0):
        m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(feather))
        out = a.copy()
        out[..., 3] = a[..., 3] * (np.asarray(m).astype(np.float32) / 255)
        return out

    # 잘라낼 영역(여백 제거) — 모든 레이어는 같은 기준 좌표(원본 1024x1536)에서 오프셋만 기록
    BOX = (116, 58, 910, 1446)
    to_img = lambda arr: Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    layers = {}

    e_img = to_img(empty).crop(BOX)
    layers["hg-empty"] = (BOX[0], BOX[1], *save(e_img, "hg-empty", 90))

    def crop_save(arr, name, mask):
        ys_, xs_ = np.where(mask)
        box = (int(xs_.min()) - 3, int(ys_.min()) - 3, int(xs_.max()) + 4, int(ys_.max()) + 4)
        layers[name] = (box[0], box[1], *save(to_img(arr).crop(box), name, 90))

    crop_save(layer(m_up), "hg-upper", m_up)
    crop_save(layer(m_lo), "hg-lower", m_lo)
    crop_save(layer(m_st, 0.7), "hg-neck", m_st)

    # 위쪽 링 앞면(구리색 픽셀, 가운데 앞쪽 호)
    rgb = a[..., :3]
    ring = (ys >= 128) & (ys <= 196) & (np.abs(xs - CX) < 330) & (al > 180) & ((rgb[..., 0] - rgb[..., 2]) > 55)
    ring &= ys >= (150 - 0.00012 * (xs - CX) ** 2 * 0)  # 앞쪽 호만
    ring = np.asarray(Image.fromarray((ring * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    crop_save(layer(ring, 0.6), "hg-ring", ring)

    # 정적 대체(DAY 14): 빈 유리 + 아래 크림 전체
    d14 = to_img(empty)
    d14.alpha_composite(to_img(layer(m_lo)))
    d14 = d14.crop(BOX)
    for w in (480, 794):
        out = d14 if d14.width == w else d14.resize((w, round(d14.height * w / d14.width)), Image.LANCZOS)
        out.save(OUT / f"hg-day14-{w}.webp", "WEBP", quality=86, method=6)

    # 5) 이동량↔면적 표: 크림 레이어를 dy 만큼 아래로 내렸을 때 내부(벽 안쪽)에 남는 면적
    inner_up = (np.abs(xs - CX) <= hwi[:, None]) & (ys >= Y_TOP_IN) & (ys <= Y_NECK)
    inner_lo = (np.abs(xs - CX) <= hwi[:, None]) & (ys >= Y_NECK) & (ys <= bot[None, :] - 4)

    def area_table(mask, inner, dmax, step=2):
        yy, xx = np.where(mask)
        out = []
        for dy in range(0, dmax + 1, step):
            ny = yy + dy
            ok_ = ny < H
            out.append(int(inner[ny[ok_], xx[ok_]].sum()))
        return out

    t_up = area_table(m_up, inner_up, 500)
    t_lo = area_table(m_lo, inner_lo, 290)

    # 내부 윤곽(클립 경로) — 4px 간격 반폭
    # 내부 윤곽(클립 경로) — 다각형 점 목록 [x, y, x, y, ...]
    def poly_upper():
        pts = [(CX - hwi[y], y) for y in range(Y_TOP_IN, Y_NECK + 1, 4)]
        pts += [(CX + hwi[y], y) for y in range(Y_NECK, Y_TOP_IN - 1, -4)]
        return pts
    def poly_lower():
        ywall = 1236
        pts = [(CX - hwi[y], y) for y in range(Y_NECK, ywall + 1, 4)]
        xl, xr = int(CX - hwi[ywall]), int(CX + hwi[ywall])
        pts += [(x, max(ywall, bot[x] - 4)) for x in range(xl, xr + 1, 6)]
        pts += [(CX + hwi[y], y) for y in range(ywall, Y_NECK - 1, -4)]
        return pts
    flat = lambda pts: [round(float(v), 1) for pt in pts for v in pt]
    prof_up, prof_lo = flat(poly_upper()), flat(poly_lower())

    geom["hourglass"] = {
        "w": W, "h": H, "cx": CX, "neck": Y_NECK, "topIn": Y_TOP_IN, "botAtCx": round(float(bot[CX]), 1),
        "content": [121, 64, 904, 1441],  # 실제 보이는 범위
        "mouthY": 110,                    # 유리 입구(줄기가 들어가는 높이)
        "layers": {k: {"x": v[0], "y": v[1], "w": v[2], "h": v[3]} for k, v in layers.items()},
        "upper": {"step": 2, "area": t_up, "surfaceTop": int(up[CX - 290:CX + 291].min()), "surfaceAtCx": round(float(up[CX]), 1)},
        "lower": {"step": 2, "area": t_lo, "peakAtCx": round(float(lo[CX]), 1)},
        "streamThin": [880, 1030],
        "clipUpper": prof_up, "clipLower": prof_lo,
    }

    # 검수용 미리보기
    for name, arr in (("empty", empty), ("upper", layer(m_up)), ("lower", layer(m_lo)), ("neck", layer(m_st)), ("ring", layer(ring))):
        bg = Image.new("RGBA", (W, H), (252, 250, 246, 255))
        bg.alpha_composite(to_img(arr))
        bg.convert("RGB").resize((W // 2, H // 2)).save(DEBUG / f"hg-{name}.jpg", quality=88)


# ───────────────────────── 열린 용기 ─────────────────────────
SEAM = 846  # 몸체/줄기 경계 y


def build_jar(geom: dict):
    im = Image.open(SRC / "open-jar-pour.png").convert("RGBA")
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3]
    H, W = al.shape

    # 뚜껑 = 뚜껑 안쪽 점에서 연결된 영역
    m = Image.fromarray(((al > 10) * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(m, (330, 200), 128)
    lid = np.asarray(m) == 128
    lid = np.asarray(Image.fromarray((lid * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    # 몸체+줄기 = 몸체 안쪽 점에서 연결된 영역(배경 제거 잔여 점 제외)
    m2 = Image.fromarray((((al > 10) & ~lid) * 255).astype(np.uint8)).copy()
    ImageDraw.floodfill(m2, (700, 600), 128)
    rest = np.asarray(m2.filter(ImageFilter.MaxFilter(3))) == 128
    rest = np.asarray(Image.fromarray((rest * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3))) > 0
    rest &= al > 0
    ys, xs = np.mgrid[0:H, 0:W]
    body = rest & (ys < SEAM)
    stream = rest & (ys >= SEAM)

    to_img = lambda arr: Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGBA")
    layers = {}

    def masked(mask):
        out = a.copy(); out[..., 3] = a[..., 3] * mask
        return out

    def crop_save(arr, name, mask, q=90):
        yy, xx = np.where(mask)
        box = (int(xx.min()) - 2, int(yy.min()) - 2, int(xx.max()) + 3, int(yy.max()) + 3)
        layers[name] = (box[0], box[1], *save(to_img(arr).crop(box), name, q))

    crop_save(masked(lid), "jar-lid", lid)
    crop_save(masked(body), "jar-body", body)

    # 줄기: 행마다 중심 기준 가로 확대 (경계 행에서는 1배 → 이음새 없음)
    DROP = 1292
    def scale_at(y):
        if y < SEAM + 90:
            t = (y - SEAM) / 90
            return 1 + 0.6 * (t * t * (3 - 2 * t))
        if y < DROP:
            return 1.6
        t = min(1, (y - DROP) / 70)
        return 1.6 - 0.32 * (t * t * (3 - 2 * t))

    sx0, sx1 = 380, 600
    wide = np.zeros((H, sx1 - sx0, 4), np.float32)
    centers = []
    for y in range(SEAM, 1500):
        row = a[y, sx0:sx1]
        alpha = row[:, 3] * stream[y, sx0:sx1]
        if alpha.max() < 8:
            continue
        xs_ = np.arange(sx1 - sx0)
        c = float((xs_ * alpha).sum() / alpha.sum())
        centers.append((y, c + sx0))
        s = scale_at(y)
        src_x = c + (xs_ - c) / s
        pm = row[:, :3] * (alpha[:, None] / 255)
        out_a = np.interp(src_x, xs_, alpha, left=0, right=0)
        out_pm = np.stack([np.interp(src_x, xs_, pm[:, ch], left=0, right=0) for ch in range(3)], 1)
        wide[y, :, :3] = out_pm / np.maximum(out_a[:, None] / 255, 1e-3)
        wide[y, :, 3] = out_a
    full = np.zeros_like(a)
    full[:, sx0:sx1] = wide
    smask = full[..., 3] > 4
    col = smask & (ys < DROP)
    drop = smask & (ys >= DROP - 2)
    crop_save(np.where(col[..., None], full, 0), "jar-stream", col)
    crop_save(np.where(drop[..., None], full, 0), "jar-drop", drop)

    cy = np.array(centers)
    geom["jar"] = {
        "w": W, "h": H, "seam": SEAM, "drop": DROP,
        "streamX": round(float(cy[(cy[:, 0] > 900) & (cy[:, 0] < 1250), 1].mean()), 1),
        "bodyCenter": [615, 560],     # 몸체(유리통) 중심 — 회전·이동 기준점
        "bodyWidth": 600,             # 화면 크기 맞춤용 기준 지름(px)
        "lidCenter": [330, 252],
        "angle": -22,                 # 사진 속 몸체 기울기(로고 기울기 기준)
        "layers": {k: {"x": v[0], "y": v[1], "w": v[2], "h": v[3]} for k, v in layers.items()},
    }

    for name, arr in (("lid", masked(lid)), ("body", masked(body)), ("stream", full)):
        bg = Image.new("RGBA", (W, H), (252, 250, 246, 255))
        bg.alpha_composite(to_img(arr))
        bg.convert("RGB").resize((W // 2, H // 2)).save(DEBUG / f"jar-{name}.jpg", quality=88)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    DEBUG.mkdir(parents=True, exist_ok=True)
    geom = {}
    build_jar(geom)
    build_hourglass(geom)
    GEOM.write_text(json.dumps(geom, ensure_ascii=False, separators=(",", ":")))
    for k in ("jar", "hourglass"):
        print(k, {n: v for n, v in geom[k]["layers"].items()})
    print("streamX", geom["jar"]["streamX"], "upper area0", geom["hourglass"]["upper"]["area"][0], "lower area0", geom["hourglass"]["lower"]["area"][0])


if __name__ == "__main__":
    main()
