/**
 * 구매후기 데이터 (상세페이지의 구매후기 요약 · 구매후기 탭이 같은 목록을 사용)
 *
 * - `realReviews`: 실제 구매후기. 한 건이라도 들어오면 샘플 후기는 화면에서 빠집니다(섞지 않음).
 * - `SAMPLE_REVIEWS`: 실제 구매자가 아닌, 가상 사용 시나리오로 작성한 샘플 후기 12건(모두 5점, 2026-11-04).
 *   화면에 '샘플 후기' 안내를 한 번 표시하고, 구조화 데이터(Review·AggregateRating)와 성과 지표에는 쓰지 않습니다.
 * - 후기 사진은 실제 MORH 용기로 AI 생성한 샘플 이미지입니다(고객 사진 아님, 화면에 명시). 한 장씩 모두 다른 사진.
 *   순서(2026-11-04 요청): 사진 줄 기준 1 s01 · 2 s10 · 3 s04 · 4 s05 · 5·6 가방(s11·s12) · 7 s07 · … · 맨 뒤 s02(뚜껑, AI 느낌이 강함).
 *   파일: public/images/reviews/r01~r12-{400|800}.webp, 설명(alt)은 아래 PHOTOS. before/after 사진은 쓰지 않습니다.
 * - 효능·피부 변화를 단정하는 문장은 쓰지 않고 사용 경험(루틴·사용감·용기)만 다룹니다.
 */
import type { Locale } from '../i18n/locales';

export type PhotoId = 'r01' | 'r02' | 'r03' | 'r04' | 'r05' | 'r06' | 'r07' | 'r08' | 'r09' | 'r10' | 'r11' | 'r12';
export type Tag = 'routine' | 'texture' | 'moisture' | 'package' | 'morning' | 'scent';
type Text = { title: string; body: string };

