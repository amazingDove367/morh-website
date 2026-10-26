/**
 * 구매후기 데이터와 요약 계산 (상세페이지 구매후기 요약 · 구매후기 탭이 같은 값을 사용)
 *
 * - 실제 구매후기는 `realReviews` 에 넣습니다. 한 건이라도 있으면 예시 후기는 화면에서 빠집니다(섞지 않음).
 * - 현재 실제 후기는 없고, 1단계에서 사용자 요청으로 만든 예시 후기(sampleReviews)만 있습니다 → 화면에 '예시' 표시.
 * - 요약은 AI 가 아니라 아래 키워드 사전으로 후기 문장을 세어 만든 집계입니다. 대표 문장은 후기 원문을 그대로 인용합니다.
 */
import { sampleReviews, type ViewKey } from './product';

export interface Review {
  id: string;
  rating: number;
  author: string;
  skin: string;
  title: string;
  body: string;
  /** 후기 사진. 예시 후기는 고객 사진이 없어 제품 사진을 씀(화면에 명시) */
  photo: { src: string; thumb: string; alt: string; width: number; height: number } | null;
  sample: boolean;
}

const fromSample = (r: (typeof sampleReviews)[number]): Review => ({
  id: r.id, rating: r.rating, author: r.author, skin: r.skin, title: r.title, body: r.body, sample: true,
  photo: r.photo
    ? { src: `/images/morh-${r.photo as ViewKey}-800.webp`, thumb: `/images/morh-${r.photo as ViewKey}-400.webp`, alt: '예시 후기 이미지 — 고객 사진이 아닌 제품 사진', width: 800, height: 800 }
    : null,
});

/** 실제 구매후기 (연동 전까지 비어 있음) */
export const realReviews: Review[] = [];

/** 화면에 쓸 후기 목록: 실제 후기가 있으면 실제 후기만, 없으면 예시 후기 */
export const defaultReviews: Review[] = realReviews.length ? realReviews : sampleReviews.map(fromSample);

/** 후기에서 셀 키워드 (효능·시험 결과로 읽힐 수 있는 표현은 사전에 넣지 않음) */
const KEYWORDS: { label: string; words: string[] }[] = [
  { label: '용기·디자인', words: ['용기', '뚜껑', '골드', '표기', '실물', '화장대'] },
  { label: '사용 루틴', words: ['루틴', '순서', '마지막', '습관', '매일', '아침'] },
  { label: '보습감', words: ['건조', '촉촉'] },
  { label: '사용 기간', words: ['2주', '주째'] },
];

export interface ReviewSummary {
  count: number;
  average: number;
  sample: boolean;
  photos: Review[];
  dist: { stars: number; count: number }[];
  insight: null | {
    headline: string;
    lines: string[];
    tags: { label: string; count: number }[];
  };
}

/** 후기 문장에서 키워드가 들어 있는 짧은 구절(쉼표·마침표 기준 한 문장)을 원문 그대로 찾음 */
function quote(r: Review, words: string[]) {
  const sentences = `${r.title}. ${r.body}`.split(/(?<=[.!?요])\s+/);
  const s = sentences.find((x) => words.some((w) => x.includes(w)));
  return s ? s.replace(/\s+/g, ' ').trim() : '';
}

export function summarize(list: Review[]): ReviewSummary {
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: list.filter((r) => r.rating === stars).length }));
  const photos = list.filter((r) => r.photo);
  let insight: ReviewSummary['insight'] = null;
  if (count) {
    const tags = KEYWORDS.map((k) => ({
      label: k.label,
      words: k.words,
      hits: list.filter((r) => k.words.some((w) => `${r.title} ${r.body}`.includes(w))),
    }))
      .filter((t) => t.hits.length > 0)
      .sort((a, b) => b.hits.length - a.hits.length);
    if (tags.length) {
      const [a, b] = tags;
      const headline = b
        ? `후기에서 가장 자주 언급된 내용은 '${a.label}'(${a.hits.length}건)과 '${b.label}'(${b.hits.length}건)입니다.`
        : `후기에서 가장 자주 언급된 내용은 '${a.label}'(${a.hits.length}건)입니다.`;
      const lines = tags.slice(0, 3).map((t) => {
        const q = quote(t.hits[0], t.words);
        return `${t.label} ${t.hits.length}건${q ? ` — “${q}”` : ''}`;
      });
      insight = { headline, lines, tags: tags.map((t) => ({ label: t.label, count: t.hits.length })) };
    }
  }
  return { count, average, sample: list.some((r) => r.sample), photos, dist, insight };
}

export const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
