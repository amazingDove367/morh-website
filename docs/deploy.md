# 배포 (GitHub Pages)

공개 주소: https://amazingdove367.github.io/morh-website/

## 어떻게 배포되나

1. `main` 브랜치에 커밋이 들어오면(보통 develop → main Pull Request 병합) GitHub Actions 가 자동으로 실행됩니다.
2. 배포 작업 파일 `.github/workflows/deploy.yml` 이 `npm ci` → `npm run build` 로 사이트를 만들고, 결과 폴더 `dist/` 를 Pages 에 올립니다.
3. 진행 상황은 저장소의 **Actions** 탭 → *Deploy to GitHub Pages* 에서 볼 수 있습니다. 수동 재실행은 같은 화면의 **Run workflow**.

### 왜 이 파일이 필요한가

V1(강사님 버전)은 HTML 파일을 그대로 공개하는 방식이라 main 의 파일이 곧 사이트였습니다.
V2 는 Astro 로 만든 사이트라 소스 파일을 **빌드(변환)** 해야 브라우저가 읽는 HTML 이 생깁니다.
그래서 GitHub 가 대신 빌드하고 그 결과를 공개하도록 지시하는 파일(워크플로)이 필요합니다.

## 저장소 설정 (한 번만)

- **Settings → Pages → Build and deployment → Source: `GitHub Actions`**
  - 기존 값 `Deploy from a branch` 는 main 의 파일을 그대로 공개하는 방식(V1 용)입니다.
  - `GitHub Actions` 로 바꾸면 위 워크플로가 만든 결과물만 공개합니다. (2026-10-27 변경 완료)
- 선택: **Settings → Secrets and variables → Actions → Variables**
  - `PUBLIC_INDEXABLE` = `true` → 검색 노출 허용. 없거나 `false` 면 모든 페이지 noindex(현재 기본값, 샘플 후기·미확정 정보가 있는 동안 유지 권장)
  - `PUBLIC_GA4_ID` → 측정 ID를 바꿀 때만 사용. 기본값 `G-D3ENJ9B8P7` 이 워크플로에 들어가 있어 변수가 없어도 GA4로 전송되고, 개인정보 안내 문구도 자동으로 '사용 중'으로 바뀜
  - `PUBLIC_GTM_ID` → GTM 컨테이너 ID를 바꿀 때만 사용. 기본값 `GTM-5DQWMNL6`
  - `PUBLIC_META_PIXEL_ID` → Meta 픽셀 ID를 바꿀 때만 사용. 기본값 `1405548278234602`

## 워크플로에서 고정한 값

| 값 | 설정 | 이유 |
|---|---|---|
| `BASE_PATH` | `/morh-website/` | 프로젝트 사이트는 도메인 아래 `/morh-website/` 경로에서 열림 |
| `PUBLIC_SITE_URL` | `https://amazingdove367.github.io` | canonical·hreflang 의 전체 주소 |
| Node | 22 | Astro 7 요구 사항(22.12 이상) |

## 참고

- `robots.txt` 는 `/morh-website/robots.txt` 에 생기는데, 검색엔진은 도메인 최상위의 robots.txt 만 읽습니다. 그래서 검색 차단은 각 페이지의 `noindex` 메타 태그로 합니다.
- V1 의 `result.html` 같은 이전 주소는 V2 에 없습니다(404 페이지로 안내).
