// @ts-check
import { defineConfig } from 'astro/config';

// 운영 주소가 확정되면 site 를 지정하고 canonical·sitemap·robots 를 설정합니다(현재 미확정).
export default defineConfig({
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
});
