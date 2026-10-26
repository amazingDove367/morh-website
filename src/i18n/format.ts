/** 숫자·금액 표기 (클라이언트 스크립트에서도 쓰므로 사전 파일을 불러오지 않음) */
import { LOCALE_META, type Locale } from './locales';

/** '{a}', '{n}' 자리표시자 채우기 */
export const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? `{${k}}`));

/** 원화 금액. 한국어는 '35,000원', 그 밖의 언어는 각 언어의 원화(KRW) 표기 */
export function money(locale: Locale, n: number) {
  if (locale === 'ko') return `${n.toLocaleString('ko-KR')}원`;
  return new Intl.NumberFormat(LOCALE_META[locale].intl, { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(n);
}

export const num = (locale: Locale, n: number, digits = 0) =>
  new Intl.NumberFormat(LOCALE_META[locale].intl, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
