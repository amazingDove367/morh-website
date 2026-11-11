/**
 * 전환 기록 → 구글 Apps Script 웹 앱(시트에 한 줄씩 쌓임)
 * - 1차 전환: 결제하기(add_payment_info) → sendLeadLog('purchase', { value, set, qty })
 * - 2차 전환: 출시 알림 신청 완료(generate_lead) → sendLeadLog('lead')
 * - 보내는 값: 전환 종류·페이지·UTM 4개·유입 경로, 결제일 때 금액·구성·수량
 *   이름·이메일 등 폼 입력값은 보내지 않음
 * - 광고로 들어온 첫 화면의 UTM 을 세션 동안 기억(상품 → 결제 → 완료로 페이지가 바뀌어도 유지)
 * - 로컬·미리보기·?ga_debug=1 에서 보낸 줄은 test=1 로 표시(시트 '테스트' 칸)
 */
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzWUonBEpKBe4WjNip_6coT_aHAz26TL-Gyab0RCodQFD0Hsd8CMtIAcW5sxW_YDFIm/exec';
const KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
const STORE = 'lead_utm';

export type LeadType = 'purchase' | 'lead';
interface Extra { value?: number; set?: string; qty?: number }

/** 모든 페이지에서 호출: 주소에 UTM 이 있으면 세션에 저장 */
export function rememberUtm() {
  try {
    const q = new URLSearchParams(location.search);
    if (KEYS.some((k) => q.get(k))) sessionStorage.setItem(STORE, q.toString());
  } catch { /* 저장소를 쓸 수 없으면 이번 페이지 주소만 사용 */ }
}

const isTest = () =>
  !location.hostname.endsWith('github.io') || new URLSearchParams(location.search).get('ga_debug') === '1';

/** 전환 순간 한 번 호출. 페이지가 바로 넘어가도 끊기지 않게 sendBeacon 사용 */
export function sendLeadLog(type: LeadType, extra: Extra = {}) {
  try {
    // 리드는 세션당 한 번만(GA4 generate_lead 와 같은 기준). 결제는 누를 때마다 기록
    if (type === 'lead') {
      try {
        if (sessionStorage.getItem('leadlog:lead')) return;
        sessionStorage.setItem('leadlog:lead', '1');
      } catch { /* 저장소를 쓸 수 없으면 그대로 1회 전송 */ }
    }
    let stored = '';
    try { stored = sessionStorage.getItem(STORE) || ''; } catch { /* 무시 */ }
    const saved = new URLSearchParams(stored || location.search);
    const p = new URLSearchParams();
    p.set('type', type);
    p.set('page', location.pathname);
    KEYS.forEach((k) => p.set(k, saved.get(k) || ''));
    p.set('ref', (document.referrer || '').slice(0, 200));
    if (extra.value != null) p.set('value', String(extra.value));
    if (extra.set) p.set('set', extra.set);
    if (extra.qty != null) p.set('qty', String(extra.qty));
    if (isTest()) p.set('test', '1');
    const url = `${WEBAPP_URL}?${p.toString()}`;
    if (!(navigator.sendBeacon && navigator.sendBeacon(url))) {
      fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true }).catch(() => {});
    }
  } catch { /* 기록 실패가 화면 동작을 막지 않음 */ }
}
