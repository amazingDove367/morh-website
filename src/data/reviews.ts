/**
 * 구매후기 데이터 (상세페이지의 구매후기 요약 · 구매후기 탭이 같은 목록을 사용)
 *
 * - `realReviews`: 실제 구매후기. 한 건이라도 들어오면 샘플 후기는 화면에서 빠집니다(섞지 않음).
 * - `SAMPLE_REVIEWS`: 실제 구매자가 아닌, 가상 사용 시나리오로 작성한 샘플 후기 10건(5점 8건, 4점 2건).
 *   화면에 '샘플 후기' 안내를 한 번 표시하고, 구조화 데이터(Review·AggregateRating)와 성과 지표에는 쓰지 않습니다.
 * - 후기 사진 자리는 제품·제형 사진입니다(고객 사진 아님, 화면에 명시). before/after 사진은 쓰지 않습니다.
 * - 효능·피부 변화를 단정하는 문장은 쓰지 않고 사용 경험(루틴·사용감·용기)만 다룹니다.
 */
import type { Locale } from '../i18n/locales';

export type ImageKey = 'front' | 'right' | 'back' | 'left' | 'top' | 'texture';
export type Tag = 'routine' | 'texture' | 'moisture' | 'package' | 'morning' | 'scent';
type Text = { title: string; body: string };

export interface Review {
  id: string;
  rating: number;
  author: Record<Locale, string>;
  skin: Record<Locale, string>;
  photos: ImageKey[];
  tags: Tag[];
  text: Record<Locale, Text>;
  sample: boolean;
}

const SKIN = {
  dry: { ko: '건성', en: 'Dry skin', ja: '乾燥肌', 'zh-cn': '干性肌肤', ar: 'بشرة جافة' },
  oily: { ko: '지성', en: 'Oily skin', ja: '脂性肌', 'zh-cn': '油性肌肤', ar: 'بشرة دهنية' },
  combo: { ko: '복합성', en: 'Combination skin', ja: '混合肌', 'zh-cn': '混合性肌肤', ar: 'بشرة مختلطة' },
  normal: { ko: '중성', en: 'Normal skin', ja: '普通肌', 'zh-cn': '中性肌肤', ar: 'بشرة عادية' },
  sensitive: { ko: '민감성', en: 'Sensitive skin', ja: '敏感肌', 'zh-cn': '敏感肌肤', ar: 'بشرة حساسة' },
};

