import type { APIRoute } from 'astro';
import { withBase } from '../i18n/locales';

/* 검색 노출은 PUBLIC_INDEXABLE=true 인 운영 배포에서만 허용(미리보기·샘플 데이터 노출 방지) */
export const GET: APIRoute = () => {
  const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true';
  const site = (import.meta.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const lines = indexable
    ? ['User-agent: *', 'Allow: /', `Disallow: ${withBase('/checkout/')}`, `Disallow: ${withBase('/qa/')}`, ...(site ? [`Sitemap: ${site}${withBase('/sitemap.xml')}`] : [])]
    : ['User-agent: *', 'Disallow: /'];
  return new Response(lines.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
