// @ts-check
import { defineConfig } from 'astro/config';

// 하위 경로 배포(예: GitHub Pages 프로젝트 사이트 /morh-website/)는 BASE_PATH 로 지정합니다. 기본 '/'.
// 운영 주소는 PUBLIC_SITE_URL(.env)로 지정하며, 없으면 canonical·hreflang·sitemap 을 만들지 않습니다.
const env = /** @type {{ process?: { env: Record<string, string | undefined> } }} */ (globalThis).process?.env ?? {};

export default defineConfig({
  base: env.BASE_PATH || '/',
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  // 이전 프로토타입 주소 → 새 주소
  redirects: {
    '/prototype/product-a/': '/product/',
    '/result/': '/checkout/complete/',
  },
});
