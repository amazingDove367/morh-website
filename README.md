# MORH 브랜드 웹사이트 — 1단계 프로토타입

홈(Editorial Motion)과 제품 상세(Minimal Commerce)의 핵심 인터랙션 A/B 프로토타입입니다.
2단계(전체 홈·상세 구현)는 사용자가 A/B를 선택한 뒤 진행합니다.

## 실행

```bash
npm install
npm run build
npx astro preview --port 4321 --host 127.0.0.1   # http://127.0.0.1:4321/
# 개발 모드: npm run dev
```

- 이미지 파생본 다시 만들기: `npm run images` (Python 3 + Pillow)
- 타입 검사: `npm run check`
- 자동 검증(프리뷰 서버 실행 중, 시스템 Chrome 사용): `npm run verify` (전체 123항목), `node scripts/verify-home.mjs` (홈 장면 63항목)
- 첫 로드 용량·로컬 LCP: `node scripts/weights.mjs`
- 스크린샷: `node scripts/shot.mjs <경로> <desktop|mobile> [scrollY] [출력파일]`

## 경로

| 경로 | 내용 |
|---|---|
| `/` | **홈** — 14 DAYS 스크롤 장면 (제품 → 크림 → 모래시계 14일) |
| `/prototype/` | 1단계 A/B 비교 허브 (점수·장단점) |
| `/prototype/compare/` | A/B 나란히 비교 (데스크톱 1280×800 / 모바일 390×844) |
| `/prototype/hero-a/` · `hero-b/` | ① Hero Motion |
| `/prototype/transition-a/` · `transition-b/` | ② Section Transition |
| `/prototype/product-a/` · `product-b/` | ③ Product Interaction (+ 탭·FAQ·구매 흐름) |
| `/prototype/story/` | Hero A → Texture Zoom A → 제품 특징 연결 |
| `/prototype/system/` | 디자인 시스템 초안 |
| `/result/` | 구매 신청 완료(전환) 페이지 |
| `/privacy/` | 개인정보 처리 안내 |

모든 페이지 뒤에 `?motion=off` 를 붙이면 '움직임 줄이기' 상태로 볼 수 있습니다.

## 홈 스크롤 장면

- `src/components/home/RitualScene.astro` — 장면 마크업 (정적 배치 + 스크롤 배치)
- `src/scripts/ritual.ts` — 스크롤 진행도 → 객체 위치·크림·날짜 계산
- `src/scripts/hourglass.ts` — 모래시계 형상과 크림 면적 계산 (위아래 총량 일정)
- `src/components/home/Hourglass.astro` — 유리·프레임·크림을 분리한 SVG
- 뚜껑/몸체 레이어: `public/images/ritual-lid-*.webp`, `ritual-body-*.webp` (정면 사진에서 분리)

## 폴더

- `references/` — 디자인 레퍼런스(배포 제외, 수정하지 않음)
- `source-assets/` — 원본 복사본(용기 사진 5장, 크림 텍스처). 원본 폴더는 수정하지 않음
- `public/images/` — 웹용 파생본(`scripts/build-images.py`로 생성)
- `src/data/product.ts` — 제품 정보 단일 출처. 확정/기획자료/예시/미확정 상태를 구분

## 기술

Astro 7 (정적 HTML 출력, 페이지별 필요한 스크립트만 포함). 모션은 의존성 없이 직접 작성한 스크롤 유틸(`src/scripts/scroll.ts`).
폰트는 Pretendard·Cormorant Garamond(둘 다 OFL-1.1)를 npm 패키지로 자체 호스팅 — 외부 폰트 요청 없음.

## 구매 흐름 (기존 morh-website 저장소와 동일한 원칙)

구매하기 → 구매 신청 시트 → 제출 → 개인정보 처리 안내 동의 → 입력값 즉시 삭제 → `/result/`.
입력칸에 `name` 속성이 없어 값이 전송되지 않습니다. `id="cta-main"`, `lead-form`, `cta-submit` 유지.
**폼을 실제 수집 도구에 연결하거나 분석 도구를 붙이면 `src/components/PrivacyItems.astro` 문구를 반드시 다시 작성하세요.**

## Git

이 폴더는 Git 초기화하지 않았습니다. (상위 폴더 `/Users/hakyungsohn/Documents/GitHub` 가 원격 없는 Git 저장소이며, 이 폴더는 그 안에서 추적되지 않은 상태입니다.)
