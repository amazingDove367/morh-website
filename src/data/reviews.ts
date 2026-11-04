/**
 * 구매후기 데이터 (상세페이지의 구매후기 요약 · 구매후기 탭이 같은 목록을 사용)
 *
 * - `realReviews`: 실제 구매후기. 한 건이라도 들어오면 샘플 후기는 화면에서 빠집니다(섞지 않음).
 * - `SAMPLE_REVIEWS`: 실제 구매자가 아닌, 가상 사용 시나리오로 작성한 샘플 후기 14건(모두 5점, 2026-11-04).
 *   미백 크림답게 피부 톤·밝기, 촉촉함, 오후까지 촉촉 위주(키워드 = 태그). 화면에 '샘플 후기' 안내를 한 번 표시하고, 구조화 데이터(Review·AggregateRating)와 성과 지표에는 쓰지 않습니다.
 * - 후기 사진은 실제 MORH 용기로 AI 생성한 샘플 이미지입니다(고객 사진 아님, 화면에 명시). 한 장씩 모두 다른 사진.
 *   순서(2026-11-04 요청): 사진 줄 기준 1 s01 · 2 s10 · 3·4 새 사진(s13·s14) · … · 10 s04 · 맨 뒤 s02(뚜껑, AI 느낌이 강함).
 *   파일: public/images/reviews/r01~r14-{400|800}.webp, 설명(alt)은 아래 PHOTOS. before/after 사진은 쓰지 않습니다.
 * - 피부 변화는 '제 느낌'·'~해 보여요' 수준의 개인 사용 경험으로만 쓰고, 수치·의학적 효과는 쓰지 않습니다.
 */
import type { Locale } from '../i18n/locales';

export type PhotoId = 'r01' | 'r02' | 'r03' | 'r04' | 'r05' | 'r06' | 'r07' | 'r08' | 'r09' | 'r10' | 'r11' | 'r12' | 'r13' | 'r14';
export type Tag = 'bright' | 'moisture' | 'lasting' | 'texture' | 'morning' | 'routine';
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
  r13: ph('택배 영수증과 함께 세면대에 올려 둔 MORH 사진', 'MORH on a bathroom counter next to a delivery receipt', '配送伝票と一緒に洗面台に置いたMORHの写真', '和快递单一起放在洗手台上的MORH照片', 'صورة MORH على رف الحمّام بجانب إيصال التوصيل'),
  r14: ph('잠든 강아지 옆 거실 벤치 위 MORH 사진', 'MORH on a living-room bench beside a sleeping dog', '眠っている犬のそば、リビングのベンチに置いたMORHの写真', '睡着的小狗旁客厅长凳上的MORH照片', 'صورة MORH على مقعد في غرفة المعيشة بجانب كلب نائم'),
  r12: ph('잠들기 전 협탁에서 크림을 찍어 내는 사진', 'dipping into the cream on a nightstand before bed', '寝る前にサイドテーブルでクリームをすくう写真', '睡前在床头柜上取面霜的照片', 'صورة لأخذ الكريم على الطاولة الجانبية قبل النوم'),
};

const who = (ko: string, latin: string, ja: string, zh: string, arName: string) => ({ ko, en: latin, ja, 'zh-cn': zh, ar: arName });

