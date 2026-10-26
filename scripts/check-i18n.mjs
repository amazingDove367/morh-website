// 다국어 누락 점검: 빌드 결과(dist)의 비한국어 페이지에 한글이 남아 있는지, lang·dir 이 맞는지 확인
// node scripts/check-i18n.mjs  (npm run build 후)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const LOCALES = { en: ['en', 'ltr'], ja: ['ja', 'ltr'], 'zh-cn': ['zh-Hans', 'ltr'], ar: ['ar', 'rtl'] };
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : f.endsWith('.html') ? [join(d, f)] : []));
let problems = 0, pages = 0;
for (const [loc, [lang, dir]] of Object.entries(LOCALES)) {
  for (const file of walk(join(DIST, loc))) {
    pages++;
    const html = readFileSync(file, 'utf8');
    if (!html.includes(`<html lang="${lang}" dir="${dir}"`)) { problems++; console.log(`✗ lang/dir: ${file}`); }
    // 사용자에게 보이는 글자와 접근성 이름만(스크립트·스타일·주석 제외). 언어 선택 메뉴의 '한국어'는 허용
    const visible = html
      .replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<a [^>]*lang="ko"[^>]*>[\s\S]*?<\/a>/g, '');
    const attrs = [...html.matchAll(/(?:alt|aria-label|title|content|placeholder)="([^"]*)"/g)].map((m) => m[1]);
    const scripts = [...html.matchAll(/data-(?:strings|lb-data)[^>]*?>?([^<]*)/g)].map((m) => m[1]);
    const hits = [...visible.matchAll(/[가-힣]+/g)].map((m) => m[0])
      .concat(attrs.filter((a) => /[가-힣]/.test(a)))
      .concat(scripts.filter((a) => /[가-힣]/.test(a)));
    // 샘플 후기 작성자 표기(예: 김*연)는 한국어 이름이 아니라 각 언어 표기로 바꿨으므로 허용 목록 없음
    if (hits.length) { problems++; console.log(`✗ 한글 ${hits.length}곳: ${file.replace(DIST, '')} → ${[...new Set(hits)].slice(0, 6).join(' / ')}`); }
  }
}
console.log(problems ? `\n문제 ${problems}건 / 페이지 ${pages}개` : `✓ 비한국어 페이지 ${pages}개에서 한글 누락 없음, lang·dir 정상`);
process.exit(problems ? 1 : 0);
