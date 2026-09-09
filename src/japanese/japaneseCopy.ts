/**
 * The Japanese cut's words — all 266 translatable slots.
 *
 * A PATCH, not a whole script. `COPY.merge` deep-merges this over the approved baseline and
 * locks list lengths, so a slot left out keeps its English text rather than blanking. That
 * is also why the six slots listed below can simply be absent.
 *
 * SIX SLOTS ARE DELIBERATELY NOT HERE
 *
 * They are the ones with no character cap, which is how this table marks "not free text":
 *
 *   companySize            enum, drives sizing logic
 *   feed.weather.condition enum, picks the weather ICON
 *   feed.weather.unit      enum, and Japan uses C anyway
 *   spotlight.apps.0..2    icon slots — "Workday", "ServiceNow", "Zoom"
 *
 * The app slots matter most. The label under each tile has to be the name in the icon's own
 * filename, or the video shows one company's logo over another's name. Translating "Zoom"
 * to ズーム breaks that pairing silently, and the icon is what a viewer actually recognises.
 *
 * `companyName` stays "Spotify" — a wordmark is not translated — and `signage.link` stays a
 * URL for the same reason.
 *
 * ON THE CHARACTER CAPS
 *
 * They are pixel budgets measured against Latin text, and CJK breaks that assumption in two
 * directions at once: a faithful translation needs far FEWER characters, but each glyph is
 * full-width, so roughly twice as wide. The practical rule used throughout this file is
 * **aim for about a third of the cap**, which lands close to the original's pixel width.
 * Where a string is near that, the frame was checked rather than the number trusted.
 */

import { COPY, type VideoInputProps } from "../customize/videoCopy";

