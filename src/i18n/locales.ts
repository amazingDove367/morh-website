/**
 * 지원 언어와 URL 규칙
 * - 한국어는 기본 언어로 접두어 없이 '/', 나머지는 '/en/', '/ja/', '/zh-cn/', '/ar/'
 * - 언어 선택 상태는 URL 로만 관리(쿠키·자동 이동 없음) → 직접 링크로 같은 언어 화면에 접근 가능
 * - 중국어는 간체(zh-Hans, 중국 대륙 표기) 기준
 * - 언어가 바뀌어도 통화(KRW)·판매 국가(대한민국)·배송 지역은 바뀌지 않음
 */
export const LOCALES = ['ko', 'en', 'ja', 'zh-cn', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'ko';

export const LOCALE_META: Record<Locale, { label: string; short: string; html: string; dir: 'ltr' | 'rtl'; intl: string; og: string }> = {
  ko: { label: '한국어', short: 'KO', html: 'ko', dir: 'ltr', intl: 'ko-KR', og: 'ko_KR' },
  en: { label: 'English', short: 'EN', html: 'en', dir: 'ltr', intl: 'en-US', og: 'en_US' },
  ja: { label: '日本語', short: 'JA', html: 'ja', dir: 'ltr', intl: 'ja-JP', og: 'ja_JP' },
  'zh-cn': { label: '简体中文', short: '中文', html: 'zh-Hans', dir: 'ltr', intl: 'zh-CN', og: 'zh_CN' },
  // 숫자는 서양식 숫자(latn)로 표기해 가격·수량을 다른 언어와 같은 모양으로 유지
  ar: { label: 'العربية', short: 'AR', html: 'ar', dir: 'rtl', intl: 'ar-u-nu-latn', og: 'ar_AR' },
};

/** 배포 기준 경로(예: GitHub Pages 프로젝트 사이트의 /morh-website/)를 붙인 내부 주소 */
export function withBase(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** 언어별 페이지 주소. path 는 언어 접두어 없는 경로('/', '/product/') */
export function localePath(locale: Locale, path = '/') {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`;
  return withBase(`${prefix}${path}`);
}

/** [...locale] 동적 경로용 */
export function localeStaticPaths() {
  return LOCALES.map((locale) => ({ params: { locale: locale === DEFAULT_LOCALE ? undefined : locale }, props: { locale } }));
}

export function isLocale(v: string | undefined): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}
