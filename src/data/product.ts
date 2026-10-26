/**
 * 제품 사진 목록 (문구는 src/i18n/dict 에서, 가격·용량은 src/data/commerce.ts 에서 관리)
 * 정면·좌측면·우측면·뒷면·항공샷 5장은 사용자 제공 '최종' 용기 사진의 웹용 파생본입니다.
 */
export const VIEW_KEYS = ['front', 'right', 'back', 'left', 'top'] as const;
export type ViewKey = (typeof VIEW_KEYS)[number];

export const viewImg = (key: ViewKey, w: 400 | 800 | 1254 | 'thumb' = 800) => `/images/morh-${key}-${w}.webp`;
export const viewSrcset = (key: ViewKey, withBase: (p: string) => string) =>
  [400, 800, 1254].map((w) => `${withBase(viewImg(key, w as 400))} ${w}w`).join(', ');