const who = (ko: string, latin: string, ja: string, zh: string, arName: string) => ({ ko, en: latin, ja, 'zh-cn': zh, ar: arName });

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 's01', rating: 5, sample: true, photos: ['texture'], tags: ['texture', 'routine'],
    author: who('김*연', 'Y. Kim', 'Y. K.', '金*妍', 'ي. ك.'), skin: SKIN.combo,
    text: {
      ko: { title: '스킨케어 마지막 단계로 쓰기 편해요', body: '토너 다음에 바로 바르고 끝내는 순서가 단순해서 좋아요. 손등에 덜어 보면 부드럽게 퍼지는 편이에요.' },
      en: { title: 'Easy as the last step of my skincare', body: 'I like how simple it is to apply right after toner and be done. It spreads smoothly when I take some on the back of my hand.' },
      ja: { title: 'スキンケアの最後に使いやすいです', body: '化粧水のあとにすぐ塗って終わる流れがシンプルで気に入っています。手の甲に取るとなめらかにのびるタイプです。' },
      'zh-cn': { title: '作为护肤最后一步很方便', body: '爽肤水之后直接涂完就结束，步骤简单我很喜欢。取在手背上时很容易推开。' },
      ar: { title: 'سهل كآخر خطوة في روتيني', body: 'يعجبني أن أضعه بعد التونر مباشرة وأنتهي. يتوزع بنعومة عندما أضع قليلًا على ظهر يدي.' },
    },
  },
  {
    id: 's02', rating: 5, sample: true, photos: ['front', 'top'], tags: ['package'],
    author: who('박*라', 'R. Park', 'R. P.', '朴*拉', 'ر. ب.'), skin: SKIN.normal,
    text: {
      ko: { title: '뚜껑이 손에 잘 잡혀요', body: '둥근 뚜껑이라 아침에 급하게 열 때도 편해요. 골드 라인이 은은해서 화장대에 두기 좋아요.' },
      en: { title: 'The lid is easy to grip', body: 'The rounded lid is easy to open even when I am rushing in the morning. The subtle gold line looks nice on my vanity.' },
      ja: { title: 'ふたが手になじみます', body: '丸いふたなので、朝急いで開けるときも楽です。控えめなゴールドのラインがドレッサーに置いても素敵です。' },
      'zh-cn': { title: '瓶盖很好拿', body: '圆圆的瓶盖，早上匆忙时也很好打开。低调的金色线条放在梳妆台上很好看。' },
      ar: { title: 'الغطاء سهل الإمساك', body: 'الغطاء المستدير سهل الفتح حتى عندما أكون مستعجلة صباحًا. الخط الذهبي الهادئ يبدو جميلًا على طاولة الزينة.' },
    },
  },
  {
    id: 's03', rating: 5, sample: true, photos: [], tags: ['morning', 'routine'],
    author: who('이*은', 'E. Lee', 'E. L.', '李*恩', 'إ. ل.'), skin: SKIN.oily,
    text: {
      ko: { title: '아침 준비 순서가 정리됐어요', body: '크림 바르고 선크림, 쿠션 한 겹으로 끝내는 순서를 지키는 중이에요. 아침이 덜 복잡해졌어요.' },
      en: { title: 'My morning order feels tidier', body: 'I am sticking to cream, sunscreen and one layer of cushion. My mornings feel less complicated.' },
      ja: { title: '朝の支度の順番が整いました', body: 'クリーム、日焼け止め、クッションファンデ一層で終える順番を続けています。朝がすっきりしました。' },
      'zh-cn': { title: '早上的准备顺序变清楚了', body: '我一直坚持面霜、防晒、一层气垫的顺序，早上没那么复杂了。' },
      ar: { title: 'ترتيب صباحي أوضح', body: 'ألتزم بترتيب الكريم ثم واقي الشمس ثم طبقة كوشن واحدة. أصبح صباحي أقل تعقيدًا.' },
    },
  },
  {
    id: 's04', rating: 4, sample: true, photos: ['back'], tags: ['moisture'],
    author: who('최*희', 'H. Choi', 'H. C.', '崔*熙', 'ه. ت.'), skin: SKIN.dry,
    text: {
      ko: { title: '건성이라 양 조절이 필요했어요', body: '건조한 날에는 조금 더 덜어 쓰고 있어요. 피부마다 다를 수 있으니 소량부터 써 보세요.' },
      en: { title: 'Dry skin, so I adjust the amount', body: 'On dry days I use a little more. Everyone’s skin is different, so start with a small amount.' },
      ja: { title: '乾燥肌なので量を調整しています', body: '乾燥する日は少し多めに使っています。肌によって違うので、少量から試してみてください。' },
      'zh-cn': { title: '干皮需要调整用量', body: '干燥的日子我会多取一点。每个人肤质不同，建议先少量试用。' },
      ar: { title: 'بشرتي جافة فأعدّل الكمية', body: 'في الأيام الجافة أستخدم كمية أكبر قليلًا. البشرة تختلف من شخص لآخر، فابدئي بكمية صغيرة.' },
    },
  },
  {
    id: 's05', rating: 5, sample: true, photos: ['texture', 'front'], tags: ['texture', 'moisture'],
    author: who('정*민', 'M. Jung', 'M. J.', '郑*敏', 'م. ج.'), skin: SKIN.combo,
    text: {
      ko: { title: '발림이 부드러운 편이에요', body: '얇게 펴 바르기 좋아서 바른 뒤 바로 다음 단계로 넘어가요. 촉촉한 느낌이 좋아요.' },
      en: { title: 'Spreads softly', body: 'It is easy to apply in a thin layer, so I can move to the next step right away. I like the moist feel.' },
      ja: { title: 'のびがやわらかいです', body: '薄くのばしやすいので、塗ったあとすぐ次のステップに進めます。しっとりした感触が好きです。' },
      'zh-cn': { title: '涂抹很顺滑', body: '很容易薄薄涂开，涂完马上就能进行下一步。喜欢它的滋润感。' },
      ar: { title: 'يتوزع بنعومة', body: 'سهل التوزيع بطبقة رقيقة، فأنتقل إلى الخطوة التالية مباشرة. أحب الإحساس بالترطيب.' },
    },
  },
  {
    id: 's06', rating: 5, sample: true, photos: [], tags: ['routine'],
    author: who('한*진', 'J. Han', 'J. H.', '韩*珍', 'ج. ه.'), skin: SKIN.normal,
    text: {
      ko: { title: '매일 바르는 습관을 만드는 중', body: '세면대 옆에 두고 아침저녁으로 챙기고 있어요. 14일 루틴이라는 말이 꾸준히 쓰게 해 줘요.' },
      en: { title: 'Building a daily habit', body: 'I keep it next to the sink and use it morning and night. The idea of a 14-day ritual keeps me consistent.' },
      ja: { title: '毎日塗る習慣をつくっています', body: '洗面台の横に置いて朝晩使っています。14日間のルーティンという言葉が続けるきっかけになっています。' },
      'zh-cn': { title: '正在养成每天涂的习惯', body: '放在洗手台旁边，早晚都会用。“14天护肤仪式”这个说法让我坚持了下来。' },
      ar: { title: 'أبني عادة يومية', body: 'أضعه بجانب المغسلة وأستخدمه صباحًا ومساءً. فكرة روتين الأربعة عشر يومًا تساعدني على الاستمرار.' },
    },
  },
  {
    id: 's07', rating: 5, sample: true, photos: ['left'], tags: ['package', 'routine'],
    author: who('윤*서', 'S. Yoon', 'S. Y.', '尹*书', 'س. ي.'), skin: SKIN.sensitive,
    text: {
      ko: { title: '용기가 낮아서 자리 차지가 적어요', body: '낮은 원통형이라 좁은 선반에도 잘 들어가요. 저녁 루틴 마지막에 꺼내기 편해요.' },
      en: { title: 'The low jar takes up little space', body: 'The low cylinder fits on a narrow shelf. It is easy to reach at the end of my evening routine.' },
      ja: { title: '容器が低くて場所を取りません', body: '低い円筒形なので狭い棚にも収まります。夜のルーティンの最後に取り出しやすいです。' },
      'zh-cn': { title: '瓶身矮，不占地方', body: '低矮的圆柱形，窄架子上也放得下。晚间护肤最后一步拿起来很方便。' },
      ar: { title: 'البرطمان منخفض ولا يأخذ مساحة', body: 'الشكل الأسطواني المنخفض يناسب الرف الضيق، وسهل الوصول إليه في آخر روتين المساء.' },
    },
  },
  {
    id: 's08', rating: 4, sample: true, photos: [], tags: ['scent', 'texture'],
    author: who('오*아', 'A. Oh', 'A. O.', '吴*雅', 'أ. أ.'), skin: SKIN.oily,
    text: {
      ko: { title: '향은 개인차가 있을 것 같아요', body: '저는 무난했지만 향에 민감하면 먼저 확인해 보면 좋겠어요. 사용감은 가벼운 편이에요.' },
      en: { title: 'Scent may be personal', body: 'It was fine for me, but if you are sensitive to scent you may want to check it first. It feels light to use.' },
      ja: { title: '香りは好みが分かれそうです', body: '私は気になりませんでしたが、香りに敏感な方は先に確かめるといいと思います。使用感は軽めです。' },
      'zh-cn': { title: '香味可能因人而异', body: '我觉得还可以，但对香味敏感的话最好先确认一下。用起来比较轻薄。' },
      ar: { title: 'الرائحة مسألة ذوق', body: 'كانت مناسبة لي، لكن إن كنتِ حساسة للروائح فمن الأفضل تجربتها أولًا. الإحساس عند الاستخدام خفيف.' },
    },
  },
  {
    id: 's09', rating: 5, sample: true, photos: ['right', 'texture'], tags: ['morning', 'texture'],
    author: who('서*윤', 'Y. Seo', 'Y. S.', '徐*允', 'ي. س.'), skin: SKIN.combo,
    text: {
      ko: { title: '선크림 전에 바르기 좋아요', body: '바른 뒤 잠깐 두었다가 선크림을 올리면 밀리지 않고 잘 올라가는 편이었어요.' },
      en: { title: 'Works well before sunscreen', body: 'If I wait a moment after applying, my sunscreen goes on without pilling.' },
      ja: { title: '日焼け止めの前に使いやすいです', body: '塗ったあと少し置いてから日焼け止めを重ねると、よれずにのってくれました。' },
      'zh-cn': { title: '适合在防晒前使用', body: '涂完稍等一会儿再上防晒，不容易搓泥。' },
      ar: { title: 'مناسب قبل واقي الشمس', body: 'إذا انتظرتُ قليلًا بعد وضعه، يُوضع واقي الشمس فوقه دون أن يتكتل.' },
    },
  },
  {
    id: 's10', rating: 5, sample: true, photos: [], tags: ['routine', 'moisture'],
    author: who('강*비', 'B. Kang', 'B. K.', '姜*碧', 'ب. ك.'), skin: SKIN.dry,
    text: {
      ko: { title: '저녁 루틴이 차분해졌어요', body: '자기 전에 마지막으로 바르는 시간이 하루를 정리하는 느낌이에요. 촉촉하게 마무리되는 점이 좋아요.' },
      en: { title: 'My evening routine feels calmer', body: 'Applying it last before bed feels like wrapping up the day. I like that it finishes with a moist feel.' },
      ja: { title: '夜のルーティンが落ち着きました', body: '寝る前に最後に塗る時間が、一日を締めくくるように感じます。しっとり仕上がるところが好きです。' },
      'zh-cn': { title: '晚间护肤变得从容了', body: '睡前最后涂上它，感觉像是在为一天收尾。喜欢它滋润的收尾感。' },
      ar: { title: 'روتين المساء أصبح أهدأ', body: 'وضعه في النهاية قبل النوم يشبه اختتام اليوم. يعجبني أنه ينتهي بإحساس مرطب.' },
    },
  },
];

