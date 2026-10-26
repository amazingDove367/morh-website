import type { APIRoute } from 'astro';
import { LOCALES, LOCALE_META, localePath } from '../i18n/locales';

/* 운영 주소(PUBLIC_SITE_URL)와 검색 허용(PUBLIC_INDEXABLE=true)이 모두 있을 때만 주소 목록을 만듦 */
const PATHS = ['/', '/product/', '/privacy/'];
export const GET: APIRoute = () => {
  const site = (import.meta.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
  const on = site && import.meta.env.PUBLIC_INDEXABLE === 'true';
  const urls = on
    ? PATHS.flatMap((p) => LOCALES.map((l) => {
        const alts = LOCALES.map((a) => `<xhtml:link rel="alternate" hreflang="${LOCALE_META[a].html}" href="${site}${localePath(a, p)}"/>`).join('');
        return `<url><loc>${site}${localePath(l, p)}</loc>${alts}</url>`;
      }))
    : [];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('')}</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