export interface Review {
  id: string;
  rating: number;
  author: Record<Locale, string>;
  skin: Record<Locale, string>;
  photos: PhotoId[];
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

const ph = (ko: string, en: string, ja: string, zh: string, arText: string) => ({ ko, en, ja, 'zh-cn': zh, ar: arText });
/** 후기 사진 설명(alt) — 화면에는 '고객 사진이 아닌 …' 문장 안에 들어감 */
export const PHOTOS: Record<PhotoId, Record<Locale, string>> = {
  r01: ph('세면대 옆, 손등에 크림을 펴 바른 사진', 'cream spread on the back of a hand by the sink', '洗面台の横で手の甲にクリームをのばした写真', '在洗手台旁把面霜涂在手背上的照片', 'صورة للكريم على ظهر اليد بجانب المغسلة'),
  r02: ph('물기 있는 세면대에서 손등에 덜어 본 크림 사진', 'cream on the back of a hand at a wet sink', '水滴の残る洗面台で手の甲に取ったクリームの写真', '在有水渍的洗手台边取在手背上的面霜照片', 'صورة للكريم على ظهر اليد عند مغسلة مبللة'),
  r03: ph('욕실 선반에서 MORH 뚜껑을 잡은 손 사진', 'a hand holding the MORH lid on a bathroom counter', 'バスルームの棚でMORHのふたを持つ手の写真', '在浴室台面上握住MORH瓶盖的手的照片', 'صورة ليد تمسك غطاء MORH على رف الحمّام'),
  r04: ph('가습기를 켠 겨울 저녁 협탁 위 MORH 사진', 'MORH on a nightstand on a winter evening with a humidifier on', '加湿器をつけた冬の夜、サイドテーブルの上のMORHの写真', '冬夜开着加湿器的床头柜上的MORH照片', 'صورة MORH على طاولة جانبية في مساء شتوي مع جهاز ترطيب'),
  r05: ph('손가락 끝에 크림을 덜어 올린 사진', 'cream scooped onto a fingertip', '指先にクリームを取った写真', '指尖上取了面霜的照片', 'صورة للكريم على طرف الإصبع'),
  r06: ph('뚜껑을 연 MORH와 손가락에 덜어 낸 크림 가까이 찍은 사진', 'close-up of an open MORH jar and cream on a finger', 'ふたを開けたMORHと指に取ったクリームの接写', '打开的MORH和手指上面霜的特写', 'صورة قريبة لبرطمان MORH مفتوح وكريم على الإصبع'),
  r07: ph('칫솔컵 옆 좁은 유리 선반 위 MORH 사진', 'MORH on a narrow glass shelf next to a toothbrush cup', '歯ブラシ立ての横、狭いガラス棚の上のMORHの写真', '牙刷杯旁窄玻璃架上的MORH照片', 'صورة MORH على رف زجاجي ضيق بجانب كوب فرشاة الأسنان'),
  r08: ph('아침 창가에서 손등에 펴 바른 크림 사진', 'cream spread on the back of a hand by a morning window', '朝の窓辺で手の甲にのばしたクリームの写真', '早晨窗边涂在手背上的面霜照片', 'صورة للكريم على ظهر اليد بجانب نافذة صباحية'),
  r09: ph('선크림 튜브 옆에서 손등에 덜어 본 크림 사진', 'cream on the back of a hand next to a sunscreen tube', '日焼け止めのチューブの横で手の甲に取ったクリームの写真', '防晒霜旁边取在手背上的面霜照片', 'صورة للكريم على ظهر اليد بجانب أنبوب واقي الشمس'),
  r10: ph('출장 가방 파우치에 MORH를 넣는 사진', 'putting MORH into a pouch in a travel bag', '出張バッグのポーチにMORHを入れる写真', '把MORH放进出差包收纳袋的照片', 'صورة لوضع MORH في حقيبة صغيرة داخل حقيبة السفر'),
  r11: ph('회사용 에코백에 MORH를 넣는 사진', 'putting MORH into a canvas work tote', '通勤用トートバッグにMORHを入れる写真', '把MORH放进上班用帆布包的照片', 'صورة لوضع MORH في حقيبة قماشية للعمل'),
  r12: ph('잠들기 전 협탁에서 크림을 찍어 내는 사진', 'dipping into the cream on a nightstand before bed', '寝る前にサイドテーブルでクリームをすくう写真', '睡前在床头柜上取面霜的照片', 'صورة لأخذ الكريم على الطاولة الجانبية قبل النوم'),
};

const who = (ko: string, latin: string, ja: string, zh: string, arName: string) => ({ ko, en: latin, ja, 'zh-cn': zh, ar: arName });

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 's01', rating: 5, sample: true, photos: ['r02'], tags: ['texture', 'routine'],
    author: who('김*연', 'Y. Kim', 'Y. K.', '金*妍', 'ي. ك.'), skin: SKIN.combo,
    text: {
      ko: { title: '토너 다음에 바로 바르기 편해요', body: '세안하고 토너 바른 다음 이거 하나 바르고 끝내요. 손등에 덜면 쫀쫀해 보이는데 얼굴에 펴 보면 생각보다 가볍게 스며들어요. 복합성인데 T존이 번들거리지 않아서 만족해요.' },
      en: { title: 'Easy as the last step of my skincare', body: 'I like how simple it is to apply right after toner and be done. It spreads smoothly when I take some on the back of my hand.' },
      ja: { title: 'スキンケアの最後に使いやすいです', body: '化粧水のあとにすぐ塗って終わる流れがシンプルで気に入っています。手の甲に取るとなめらかにのびるタイプです。' },
      'zh-cn': { title: '作为护肤最后一步很方便', body: '爽肤水之后直接涂完就结束，步骤简单我很喜欢。取在手背上时很容易推开。' },
      ar: { title: 'سهل كآخر خطوة في روتيني', body: 'يعجبني أن أضعه بعد التونر مباشرة وأنتهي. يتوزع بنعومة عندما أضع قليلًا على ظهر يدي.' },
    },
  },
  {
    id: 's10', rating: 5, sample: true, photos: ['r12'], tags: ['routine', 'moisture'],
    author: who('강*비', 'B. Kang', 'B. K.', '姜*碧', 'ب. ك.'), skin: SKIN.dry,
    text: {
      ko: { title: '자기 전 마지막 루틴이에요', body: '침대 옆 협탁에 두고 불 끄기 전에 마지막으로 발라요. 다음 날 아침 세안할 때 당기는 느낌이 덜해서 저녁에 꼭 챙기게 됐어요.' },
      en: { title: 'My evening routine feels calmer', body: 'Applying it last before bed feels like wrapping up the day. I like that it finishes with a moist feel.' },
      ja: { title: '夜のルーティンが落ち着きました', body: '寝る前に最後に塗る時間が、一日を締めくくるように感じます。しっとり仕上がるところが好きです。' },
      'zh-cn': { title: '晚间护肤变得从容了', body: '睡前最后涂上它，感觉像是在为一天收尾。喜欢它滋润的收尾感。' },
      ar: { title: 'روتين المساء أصبح أهدأ', body: 'وضعه في النهاية قبل النوم يشبه اختتام اليوم. يعجبني أنه ينتهي بإحساس مرطب.' },
    },
  },
  {
    id: 's03', rating: 5, sample: true, photos: [], tags: ['morning', 'routine'],
    author: who('이*은', 'E. Lee', 'E. L.', '李*恩', 'إ. ل.'), skin: SKIN.oily,
    text: {
      ko: { title: '아침 순서가 단순해졌어요', body: '원래 톤업크림, 컨실러, 쿠션 순서였는데 요즘은 크림 바르고 선크림, 쿠션만 해요. 지성이라 유분 걱정했는데 오후에도 무너지는 느낌이 덜했어요.' },
      en: { title: 'My morning order feels tidier', body: 'I am sticking to cream, sunscreen and one layer of cushion. My mornings feel less complicated.' },
      ja: { title: '朝の支度の順番が整いました', body: 'クリーム、日焼け止め、クッションファンデ一層で終える順番を続けています。朝がすっきりしました。' },
      'zh-cn': { title: '早上的准备顺序变清楚了', body: '我一直坚持面霜、防晒、一层气垫的顺序，早上没那么复杂了。' },
      ar: { title: 'ترتيب صباحي أوضح', body: 'ألتزم بترتيب الكريم ثم واقي الشمس ثم طبقة كوشن واحدة. أصبح صباحي أقل تعقيدًا.' },
    },
  },
  {
    id: 's04', rating: 5, sample: true, photos: ['r04'], tags: ['moisture'],
    author: who('최*희', 'H. Choi', 'H. C.', '崔*熙', 'ه. ت.'), skin: SKIN.dry,
    text: {
      ko: { title: '건성은 저녁에 한 겹 더 얹어요', body: '겨울이라 방에 가습기 틀어 놓고 자기 전에 한 겹 더 발라요. 건성이라 아침엔 살짝 부족해서 양을 조금 늘렸어요. 처음엔 소량부터 써 보시는 걸 추천해요.' },
      en: { title: 'Dry skin, so I adjust the amount', body: 'On dry days I use a little more. Everyone’s skin is different, so start with a small amount.' },
      ja: { title: '乾燥肌なので量を調整しています', body: '乾燥する日は少し多めに使っています。肌によって違うので、少量から試してみてください。' },
      'zh-cn': { title: '干皮需要调整用量', body: '干燥的日子我会多取一点。每个人肤质不同，建议先少量试用。' },
      ar: { title: 'بشرتي جافة فأعدّل الكمية', body: 'في الأيام الجافة أستخدم كمية أكبر قليلًا. البشرة تختلف من شخص لآخر، فابدئي بكمية صغيرة.' },
    },
  },
  {
    id: 's05', rating: 5, sample: true, photos: ['r05'], tags: ['texture', 'moisture'],
    author: who('정*민', 'M. Jung', 'M. J.', '郑*敏', 'م. ج.'), skin: SKIN.combo,
    text: {
      ko: { title: '한 번 덜면 얼굴 전체에 충분해요', body: '손가락 한 마디 정도 덜면 얼굴 전체 바르고도 남아요. 발림이 부드러워서 문지르지 않고 톡톡 펴 발라도 잘 스며들어요.' },
      en: { title: 'Spreads softly', body: 'It is easy to apply in a thin layer, so I can move to the next step right away. I like the moist feel.' },
      ja: { title: 'のびがやわらかいです', body: '薄くのばしやすいので、塗ったあとすぐ次のステップに進めます。しっとりした感触が好きです。' },
      'zh-cn': { title: '涂抹很顺滑', body: '很容易薄薄涂开，涂完马上就能进行下一步。喜欢它的滋润感。' },
      ar: { title: 'يتوزع بنعومة', body: 'سهل التوزيع بطبقة رقيقة، فأنتقل إلى الخطوة التالية مباشرة. أحب الإحساس بالترطيب.' },
    },
  },
  {
    id: 's11', rating: 5, sample: true, photos: ['r10'], tags: ['package', 'routine'],
    author: who('조*현', 'H. Cho', 'H. C.', '赵*贤', 'ه. ج.'), skin: SKIN.combo,
    text: {
      ko: { title: '출장 갈 때도 챙겼어요', body: '3박 4일 출장에 파우치에 넣어 갔어요. 뚜껑이 단단히 닫혀서 가방 안에서 샐 걱정은 없었는데, 유리 용기라 무게는 조금 있어요.' },
      en: { title: 'Took it on a business trip', body: 'I packed it in my pouch for a four-day trip. The lid closes tightly so I never worried about leaks, though the glass jar is a little heavy.' },
      ja: { title: '出張にも持っていきました', body: '3泊4日の出張にポーチに入れて持っていきました。ふたがしっかり閉まるので漏れる心配はなかったですが、ガラス容器なので少し重さはあります。' },
      'zh-cn': { title: '出差也带上了', body: '四天的出差我把它放进收纳袋带走了。瓶盖拧得很紧，不用担心在包里漏，不过玻璃瓶会稍微有点重量。' },
      ar: { title: 'أخذته معي في رحلة عمل', body: 'وضعته في حقيبتي الصغيرة لرحلة عمل من أربعة أيام. الغطاء يُغلق بإحكام فلم أقلق من التسرّب، لكن البرطمان الزجاجي ثقيل قليلًا.' },
    },
  },
  {
    id: 's12', rating: 5, sample: true, photos: ['r11'], tags: ['routine', 'moisture'],
    author: who('문*지', 'J. Moon', 'J. M.', '文*智', 'ج. م.'), skin: SKIN.normal,
    text: {
      ko: { title: '2개 세트로 사서 하나는 회사에', body: '집에 하나, 회사 가방에 하나 두고 써요. 사무실이 건조해서 오후에 조금씩 덧바르는데 손 닿는 데 있으니 편해요.' },
      en: { title: 'Bought the 2-pack, one stays at work', body: 'I keep one at home and one in my work bag. The office is dry, so I add a little in the afternoon, and having it within reach makes it easy.' },
      ja: { title: '2個セットで買って、ひとつは会社に', body: '家にひとつ、会社のバッグにひとつ置いて使っています。オフィスが乾燥しているので午後に少しずつ重ねていますが、手の届くところにあるので便利です。' },
      'zh-cn': { title: '买了两件装，一瓶放公司', body: '家里放一瓶，上班包里放一瓶。办公室很干，下午会少量补涂，放在手边很方便。' },
      ar: { title: 'اشتريت عبوتين وواحدة في العمل', body: 'أحتفظ بواحدة في البيت وأخرى في حقيبة العمل. المكتب جاف، فأضع القليل بعد الظهر، ووجوده في متناول يدي يجعل ذلك سهلًا.' },
    },
  },
  {
    id: 's07', rating: 5, sample: true, photos: ['r07'], tags: ['package', 'routine'],
    author: who('윤*서', 'S. Yoon', 'S. Y.', '尹*书', 'س. ي.'), skin: SKIN.sensitive,
    text: {
      ko: { title: '좁은 선반에도 쏙 들어가요', body: '욕실 유리 선반이 좁은데 용기가 낮아서 칫솔컵 옆에 딱 맞아요. 민감한 편인데 따가운 느낌 없이 잘 쓰고 있어요.' },
      en: { title: 'The low jar takes up little space', body: 'The low cylinder fits on a narrow shelf. It is easy to reach at the end of my evening routine.' },
      ja: { title: '容器が低くて場所を取りません', body: '低い円筒形なので狭い棚にも収まります。夜のルーティンの最後に取り出しやすいです。' },
      'zh-cn': { title: '瓶身矮，不占地方', body: '低矮的圆柱形，窄架子上也放得下。晚间护肤最后一步拿起来很方便。' },
      ar: { title: 'البرطمان منخفض ولا يأخذ مساحة', body: 'الشكل الأسطواني المنخفض يناسب الرف الضيق، وسهل الوصول إليه في آخر روتين المساء.' },
    },
  },
  {
    id: 's06', rating: 5, sample: true, photos: ['r01'], tags: ['routine'],
    author: who('한*진', 'J. Han', 'J. H.', '韩*珍', 'ج. ه.'), skin: SKIN.normal,
    text: {
      ko: { title: '세면대 옆에 두고 매일 써요', body: '눈에 보여야 챙겨 바르는 편이라 세면대 옆에 뒀어요. 세안하고 바로 손 닿는 데 있으니까 2주째 하루도 안 빼먹었어요.' },
      en: { title: 'Building a daily habit', body: 'I keep it next to the sink and use it morning and night. The idea of a 14-day ritual keeps me consistent.' },
      ja: { title: '毎日塗る習慣をつくっています', body: '洗面台の横に置いて朝晩使っています。14日間のルーティンという言葉が続けるきっかけになっています。' },
      'zh-cn': { title: '正在养成每天涂的习惯', body: '放在洗手台旁边，早晚都会用。“14天护肤仪式”这个说法让我坚持了下来。' },
      ar: { title: 'أبني عادة يومية', body: 'أضعه بجانب المغسلة وأستخدمه صباحًا ومساءً. فكرة روتين الأربعة عشر يومًا تساعدني على الاستمرار.' },
    },
  },
  {
    id: 's08', rating: 5, sample: true, photos: ['r06'], tags: ['scent', 'texture'],
    author: who('오*아', 'A. Oh', 'A. O.', '吴*雅', 'أ. أ.'), skin: SKIN.oily,
    text: {
      ko: { title: '향은 개인차가 있을 것 같아요', body: '저는 거슬리지 않았는데 향에 예민하시면 손목에 먼저 발라 보세요. 크림이 꾸덕해 보여도 펴 바르면 가볍게 마무리돼요.' },
      en: { title: 'Scent may be personal', body: 'It was fine for me, but if you are sensitive to scent you may want to check it first. It feels light to use.' },
      ja: { title: '香りは好みが分かれそうです', body: '私は気になりませんでしたが、香りに敏感な方は先に確かめるといいと思います。使用感は軽めです。' },
      'zh-cn': { title: '香味可能因人而异', body: '我觉得还可以，但对香味敏感的话最好先确认一下。用起来比较轻薄。' },
      ar: { title: 'الرائحة مسألة ذوق', body: 'كانت مناسبة لي، لكن إن كنتِ حساسة للروائح فمن الأفضل تجربتها أولًا. الإحساس عند الاستخدام خفيف.' },
    },
  },
  {
    id: 's09', rating: 5, sample: true, photos: ['r08', 'r09'], tags: ['morning', 'texture'],
    author: who('서*윤', 'Y. Seo', 'Y. S.', '徐*允', 'ي. س.'), skin: SKIN.combo,
    text: {
      ko: { title: '선크림이 밀리지 않아요', body: '바르고 1~2분 기다렸다가 선크림 올리면 밀리지 않고 깔끔하게 올라가요. 아침에 창가 화장대에서 바르는데 끈적임이 금방 사라져서 바로 다음 단계로 넘어가요.' },
      en: { title: 'Works well before sunscreen', body: 'If I wait a moment after applying, my sunscreen goes on without pilling.' },
      ja: { title: '日焼け止めの前に使いやすいです', body: '塗ったあと少し置いてから日焼け止めを重ねると、よれずにのってくれました。' },
      'zh-cn': { title: '适合在防晒前使用', body: '涂完稍等一会儿再上防晒，不容易搓泥。' },
      ar: { title: 'مناسب قبل واقي الشمس', body: 'إذا انتظرتُ قليلًا بعد وضعه، يُوضع واقي الشمس فوقه دون أن يتكتل.' },
    },
  },
  {
    id: 's02', rating: 5, sample: true, photos: ['r03'], tags: ['package'],
    author: who('박*라', 'R. Park', 'R. P.', '朴*拉', 'ر. ب.'), skin: SKIN.normal,
    text: {
      ko: { title: '뚜껑이 손에 착 감겨요', body: '아침에 손에 물기 있을 때도 뚜껑이 미끄럽지 않게 잘 열려요. 용기가 묵직해서 싸 보이지 않고, 욕실 선반에 두면 예뻐서 자꾸 손이 가요.' },
      en: { title: 'The lid is easy to grip', body: 'The rounded lid is easy to open even when I am rushing in the morning. The subtle gold line looks nice on my vanity.' },
      ja: { title: 'ふたが手になじみます', body: '丸いふたなので、朝急いで開けるときも楽です。控えめなゴールドのラインがドレッサーに置いても素敵です。' },
      'zh-cn': { title: '瓶盖很好拿', body: '圆圆的瓶盖，早上匆忙时也很好打开。低调的金色线条放在梳妆台上很好看。' },
      ar: { title: 'الغطاء سهل الإمساك', body: 'الغطاء المستدير سهل الفتح حتى عندما أكون مستعجلة صباحًا. الخط الذهبي الهادئ يبدو جميلًا على طاولة الزينة.' },
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

/** 후기 사진 경로 (정사각 400·800px) */
export const reviewImage = (id: PhotoId, size: 'thumb' | 'full') => `/images/reviews/${id}-${size === 'thumb' ? 400 : 800}.webp`;
