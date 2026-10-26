/**
 * MORH 제품 정보 단일 출처.
 *
 * status
 *  - 'confirmed' : 사진·기존 프로젝트에서 직접 확인한 사실
 *  - 'plan'      : 노션 기획 문서의 포트폴리오 설정 (증빙·시험 조건 미확인) → 화면에 '기획자료' 표시
 *  - 'sample'    : 사용자 요청으로 만든 예시 값(가격·후기·평점) → 화면에 '예시' 표시, 구조화 데이터 제외
 *  - 'tbd'       : 미확정 → 화면에 '미확정' 표시
 */
export type Status = 'confirmed' | 'plan' | 'sample' | 'tbd';

export const brand = {
  name: 'MORH',
  nameKo: '모르',
} as const;

export const product = {
  // 기존 MORH 프로젝트 index.html <h1> 기준
  name: '모르 브라이트닝 크림',
  fullName: 'MORH 모르 브라이트닝 크림',
  category: '미백 크림', // 기존 프로젝트 <title> "MORH 모르 미백크림"
  slug: 'brightening-cream',
  price: { value: 38000, status: 'sample' as Status },
  volume: { value: null, status: 'tbd' as Status },
  maxQty: 5,
} as const;

/** 노션 Day 10·11·14 카피 (브랜드명 '하이디' → 'MORH/모르'로만 치환, 문장은 원문 유지) */
export const copy = {
  tagline: '컨실러로 한 겹 더 가리지 않아도, 내 피부가 마음에 드는 아침.',
  strategy: '나이아신아마이드는 최대치로, 촉촉함은 요거트처럼.',
  social: '더 하얗게 가리기보다, 매일 크림으로 피부 톤을 가꾸는 미백.',
  focus: '유행보다 핵심에 집중한 미백 크림.',
  // 랜딩 배너 보조 문장 (상세·공식 영역은 '허용 최대치' 표기)
  support: '나이아신아마이드 허용 최대치와 크리미 요거트 보습막으로 피부 톤과 촉촉함을 매일 가꿉니다.',
  ctaPrimary: '제품 자세히 보기',
  ctaProduct: '모르 미백 크림 보기',
} as const;

/** 사진으로 확인한 용기 외형 — 재질·용량은 단정하지 않음 */
export const views = [
  { key: 'front', label: '정면', alt: '모르 브라이트닝 크림 정면. 둥글게 부푼 아이보리 뚜껑과 버건디 MORH 로고가 있는 낮은 원통형 용기', note: '몸체 중앙의 버건디 MORH 로고' },
  { key: 'left', label: '좌측면', alt: '모르 브라이트닝 크림 좌측면. 몸체 양 끝에 로고 일부가 보이는 원통형 용기', note: '서리 낀 듯 반투명한 크림색 몸체' },
  { key: 'right', label: '우측면', alt: '모르 브라이트닝 크림 우측면. 뚜껑과 몸체 사이 얇은 골드색 경계가 보이는 용기', note: '뚜껑과 몸체 사이 얇은 골드색 경계' },
  { key: 'back', label: '뒷면', alt: '모르 브라이트닝 크림 뒷면. 몸체 중앙에 버건디 01 표기', note: '뒷면 중앙의 01 표기' },
  { key: 'top', label: '항공샷', alt: '위에서 내려다본 모르 브라이트닝 크림. 둥근 아이보리 뚜껑 윗면', note: '위에서 본 둥근 뚜껑의 곡률' },
] as const;

export type ViewKey = (typeof views)[number]['key'];

export const img = (key: ViewKey | 'texture', w: 400 | 800 | 1254 | 'thumb' = 800) =>
  key === 'texture' ? '/images/cream-texture-420.webp' : `/images/morh-${key}-${w}.webp`;

export const srcset = (key: ViewKey) =>
  `/images/morh-${key}-400.webp 400w, /images/morh-${key}-800.webp 800w, /images/morh-${key}-1254.webp 1254w`;

/** 노션 기획 설정: 증빙·처방 확인 전 → 'plan' */
export const features = [
  {
    title: '핵심 성분 집중',
    body: '유행 성분의 개수보다, 나이아신아마이드 허용 최대치에 집중한 미백 크림입니다.',
    status: 'plan' as Status,
  },
  {
    title: '요거트 보습 설계',
    body: '미백은 건조할까 걱정됐다면, 크리미 요거트 보습막으로 촉촉함을 더합니다.',
    status: 'plan' as Status,
  },
  {
    title: '완제품 결과 확인',
    body: '완제품 시험 결과는 시험 기관·조건과 함께 상세페이지에서 안내합니다.',
    status: 'tbd' as Status,
  },
] as const;

/** 사용자 요청에 따른 예시 후기 — 실제 구매자 후기 아님. 효능 단정 표현 배제. */
export const sampleReviews = [
  { id: 'r1', rating: 5, author: '김*연', skin: '수분 부족 지성', date: '예시', title: '아침 루틴 마지막 단계로 정착했어요', body: '스킨케어 마지막에 바르고 톤업 선크림으로 넘어가는 순서로 쓰고 있어요. 용기가 낮고 둥글어서 화장대에서 자리를 많이 차지하지 않아요.', photo: 'left' as ViewKey },
  { id: 'r2', rating: 5, author: '박*라', skin: '복합성', date: '예시', title: '뚜껑이 손에 잘 잡혀요', body: '둥글게 부푼 뚜껑이라 아침에 급하게 열 때도 편해요. 골드 라인이 은은해서 사진보다 실물이 더 차분해 보여요.', photo: 'top' as ViewKey },
  { id: 'r3', rating: 4, author: '이*은', skin: '건성', date: '예시', title: '건조할까 걱정했는데 저는 무난했어요', body: '미백 크림은 건조하다는 인상이 있어서 걱정했는데 저한테는 무난했어요. 피부마다 다를 수 있으니 소량부터 써 보세요.', photo: null },
  { id: 'r4', rating: 4, author: '최*희', skin: '중성', date: '예시', title: '2주째, 더 써 보고 다시 남길게요', body: '아직 2주째라 변화를 말하기는 이르고, 매일 바르는 습관을 만드는 중이에요. 뒷면 01 표기가 귀여워요.', photo: 'back' as ViewKey },
] as const;

export const sampleRating = {
  average: sampleReviews.reduce((s, r) => s + r.rating, 0) / sampleReviews.length,
  count: sampleReviews.length,
};

export const formatKRW = (n: number) => `${n.toLocaleString('ko-KR')}원`;
