/**
 * 광고별 상세 설명 첫 화면: 광고 링크의 utm_content 로 어떤 광고에서 왔는지 세션 동안 기억
 * - 값에 elevator · roblox · wanted 가 들어 있으면 그 광고 (예: utm_content=morh_wanted_reels)
 * - 처음 들어온 페이지가 홈이어도 상품 페이지에서 같은 첫 화면을 보여 주도록 sessionStorage 에 저장
 * - 개인정보 아님. GA4 는 utm 값을 자체 수집(세션 수동 광고 콘텐츠)하므로 별도 이벤트 없음
 */
export const ADS = ['elevator', 'roblox', 'wanted'] as const;
export type Ad = (typeof ADS)[number];
const KEY = 'morh:ad';

export function rememberAd() {
  const v = (new URLSearchParams(location.search).get('utm_content') || '').toLowerCase();
  const ad = ADS.find((a) => v.includes(a));
  if (!ad) return;
  try { sessionStorage.setItem(KEY, ad); } catch { /* 저장소를 쓸 수 없으면 이번 페이지에서만 */ }
}

export function currentAd(): Ad | null {
  const v = (new URLSearchParams(location.search).get('utm_content') || '').toLowerCase();
  const fromUrl = ADS.find((a) => v.includes(a));
  if (fromUrl) return fromUrl;
  try {
    const saved = sessionStorage.getItem(KEY);
    return (ADS as readonly string[]).includes(saved || '') ? (saved as Ad) : null;
  } catch { return null; }
}
