"""
웹용 이미지 파생본 생성 스크립트.

- 원본: source-assets/ (복사본, 수정하지 않음)
- 출력: public/images/ (웹용 파생본)

용기 PNG는 알파가 0/255 이진값이고 가장자리에 배경 제거 잔여 픽셀(빨강·노랑 점)이 있어
1) 본체에서 떨어진 점 제거 2) 바깥 1px 테두리 정리 3) 0.6px 알파 안티앨리어싱만 적용합니다.
색상·형태·비율·로고는 변경하지 않습니다(리사이즈 외 픽셀 색 보정 없음).

실행: python3 -I scripts/build-images.py
"""
from pathlib import Path
from PIL import Image, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-assets"
OUT = ROOT / "public" / "images"
DEBUG = ROOT / "scripts" / ".debug"

VIEWS = ["front", "back", "left", "right", "top"]
WIDTHS = [400, 800, 1254]


def clean_alpha(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    r, g, b, a = im.split()
    mask = a.point(lambda v: 255 if v > 127 else 0)

    # 1) 본체에서 떨어진 작은 점 제거: 큰 opening 후 다시 팽창한 영역 안쪽만 유지
    core = mask.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9))
    near_core = core.filter(ImageFilter.MaxFilter(5))
    mask = ImageChops.multiply(mask, near_core)

    # 2) 바깥 1px 오염 테두리 제거
    mask = mask.filter(ImageFilter.MinFilter(3))

    # 3) 가장자리만 부드럽게(안쪽은 완전 불투명 유지)
    soft = mask.filter(ImageFilter.GaussianBlur(0.6))
    alpha = ImageChops.lighter(soft, mask.filter(ImageFilter.MinFilter(3)))
    return Image.merge("RGBA", (r, g, b, alpha))


def save_variants(im: Image.Image, name: str):
    for w in WIDTHS:
        out = im if im.width == w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        out.save(OUT / f"{name}-{w}.webp", "WEBP", quality=86, method=6)
    # 썸네일
    im.resize((160, 160), Image.LANCZOS).save(OUT / f"{name}-thumb.webp", "WEBP", quality=82, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    DEBUG.mkdir(parents=True, exist_ok=True)
    for v in VIEWS:
        src = Image.open(SRC / "product" / f"{v}.png")
        cleaned = clean_alpha(src)
        save_variants(cleaned, f"morh-{v}")
        # 검수용: 검정·아이보리 배경 합성 (배포 대상 아님)
        for label, color in (("black", (0, 0, 0, 255)), ("ivory", (248, 243, 234, 255))):
            for tag, img in (("orig", src.convert("RGBA")), ("clean", cleaned)):
                bg = Image.new("RGBA", img.size, color)
                bg.alpha_composite(img)
                bg.convert("RGB").resize((627, 627)).save(DEBUG / f"{v}-{tag}-{label}.jpg", quality=85)

    # 홈 리추얼 장면용: 정면 사진을 뚜껑/몸체 레이어로 분리 (경계 y≈546, 위아래 4px 겹침으로 닫힌 상태에서 이음새 없음)
    front = clean_alpha(Image.open(SRC / "product" / "front.png"))
    parts = {"lid": (119, 218, 1135, 550), "body": (119, 546, 1135, 1054)}
    for name, box in parts.items():
        crop = front.crop(box)
        for w in (520, 1016):
            out = crop if crop.width == w else crop.resize((w, round(crop.height * w / crop.width)), Image.LANCZOS)
            out.save(OUT / f"ritual-{name}-{w}.webp", "WEBP", quality=88, method=6)
        print(name, crop.size)

    # 크림 텍스처: 원본 해상도(420x560) 유지, 업스케일하지 않음
    tex = Image.open(SRC / "texture" / "cream-texture.jpg").convert("RGB")
    # 배경 근처 밝기(246~255)만 255로 부드럽게 올려 종이색과의 미세한 경계를 없앰. 크림 본체(≤245)는 그대로
    def lift(v):
        t = min(1.0, max(0.0, (v - 246) / 6))
        t = t * t * (3 - 2 * t)
        return round(v + (255 - v) * t)
    tex = tex.point([lift(v) for v in range(256)] * 3)
    tex.save(OUT / "cream-texture-420.webp", "WEBP", quality=90, method=6)
    tex.save(OUT / "cream-texture-420.jpg", "JPEG", quality=90, optimize=True, progressive=True)

    for f in sorted(OUT.iterdir()):
        print(f"{f.name:32s} {f.stat().st_size/1024:7.1f} KB")


if __name__ == "__main__":
    main()