const PATCH = {
  person: {
    name: "田中 陽子",
    title: "最高経営責任者",
  },

  quote: {
    original:
      "四半期の締めくくりにあたり、チームの皆さんの努力と献身に心から感謝を伝えたいと思います。" +
      "素晴らしい成果を上げ、困難な場面では互いに支え合い、お客様と事業の双方に価値を届け続けることができました。" +
      "ここまで共に成し遂げてきたことを誇りに思うとともに、これからの数か月で何を実現できるのか、とても楽しみにしています。",
    rewritten:
      "素晴らしい四半期でした。\n\n" +
      "努力と協力、そして強い責任感に心から感謝します。共に大きな成果を上げ、互いを支え合い、確かな成果を残しました。" +
      "ここまでの歩みを誇りに思い、次の挑戦を楽しみにしています 🚀",
    /**
     * The post is Japanese here, so the "see translation" affordance shows English — the
     * mirror of the baseline, where an English post is shown translated into Spanish.
     */
    translated:
      "What a quarter!\n\nA huge thank you to the team for your hard work, collaboration, " +
      "and commitment. Together we've delivered great results, supported one another, and " +
      "made a real impact. Proud of everything we've achieved and excited for what's next. 🚀",
  },

  livestream: {
    title: "全社ミーティング 🙌",
    description:
      "8月の全社ライブ配信にぜひご参加ください。ひとつのチームとして集まり、成果を称え合い、" +
      "課題に向き合いながら、これから進む道を一緒に見つめる時間です。",
    comments: [
      { name: "江口 詩織", text: "質問があればコメントしてください 😊" },
      { name: "尾上 玲央", text: "共有ありがとうございます。" },
      { name: "小林 沙耶", text: "すごい勢いですね！" },
      { name: "安藤 康平", text: "いいですね、楽しみです :)" },
      { name: "原 杏奈", text: "質問があればコメントしてください 😊" },
      { name: "馬場 佳奈", text: "いい報告でした！" },
      { name: "山田 悠人", text: "シンガポールから参加中" },
    ],
    chapters: ["CEO挨拶", "四半期の振り返り", "主要な事業成果", "今後の展望"],
  },

  feed: {
    billboards: [
      {
        title: "考え、形にし、つながる",
        blurb: "「考え、形にし、つながる」イベントにぜひご参加ください…",
      },
      {
        title: "多様性とインクルージョンの取り組み",
        blurb: "当社は誰もが力を発揮できる環境づくりに取り組んでいます…",
      },
      {
        title: "カスタマーサミット",
        blurb: "まもなく開催のカスタマーサミットにぜひご参加ください…",
      },
    ],
    news: [
      { title: "生産性を高める新しい取り組み" },
      { title: "新入社員のための活躍ガイド" },
      { title: "優れたチームがつながり続ける理由" },
    ],
    mobileNews: [
      { title: "次のカスタマーイベントに向けた準備" },
      { title: "移動中の心の整え方" },
      { title: "AI活用を加速する" },
    ],
    spaces: [
      {
        name: "新入社員ネットワーク",
        description: "新しく加わった仲間が早く慣れ、必要な情報にたどり着けるように。",
      },
      {
        name: "AI・デジタル推進",
        description: "AIや自動化、新しい技術の可能性を探る場です。",
      },
      {
        name: "地域貢献活動",
        description: "ボランティアや募金活動の情報を共有しています。",
      },
    ],
    pages: [
      { title: "AIリソースセンター" },
      { title: "マネージャー向け資料" },
      { title: "人事ページ" },
    ],
    posts: [
      { title: "ボランティア募集を開始しました" },
      { title: "社員紹介：松岡 誠" },
      { title: "読書会：今月の一冊" },
    ],
    appPost: {
      document: {
        author: "山本 加奈",
        space: "新入社員",
        body:
          "プロフィールの確認や休暇の申請など、人事システムの主な機能をこの資料で一通り確認できます。",
        title: "人事システム 活用ガイド",
      },
      anniversary: {
        author: "中村 健一",
        body: "本日で10年になりました。この10年を支えてくださった皆さんに感謝します。",
      },
    },
    surveys: [
      { title: "四半期サーベイ" },
      { title: "AI活用サーベイ" },
      { title: "称賛に関するサーベイ" },
    ],
    sidePost: {
      headline: "ひとつの職場、ひとつの体験。",
      body:
        "共通のスペースや協働、そして文化を通じて、組織全体でどのようにつながりが生まれているかをご紹介します。",
    },
    event: {
      countdownName: "社員サミット",
      bannerTitle: "四半期キックオフ",
    },
    documents: [
      { name: "第3四半期 決算資料" },
      { name: "年次報告書.pdf" },
      { name: "ブランドガイドライン" },
      { name: "ロゴデータ.svg" },
    ],
    weather: {
      city: "東京",
      temperature: "11",
      high: "14",
      low: "9",
    },
    podcast: {
      show: "リーディング・フォワード",
      episode: "#8 · これからのリーダーシップ",
    },
  },

  stories: [
    {
      title: "カウントダウン開始 ⏱️",
      body:
        "年次「社員体験サミット」まで、あと19日となりました。世界中のチームが一堂に会し、" +
        "新しい働き方を探り、共通のビジョンのもとでつながり、これからの社員体験を形づくります。",
    },
    {
      title: "四半期パルスサーベイのご案内",
      body:
        "皆さんの声をお聞かせください。数分で回答でき、組織全体の改善に活かされます。" +
        "一人ひとりの意見が、より良い職場づくりにつながります。",
    },
    {
      title: "マネージャー研修 – 残り1ステップ 🚀",
      body:
        "ゴールはすぐそこです。最後のステップを完了すると、実践的な指針や資料、" +
        "次に取るべき行動が確認できるようになります。",
    },
    {
      title: "全社でAI活用を加速 ⚡",
      body:
        "AIは働き方を大きく変えています。必要な情報に素早くたどり着き、定型業務を自動化し、" +
        "より確かな判断ができるよう、全拠点で活用が広がっています。",
    },
  ],

  catchup: [
    { title: "ボランティアデーに400名が参加しました" },
    { title: "新しいラーニングセンターを訪ねて" },
  ],

  composed: {
    recipient: "佐藤 美咲",
    values: ["思いやりを大切に", "高い目標を掲げる", "全力で働き、全力で楽しむ", "自分らしく"],
    value: "思いやりを大切に",
    body:
      "佐藤 美咲さん、ウェルビーイングの取り組みをご牽引いただきありがとうございます。" +
      "その働きが、組織全体の健やかな職場づくりを支えています 💜",
  },

  spaces: {
    welcome: {
      title: "成長のためのスペース",
      body:
        "ようこそ。メンター制度やツール、各種サポートに関する情報をここにまとめています。",
    },
    directory: [
      {
        name: "リーダーシップの部屋",
        description: "経営からの発信、AMA、戦略アップデート、全社ミーティングの記録。",
      },
      {
        name: "管理職ネットワーク",
        description: "管理職のための指針と資料、そして意見交換の場。",
      },
      {
        name: "ラーニングハブ",
        description: "研修、ワークショップ、資格取得、キャリア開発に関する情報。",
      },
      {
        name: "人事",
        description:
          "福利厚生、各種規程、キャリア開発、評価に関する資料と社員向けサポートの窓口。",
      },
      {
        name: "年次社員サミット",
        description: "アジェンダ、登壇者、最新情報、当日の資料など必要な情報をすべて。",
      },
      {
        name: "お客様事例",
        description: "受注事例やケーススタディ、ビジネスへの影響をまとめています。",
      },
      {
        name: "ITサポート",
        description: "ヘルプデスクの案内、稼働状況、各種手順書。",
      },
      {
        name: "営業支援",
        description: "営業向けのプレイブック、競合情報、商談サポート。",
      },
      {
        name: "ランニング部",
        description: "コース情報、大会エントリー、ペースを問わない練習メニュー。",
      },
      {
        name: "ウェルビーイング",
        description: "メンタルヘルス支援、福利厚生、日々の健康づくりに役立つ情報。",
      },
    ],
    page: {
      about:
        "今年の年次社員サミットのページへようこそ。アジェンダ、交通・宿泊のご案内、登壇者情報、" +
        "よくある質問、ライブ配信の詳細、当日の資料まで、開催前に必要な情報をまとめています。",
      survey: {
        title: "社員サミット 交通手配サーベイ",
        meta: "6問・記名式",
      },
      post: {
        author: "松本 直樹",
        body:
          "👏 今年の社員サミットの準備を進めてくれた運営メンバーに、心から感謝します。" +
          "皆が集まる場をつくるために、何か月もの準備が舞台裏で重ねられてきました。" +
          "当日を迎えるのが本当に楽しみです。",
        credit: "社員サミット運営チーム",
      },
      featured: {
        story: "社員サミットのアジェンダを公開",
        page: "交通・宿泊のご案内",
        podcast: "サミット参加が初めての方へ",
      },
    },
  },

  spotlight: {
    journey: "新入社員オンボーディング 👋",
    quickLinks: ["給与", "福利厚生", "ITサポート", "ラーニング"],
    documents: ["安全衛生手順", "社員ハンドブック", "学習リソース", "各種規程"],
    news: [{ title: "社員紹介" }, { title: "学び続ける文化" }],
    event: {
      title: "社員サミット",
      when: "2026年8月13日（木）\n17:00 - 20:30",
    },
  },

  journeys: {
    phone: {
      title: "新入社員オンボーディング 👋",
      blurb:
        "オンボーディングは、新しく加わった方が組織になじみ、自分の役割を理解するための道筋です。",
      steps: [
        "ようこそ 🚀",
        "新入社員スペース",
        "オンボーディング概要",
        "はじめの一歩",
        "私たちの価値観",
        "オンボーディングサーベイ",
      ],
    },
    wall: [
      "IT・セキュリティ研修",
      "新入社員オンボーディング",
      "転勤に関する案内",
      "AI活用プログラム",
      "実践する企業文化",
      "育児休業制度",
      "リーダーシップ研修",
      "学び続ける文化",
      "職場のサステナビリティ",
    ],
  },

  signage: {
    translatedFrom: "スウェーデン語から翻訳",
    stories: [
      {
        author: "田中 陽子",
        action: "全社アップデートを投稿",
        scope: "全社",
        headline: "チームにとって大きな節目です 👏",
        body:
          "この節目を実現するために力を合わせてくれた世界中のチームに、心から感謝します。" +
          "音楽とクリエイターへの情熱、そして高い集中力が違いを生みました。" +
          "共に築いてきたものを誇りに思い、この先をとても楽しみにしています。",
        value: "情熱と革新",
      },
      {
        author: "小林 恵",
        action: "職場に関する投稿",
        scope: "ストックホルム本社",
        headline: "ストックホルムのスタジオが開設しました 🎧",
        body:
          "ハイブリッドなチーム、クリエイターとの協業、ライブ録音のために設計された空間です。" +
          "リスニングルームやポッドキャストスタジオは、Workvivo の予約ツールから利用できます。",
        value: "協働と遊び心",
      },
      {
        author: "高橋 亮",
        action: "プロダクトリリースを投稿",
        scope: "クリエイターチーム",
        headline: "Spotify for Artists: In Focus を全世界で公開 🚀",
        body:
          "次世代のアナリティクス、リアルタイムのリスナー分析、ファンとの直接的な収益化を、" +
          "世界中のインディペンデントなアーティストへ。部門を越えた大きな成果です。",
        value: "成長とインパクト",
      },
    ],
    article: {
      // The product name stays in Latin — Spotify does not localise it either — with a
      // Japanese descriptor so the card does not read as untranslated. Same treatment the
      // feed headline above gives it. 31 characters against the slot's 40.
      title: "Spotify for Artists：In Focus 特集",
      author: "小林 恵",
    },
    event: { title: "グローバル全社ミーティング" },
    anniversary: {
      name: "渡辺 翔太",
      note: "本日で入社2周年を迎えました！",
    },
  },

  newsletters: {
    items: [
      { title: "全社ミーティング", folder: "全社" },
      { title: "最新アップデート", folder: "更新情報" },
      { title: "金曜まとめ", folder: "レポート" },
      { title: "新しい仲間たち", folder: "Woofvivo" },
    ],
    folders: ["全社", "更新情報", "Woofvivo", "レポート", "ニュース"],
  },

  chat: {
    channel: "東京オフィス 👋",
    channelMeta: "# 723 · 東京オフィスへようこそ…",
    messages: [
      "おはようございます！調子はいかがですか？",
      "皆さん、先日の社員旅行の写真を共有します 😊",
      "とてもいいですね！",
      "企画ありがとうございました 👏",
      "ありがとうございます！当日の資料も共有いただけますか？ 😎",
    ],
    senders: ["加藤 明日香", "森田 拓也"],
    caller: "石井 麻衣",
    summary:
      "協働とつながり、そして共通の目標に重点を置いた社員旅行が開催されました。" +
      "参加者はコミュニケーションを深め、重点課題の認識を揃えるワークショップに取り組みました。" +
      "会場や会議スペース、各種アクティビティの手配は、参加者が滞りなく過ごせるよう調整され、" +
      "当日はスケジュールや現地対応をチーム全体で支えました。" +
      "今後の取り組みについても一部が共有され、詳細は数週間以内に案内される予定です。",
  },

  hq: {
    answer: {
      title: "休暇の申請",
      body:
        "休暇の申請方法は2つあります。HQ エージェントに依頼して自動で処理する方法と、" +
        "Workday から自分で手続きする方法です。",
    },
    results: [
      {
        title: "休暇制度について",
        space: "人事資料",
        description:
          "年次有給休暇、傷病休暇、祝日、特別休暇など、利用できるすべての休暇について、" +
          "付与日数、申請期限、承認の流れとあわせて説明しています。",
      },
      {
        title: "Workday での休暇申請手順",
        space: "新入社員",
        description:
          "Workday での申請・変更・取り消しの手順を、承認者や申請の目安時期とあわせて順を追って説明します。",
      },
    ],
    attachment: "休暇制度について.pdf",
    resultAuthor: "山本 加奈",
  },

  // The one line the model writes in the survey modal; the generated survey below it is
  // Workvivo's own fixed example. WorkvivoSurveyBuilder reads this slot directly.
  surveyBuilder: {
    prompt: "社員がいまどう感じているかを確かめるサーベイを作成します。",
  },

  article: {
    // Typed into the AI bar at 3163-3213, then the article below appears. PageBuilderScene
    // translates it BEFORE slicing it for the typing animation, so this whole line is what
    // gets typed — and it has to name the same subject as `title` two lines down, because
    // the viewer watches the request go in and this article come out fourteen frames later.
    prompt: "チームの生産性を高めるページを作成して",
    title: "チームの生産性",
    language: "日本語",
    lead:
      "生産性の向上は、効率よく働き、明確に伝え合い、共通の目標に集中できる環境をつくることから始まります。",
    heading: "認識を揃えるための重点領域",
    points: [
      {
        label: "明確な方向性",
        body: "チームの目標、担当範囲、測定できる成果を全員が理解している状態をつくります。",
      },
      {
        label: "率直なコミュニケーション",
        body: "定期的な対話と部門を越えた可視化によって、停滞の要因を取り除きます。",
      },
      {
        label: "優先順位の見極め",
        body: "不要な負荷を減らし、影響の大きい取り組みに力を集中させます。",
      },
    ],
    quote:
      "明確な優先順位とつながりのあるコミュニケーションが、日々の協働を確かな成果へと変えていきます。",
    quoteAuthor: "社員体験チーム",
    closing:
      "大きな目標を具体的な行動に分解することで、チームは共通の目的のもと、より速く前進できます。",
  },

  seer: {
    questions: [
      "業務に必要なツールやリソースが十分に提供されている",
      "上司から自分の仕事について有益なフィードバックを定期的にもらえている",
      "自分の貢献がチームに認められ、評価されていると感じる",
      "キャリアの成長と能力開発の機会が十分にある",
      "働きがいのある職場として、この組織を人に勧めたい",
    ],
    segments: [
      { name: "全社", kind: "すべて" },
      { name: "大阪", kind: "拠点" },
      { name: "東京", kind: "拠点" },
      { name: "CX", kind: "部門" },
      { name: "人事", kind: "部門" },
      { name: "IT", kind: "部門" },
      { name: "マーケティング", kind: "部門" },
      { name: "プロダクト", kind: "部門" },
      { name: "営業", kind: "部門" },
    ],
    topics: [
      "チームの協働",
      "職場環境",
      "従業員満足度",
      "職場の雰囲気",
      "競争環境",
      "社員の士気",
      "成果への評価",
      "同僚との関係",
      "職場の情報共有",
      "チームの力学",
    ],
    comments: [
      {
        driver: "ウェルビーイング",
        question: "仕事と生活のバランスをうまく保てている",
        body: "バランスを保つよう心がけていますが、難しく感じる時期もあります。",
      },
      {
        driver: "キャリア開発",
        question: "ここには成長できる機会が実際にある",
        body: "この四半期はとても良い研修を受けられました。",
      },
      {
        driver: "コミュニケーション",
        question: "チームの会議や情報共有は頻度も質も十分である",
        body: "しばらくチームで集まる機会がありません。",
      },
    ],
  },
} as const;

/**
 * Pre-merged to a whole `WorkvivoCopy`.
 *
 * `VideoInputProps["copy"]` is the complete type, so merging here rather than at the call
 * site keeps `Japanese.tsx` free of casts, and a mistyped path is caught by the merge
 * instead of showing up as one English screen nobody notices.
 */
export const JAPANESE_INPUT: Partial<VideoInputProps> = {
  copy: COPY.merge(PATCH),
};