export const SAMPLE_REVIEWS: Review[] = [
  {
    id: 's01', rating: 5, sample: true, photos: ['r02'], tags: ['bright', 'moisture'],
    author: who('김*연', 'Y. Kim', 'Y. K.', '金*妍', 'ي. ك.'), skin: SKIN.combo,
    text: {
      ko: { title: '2주 지나니 톤이 맑아졌어요', body: '세안하고 토너 다음에 바로 발라요. 2주쯤 지나니까 거울 볼 때 얼굴 톤이 한결 맑아 보여요. 복합성인데 끈적이지 않고 촉촉하게 마무리돼서 좋아요.' },
      en: { title: 'My tone looked clearer after two weeks', body: 'I apply it right after toner. Around the two-week mark my skin tone looked noticeably clearer in the mirror. I have combination skin and it finishes moist, not sticky.' },
      ja: { title: '2週間でトーンが明るく見えてきました', body: '洗顔後、化粧水のすぐあとに塗っています。2週間ほどで鏡を見たときの肌トーンがすっきり見えるように。混合肌ですがベタつかず、しっとり仕上がります。' },
      'zh-cn': { title: '两周后肤色看起来更透亮', body: '洗脸后爽肤水之后直接涂。大约两周后照镜子时觉得肤色透亮了不少。我是混合肌，不黏腻，收尾很滋润。' },
      ar: { title: 'بدت بشرتي أصفى بعد أسبوعين', body: 'أضعه بعد التونر مباشرة. بعد نحو أسبوعين بدا لون بشرتي أصفى في المرآة. بشرتي مختلطة ويترك إحساسًا مرطبًا غير لزج.' },
    },
  },
  {
    id: 's10', rating: 5, sample: true, photos: ['r12'], tags: ['moisture', 'routine'],
    author: who('강*비', 'B. Kang', 'B. K.', '姜*碧', 'ب. ك.'), skin: SKIN.dry,
    text: {
      ko: { title: '자기 전에 바르면 아침까지 촉촉해요', body: '자기 전 마지막 단계로 바르고 자면 다음 날 아침 세안할 때까지 당기지 않아요. 건성이라 미백 크림은 건조할까 봐 걱정했는데 오히려 촉촉해서 놀랐어요.' },
      en: { title: 'Apply before bed, still moist in the morning', body: 'I put it on as my last step at night and my skin does not feel tight even when I wash my face the next morning. I worried a brightening cream would dry out my dry skin, but it is surprisingly moist.' },
      ja: { title: '寝る前に塗ると朝までしっとり', body: '夜の最後に塗って寝ると、翌朝の洗顔までつっぱりません。乾燥肌なので美白クリームは乾燥しそうと心配でしたが、むしろしっとりして驚きました。' },
      'zh-cn': { title: '睡前涂，到早上都很滋润', body: '晚上最后一步涂完睡觉，第二天早上洗脸前都不紧绷。干皮本来担心美白霜会干，结果反而很滋润，有点惊喜。' },
      ar: { title: 'أضعه قبل النوم ويبقى الترطيب حتى الصباح', body: 'أضعه كآخر خطوة ليلًا فلا تشد بشرتي حتى غسل الوجه صباحًا. خشيت أن يجفف كريم التفتيح بشرتي الجافة، لكنه مرطب على نحو مفاجئ.' },
    },
  },
  {
    id: 's03', rating: 5, sample: true, photos: [], tags: ['bright', 'morning'],
    author: who('이*은', 'E. Lee', 'E. L.', '李*恩', 'إ. ل.'), skin: SKIN.oily,
    text: {
      ko: { title: '3주째, 톤이 많이 밝아졌어요', body: '3주째 아침저녁으로 쓰고 있는데 톤이 많이 밝아졌어요. 예전엔 볼 쪽 칙칙함 때문에 컨실러를 매일 썼는데 요즘은 쿠션만 하고 나가는 날이 많아요.' },
      en: { title: 'Three weeks in, my tone is much brighter', body: 'I have used it morning and night for three weeks and my tone is much brighter. I used to need concealer every day for dull cheeks; now I often go out with just cushion.' },
      ja: { title: '3週間目、トーンがかなり明るくなりました', body: '朝晩使って3週間、トーンがかなり明るくなりました。以前は頬のくすみで毎日コンシーラーを使っていましたが、最近はクッションだけで出かける日が多いです。' },
      'zh-cn': { title: '用到第三周，肤色亮了很多', body: '早晚用了三周，肤色亮了很多。以前脸颊暗沉每天都要用遮瑕，现在很多时候只上气垫就出门。' },
      ar: { title: 'بعد ثلاثة أسابيع صار لون بشرتي أفتح بكثير', body: 'أستخدمه صباحًا ومساءً منذ ثلاثة أسابيع وصار لون بشرتي أفتح بكثير. كنت أحتاج الكونسيلر يوميًا لبهتان الوجنتين، والآن أخرج غالبًا بالكوشن فقط.' },
    },
  },
  {
    id: 's13', rating: 5, sample: true, photos: ['r13'], tags: ['moisture', 'texture'],
    author: who('임*하', 'H. Lim', 'H. L.', '林*夏', 'ه. ل.'), skin: SKIN.normal,
    text: {
      ko: { title: '받자마자 세면대에 올려 뒀어요', body: '택배 뜯자마자 세면대 옆에 자리 잡았어요. 처음 바를 때부터 얼굴에 착 붙으면서 촉촉하게 스며들어요. 한 달 뒤 톤 변화 기대하면서 매일 쓰는 중이에요.' },
      en: { title: 'Went straight onto my bathroom counter', body: 'It found its spot by the sink the moment I opened the box. From the first use it melts in and stays moist. I am using it daily and looking forward to the one-month mark.' },
      ja: { title: '届いてすぐ洗面台に置きました', body: '開封してすぐ洗面台の横が定位置に。初めて塗ったときから肌にぴたっとなじんで、しっとり浸透します。1か月後のトーンの変化を楽しみに毎日使っています。' },
      'zh-cn': { title: '一到货就放在洗手台上', body: '拆完快递就放到洗手台旁边了。第一次涂就很服帖，滋润地吸收进去。期待一个月后的肤色变化，每天都在用。' },
      ar: { title: 'وضعته على المغسلة فور وصوله', body: 'وجد مكانه بجانب المغسلة فور فتح العلبة. من أول استخدام يلتصق بالبشرة ويتشربه مرطبًا. أستخدمه يوميًا وأنتظر التغيير بعد شهر.' },
    },
  },
  {
    id: 's14', rating: 5, sample: true, photos: ['r14'], tags: ['bright', 'routine'],
    author: who('신*다', 'D. Shin', 'D. S.', '申*多', 'د. ش.'), skin: SKIN.combo,
    text: {
      ko: { title: '산책 다녀와서 꼭 발라요', body: '강아지 산책을 하루 두 번 나가서 햇빛을 많이 받는 편이에요. 들어와서 세안하고 바르는데, 4주쯤 쓰니 얼굴이 덜 칙칙해 보인다는 말을 들었어요.' },
      en: { title: 'I never skip it after dog walks', body: 'I walk my dog twice a day, so I get a lot of sun. I wash and apply it when I get home, and after about four weeks people said my face looks less dull.' },
      ja: { title: '散歩のあとに必ず塗ります', body: '犬の散歩で1日2回外に出るので日差しをよく浴びます。帰ってから洗顔して塗っていますが、4週間ほどで顔がくすんで見えなくなったと言われました。' },
      'zh-cn': { title: '遛狗回来一定会涂', body: '每天遛狗两次，晒太阳比较多。回家洗脸后涂上，用了大概四周，有人说我脸看起来没那么暗沉了。' },
      ar: { title: 'أضعه دائمًا بعد نزهة الكلب', body: 'أخرج بكلبي مرتين يوميًا فأتعرض للشمس كثيرًا. أغسل وجهي وأضعه عند العودة، وبعد نحو أربعة أسابيع قيل لي إن وجهي يبدو أقل بهتانًا.' },
    },
  },
  {
    id: 's05', rating: 5, sample: true, photos: ['r05'], tags: ['texture', 'moisture'],
    author: who('정*민', 'M. Jung', 'M. J.', '郑*敏', 'م. ج.'), skin: SKIN.combo,
    text: {
      ko: { title: '한 번 덜면 얼굴 전체에 충분해요', body: '손가락 한 마디 정도 덜면 얼굴 전체 바르고도 남아요. 톡톡 두드리면 금방 스며들고 촉촉함이 오래가요.' },
      en: { title: 'One scoop covers my whole face', body: 'A fingertip’s worth is more than enough for my whole face. Pat it in and it absorbs fast, and the moisture lasts.' },
      ja: { title: 'ひとすくいで顔全体に十分', body: '指先ひと関節分で顔全体に塗っても余ります。軽くたたくとすぐなじみ、しっとり感が長続きします。' },
      'zh-cn': { title: '取一点就够全脸', body: '取一指节的量涂全脸还有剩。轻拍很快就吸收，滋润感很持久。' },
      ar: { title: 'مقدار صغير يكفي الوجه كله', body: 'مقدار طرف إصبع يكفي الوجه كله ويزيد. أربت عليه فيُمتص بسرعة ويدوم الترطيب.' },
    },
  },
  {
    id: 's11', rating: 5, sample: true, photos: ['r10'], tags: ['lasting', 'routine'],
    author: who('조*현', 'H. Cho', 'H. C.', '赵*贤', 'ه. ج.'), skin: SKIN.combo,
    text: {
      ko: { title: '출장 가서도 빼먹지 않았어요', body: '3박 4일 출장에도 파우치에 넣어 갔어요. 호텔 방이 건조했는데 아침에 바르면 오후 회의 때까지 얼굴이 당기지 않았어요.' },
      en: { title: 'Did not skip it on a business trip', body: 'I packed it in my pouch for a four-day trip. The hotel room was dry, but applying it in the morning kept my face from feeling tight through afternoon meetings.' },
      ja: { title: '出張先でも欠かさず使いました', body: '3泊4日の出張にもポーチに入れて持っていきました。ホテルの部屋は乾燥していましたが、朝塗れば午後の会議までつっぱりませんでした。' },
      'zh-cn': { title: '出差也没落下', body: '四天的出差也放进收纳袋带去了。酒店房间很干，但早上涂了到下午开会脸都不紧绷。' },
      ar: { title: 'لم أتركه حتى في رحلة العمل', body: 'أخذته في حقيبتي الصغيرة لرحلة من أربعة أيام. كانت غرفة الفندق جافة، لكن وضعه صباحًا منع شد البشرة حتى اجتماعات العصر.' },
    },
  },
  {
    id: 's12', rating: 5, sample: true, photos: ['r11'], tags: ['lasting', 'moisture'],
    author: who('문*지', 'J. Moon', 'J. M.', '文*智', 'ج. م.'), skin: SKIN.normal,
    text: {
      ko: { title: '오후 3시에도 촉촉해요', body: '사무실 히터 때문에 오후만 되면 건조했는데, 아침에 바르고 나가면 오후까지 촉촉함이 유지돼요. 2개 세트로 사서 하나는 회사 가방에 넣어 뒀어요.' },
      en: { title: 'Still moist at 3 p.m.', body: 'The office heater used to dry me out every afternoon, but when I apply it in the morning the moisture lasts into the afternoon. I bought the 2-pack and keep one in my work bag.' },
      ja: { title: '午後3時でもしっとり', body: 'オフィスの暖房で午後になると乾燥していましたが、朝塗って出かけると午後までしっとり感が続きます。2個セットで買ってひとつは会社のバッグに。' },
      'zh-cn': { title: '下午三点也很滋润', body: '办公室开暖气，一到下午就干，早上涂了出门能滋润到下午。买了两件装，一瓶放在上班包里。' },
      ar: { title: 'مرطب حتى الساعة الثالثة عصرًا', body: 'كانت تدفئة المكتب تجفف بشرتي كل عصر، لكن عندما أضعه صباحًا يدوم الترطيب حتى العصر. اشتريت العبوتين وأبقي واحدة في حقيبة العمل.' },
    },
  },
  {
    id: 's07', rating: 5, sample: true, photos: ['r07'], tags: ['bright', 'routine'],
    author: who('윤*서', 'S. Yoon', 'S. Y.', '尹*书', 'س. ي.'), skin: SKIN.sensitive,
    text: {
      ko: { title: '민감성인데 무난하게 쓰고 있어요', body: '민감한 편이라 걱정했는데 따가운 느낌 없이 잘 쓰고 있어요. 2주째부터는 볼 쪽 톤이 고르게 보여서 꾸준히 쓰려고요.' },
      en: { title: 'Sensitive skin, no trouble so far', body: 'I was nervous with sensitive skin, but there has been no stinging. From week two my cheeks looked more even in tone, so I plan to keep going.' },
      ja: { title: '敏感肌ですが問題なく使えています', body: '敏感肌なので心配でしたが、ピリピリせず使えています。2週目から頬のトーンが均一に見えてきたので続けるつもりです。' },
      'zh-cn': { title: '敏感肌用着也没问题', body: '皮肤比较敏感本来有点担心，用起来没有刺痛感。第二周开始脸颊肤色看起来更均匀，打算继续用。' },
      ar: { title: 'بشرتي حساسة ولم أواجه مشكلة', body: 'كنت قلقة لأن بشرتي حساسة، لكن لم أشعر بأي لسع. من الأسبوع الثاني بدا لون وجنتيّ أكثر توحدًا، لذا سأستمر.' },
    },
  },
  {
    id: 's06', rating: 5, sample: true, photos: ['r01'], tags: ['bright', 'routine'],
    author: who('한*진', 'J. Han', 'J. H.', '韩*珍', 'ج. ه.'), skin: SKIN.normal,
    text: {
      ko: { title: '3주 꾸준히 바르니 톤이 달라요', body: '눈에 보여야 챙기는 편이라 세면대 옆에 뒀어요. 하루도 안 빼고 3주 발랐더니 피부 톤이 확실히 밝아졌어요.' },
      en: { title: 'Three steady weeks, a different tone', body: 'I only remember things I can see, so it lives next to my sink. After three weeks without skipping a day, my skin tone is clearly brighter.' },
      ja: { title: '3週間続けたらトーンが違います', body: '目に入らないと忘れるので洗面台の横に置いています。1日も欠かさず3週間塗ったら、肌トーンがはっきり明るくなりました。' },
      'zh-cn': { title: '坚持三周，肤色不一样了', body: '看得见才会记得用，所以放在洗手台旁边。一天不落涂了三周，肤色明显亮了。' },
      ar: { title: 'ثلاثة أسابيع منتظمة ولون مختلف', body: 'لا أتذكر إلا ما أراه، لذا أضعه بجانب المغسلة. بعد ثلاثة أسابيع دون انقطاع صار لون بشرتي أفتح بوضوح.' },
    },
  },
  {
    id: 's04', rating: 5, sample: true, photos: ['r04'], tags: ['lasting', 'moisture'],
    author: who('최*희', 'H. Choi', 'H. C.', '崔*熙', 'ه. ت.'), skin: SKIN.dry,
    text: {
      ko: { title: '건성은 저녁에 한 겹 더 얹어요', body: '겨울엔 가습기 틀고 자기 전에 한 겹 더 발라요. 그러면 다음 날 오후까지 각질 없이 촉촉해요.' },
      en: { title: 'Dry skin: an extra layer at night', body: 'In winter I run a humidifier and add one more layer before bed. My skin then stays moist with no flaking until the next afternoon.' },
      ja: { title: '乾燥肌は夜にもう一層', body: '冬は加湿器をつけて寝る前にもう一層重ねます。そうすると翌日の午後まで角質が浮かず、しっとりしています。' },
      'zh-cn': { title: '干皮晚上多叠一层', body: '冬天开着加湿器，睡前再多涂一层。这样到第二天下午都不起皮，很滋润。' },
      ar: { title: 'للبشرة الجافة: طبقة إضافية ليلًا', body: 'في الشتاء أشغّل جهاز الترطيب وأضيف طبقة قبل النوم، فتبقى بشرتي مرطبة دون تقشر حتى عصر اليوم التالي.' },
    },
  },
  {
    id: 's08', rating: 5, sample: true, photos: ['r06'], tags: ['texture', 'bright'],
    author: who('오*아', 'A. Oh', 'A. O.', '吴*雅', 'أ. أ.'), skin: SKIN.oily,
    text: {
      ko: { title: '지성인데도 무겁지 않아요', body: '꾸덕해 보이는데 펴 바르면 가볍게 마무리돼요. 지성이라 유분이 걱정됐는데 번들거리지 않고 피부 톤만 맑아 보여요.' },
      en: { title: 'Not heavy, even on oily skin', body: 'It looks thick but finishes light once spread. I worried about oil with my oily skin, but there is no shine, just a clearer-looking tone.' },
      ja: { title: '脂性肌でも重くありません', body: 'こっくり見えますが、のばすと軽く仕上がります。脂性肌なので油分が心配でしたが、テカらず肌トーンだけすっきり見えます。' },
      'zh-cn': { title: '油皮用也不厚重', body: '看着挺厚，推开后收尾很轻薄。油皮本来担心油腻，结果不泛油光，只觉得肤色更透亮。' },
      ar: { title: 'ليس ثقيلًا حتى على البشرة الدهنية', body: 'يبدو كثيفًا لكنه خفيف بعد توزيعه. خشيت الدهون مع بشرتي الدهنية، لكن لا لمعان، فقط لون أصفى.' },
    },
  },
  {
    id: 's09', rating: 5, sample: true, photos: ['r08', 'r09'], tags: ['morning', 'bright'],
    author: who('서*윤', 'Y. Seo', 'Y. S.', '徐*允', 'ي. س.'), skin: SKIN.combo,
    text: {
      ko: { title: '선크림만 발라도 환해 보여요', body: '바르고 1~2분 뒤 선크림을 올리면 밀리지 않아요. 톤업 선크림 없이 일반 선크림만 발라도 얼굴이 환해 보여서 아침 준비가 빨라졌어요.' },
      en: { title: 'Bright even with plain sunscreen', body: 'If I wait a minute or two before sunscreen, nothing pills. Even with regular sunscreen instead of a tone-up one my face looks bright, so mornings are faster.' },
      ja: { title: '日焼け止めだけでも明るく見えます', body: '塗って1〜2分おいてから日焼け止めを重ねるとよれません。トーンアップでない普通の日焼け止めだけでも顔が明るく見えて、朝の支度が早くなりました。' },
      'zh-cn': { title: '只涂防晒也显得亮', body: '涂完等一两分钟再上防晒不会搓泥。不用素颜霜，只涂普通防晒脸也显得亮，早上准备快多了。' },
      ar: { title: 'مشرق حتى مع واقي شمس عادي', body: 'إذا انتظرت دقيقة أو اثنتين قبل واقي الشمس لا يتكتل شيء. حتى مع واقٍ عادي بدل المفتّح يبدو وجهي مشرقًا، فصار صباحي أسرع.' },
    },
  },
  {
    id: 's02', rating: 5, sample: true, photos: ['r03'], tags: ['bright', 'routine'],
    author: who('박*라', 'R. Park', 'R. P.', '朴*拉', 'ر. ب.'), skin: SKIN.normal,
    text: {
      ko: { title: '매일 손이 가니까 톤이 달라졌어요', body: '아침에 손에 물기 있어도 뚜껑이 잘 열려서 매일 손이 가요. 그렇게 꾸준히 바른 지 3주째인데 피부 톤이 밝아진 게 느껴져요.' },
      en: { title: 'I reach for it daily, and my tone changed', body: 'The lid opens easily even with wet hands, so I reach for it every morning. Three weeks of steady use and I can feel my tone getting brighter.' },
      ja: { title: '毎日手が伸びて、トーンが変わりました', body: '朝、手が濡れていてもふたが開けやすいので毎日使っています。続けて3週間、肌トーンが明るくなったのを感じます。' },
      'zh-cn': { title: '每天都会用，肤色变了', body: '早上手湿也很好打开，所以每天都会拿来用。坚持了三周，能感觉到肤色变亮了。' },
      ar: { title: 'أستخدمه يوميًا فتغيّر لون بشرتي', body: 'الغطاء يُفتح بسهولة حتى بيدين مبللتين، فأستخدمه كل صباح. بعد ثلاثة أسابيع من الاستخدام المنتظم أشعر أن لون بشرتي صار أفتح.' },
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