/** 실제 구매후기 (연동 전까지 비어 있음) */
export const realReviews: Review[] = [];

/** 화면에 쓸 후기 목록: 실제 후기가 있으면 실제 후기만, 없으면 샘플 후기 */
export const defaultReviews: Review[] = realReviews.length ? realReviews : SAMPLE_REVIEWS;

export const PAGE_SIZE = 5;

export interface ReviewSummary {
  count: number;
  average: number;
  sample: boolean;
  photoReviews: Review[];
  tags: { tag: Tag; count: number }[];
}

/** 평균·개수·포토 후기·주제 태그 집계 — 모두 같은 목록에서 계산(화면에 고정값을 쓰지 않음) */
export function summarize(list: Review[]): ReviewSummary {
  const count = list.length;
  const average = count ? list.reduce((s, r) => s + r.rating, 0) / count : 0;
  const tally = new Map<Tag, number>();
  list.forEach((r) => r.tags.forEach((t) => tally.set(t, (tally.get(t) ?? 0) + 1)));
  const tags = [...tally.entries()].map(([tag, c]) => ({ tag, count: c })).sort((a, b) => b.count - a.count);
  return { count, average, sample: list.some((r) => r.sample), photoReviews: list.filter((r) => r.photos.length), tags };
}

export const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

/** 후기 사진 경로 (제품 사진 400·800px, 크림 제형 사진은 원본 420px) */
export const reviewImage = (k: ImageKey, size: 'thumb' | 'full') =>
  k === 'texture' ? '/images/cream-texture-420.webp' : `/images/morh-${k}-${size === 'thumb' ? 400 : 800}.webp`;
