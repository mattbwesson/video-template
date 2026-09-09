/**
 * The Japanese cut's UI chrome — every product string the components render, keyed by
 * its English text. See src/customize/uiStrings.tsx for the mechanism.
 *
 * Product names stay as they are: Workvivo, Workday, Zoom, ServiceNow, Jira, Seer. So do
 * initialisms Japanese business writing uses verbatim (IT, CX, HR, PDF, GIF, CSV).
 * Hardcoded people's names become Japanese ones, matched to the copy table where the same
 * person appears there (Megan Wilson is 小林 恵 in both).
 *
 * `patterns` carry the strings with a number in them. They are tried in order after an
 * exact miss, so "3,251 Members" and "1 day ago ·" need no entry of their own.
 */
import type { UiStrings } from "../customize/uiStrings";

const exact: Record<string, string> = {
  // ── Side nav / top bar ───────────────────────────────────────────────────────
  "Home": "ホーム", "My Company": "会社情報", "Communications": "コミュニケーション",
  "Chat": "チャット", "Spaces": "スペース", "Admin": "管理", "EXPLORE": "探す",
  "News": "ニュース", "Events": "イベント", "Pages": "ページ", "Podcasts": "ポッドキャスト",
  "Survey & Forms": "アンケート・フォーム", "Surveys & Forms": "アンケート・フォーム",
  /**
   * The HQ capability fan, global 268-416, and the tagline under the lockup at 139-262.
   *
   * The KEY is the label with its newline collapsed to a space, because that is what
   * `useT` looks up — it normalises whitespace so a label split across source lines still
   * matches one dictionary entry. The VALUE keeps its "\n", which is what sets the
   * Japanese break; the English break is not the Japanese one. The box is 480px wide at 40px for a title and 23px for a subtitle, so a
   * title line has room for twelve characters and a subtitle for twenty; every line below
   * is inside that.
   */
  "Communication & Engagement": "コミュニケーション\nとエンゲージメント",
  "Reach, engage, and align every employee": "情報を届け、共感を生み、\n組織を一つに",
  "Search & Knowledge": "検索と\nナレッジ",
  "Find and access what you need instantly": "必要な情報に\nすぐにたどり着く",
  "People Intelligence": "ピープル\nインテリジェンス",
  "Turn signals into insight, action, and results": "シグナルを洞察に変え、\n行動と成果へ",
  // 19 ems against the English line's 21 at the same size, so it sits slightly narrower
  // than the English and needs no size adjustment of its own.
  "The AI-native employee experience platform": "AIネイティブの社員エクスペリエンスプラットフォーム",
  "Tools": "ツール",
  // The Catch Me Up story pills and the content-type list, global 689 and 886.
  "Anonymous": "匿名", "Shout-outs": "シャウトアウト", "Value updates": "価値観の投稿",
  "GIFs": "GIF",
  /**
   * The 104px headline beside the phone, global ~534-600. Three lines, and they have to
   * STAY three short lines: the block sits in about 620px beside the phone with
   * `whiteSpace: "pre"`, so it does not wrap and a long line runs off the frame. Six
   * characters a line is the most that fits at this size.
   */
  "Personalized Homepage Experiences": "一人ひとりに\n最適化された\nホーム画面",
  "Surveys": "アンケート", "Newsletters": "ニュースレター", "Journeys": "ジャーニー",
  "CONNECT": "つながる", "Connect": "つながる", "People": "メンバー", "Teams": "チーム",
  "Org Chart": "組織図", "RESOURCES": "リソース", "Resources": "リソース", "Apps": "アプリ",
  "Docs": "ドキュメント", "Gallery": "ギャラリー", "Search": "検索", "Inbox": "受信箱",
  "More": "その他", "My Work": "マイワーク", "Spotlight": "スポットライト", "Feed": "フィード",
  "Learn": "学ぶ", "Welcome": "ようこそ", "What’s going on,": "調子はどうですか、",
  "HQ agent": "HQ エージェント", "History": "履歴", "New chat": "新しいチャット",

  // ── Shared widget chrome ─────────────────────────────────────────────────────
  "View All": "すべて表示", "See All": "すべて表示", "View More": "もっと見る", "See more": "もっと見る",
  "Trending Spaces": "注目のスペース", "My Spaces": "マイスペース", "Corporate Spaces": "全社スペース",
  "Featured News": "注目のニュース", "Featured Pages": "注目のページ", "Featured Documents": "注目のドキュメント",
  "Featured Podcast": "注目のポッドキャスト", "Quick Links": "クイックリンク",
  "Upcoming Events": "今後のイベント", "UPCOMING EVENTS": "今後のイベント", "Headquarters & Livestream": "本社・ライブ配信",
  "Members": "メンバー", "Joined": "参加済み", "✓ Joined": "✓ 参加済み", "Join": "参加",
  "Request to Join": "参加をリクエスト", "New": "新着", "Corporate": "全社", "Social": "ソーシャル",
  "Global": "全社", "Everyone": "全員", "Posts": "投稿", "Post": "投稿", "Share": "共有", "Reply": "返信",
  "Comments": "コメント", "All Comments": "すべてのコメント", "reactions": "リアクション",
  "Leave a comment": "コメントを入力", "Leave a comment...": "コメントを入力…", "Leave a comment…": "コメントを入力…",
  "Write a message": "メッセージを入力", "Send message": "送信", "Start New Chat": "新しいチャット",
  "Summarise Content": "コンテンツを要約", "Summarize": "要約", "AI Summary": "AI要約",
  "Team Updates": "チームの最新情報", "Expand": "展開", "Open": "開く", "Open Fullscreen": "全画面で開く",
  "Start Survey": "アンケートに回答", "Start": "開始", "Countdown": "カウントダウン",
  "Days": "日", "Hours": "時間", "Minutes": "分", "Just now": "たった今",
  "posted a document.": "がドキュメントを投稿しました", "posted an article": "が記事を投稿しました",
  "posted a Shout-out.": "がシャウトアウトを投稿しました", "is celebrating a work anniversary.": "が勤続記念日を迎えました",
  "Hooray to:": "おめでとう：", "Value:": "価値観：", "Attachments(1)": "添付ファイル(1)",
  "PDF document": "PDFドキュメント", "Document": "ドキュメント", "Documents": "ドキュメント",
  "Videos": "動画", "Video": "動画", "Image": "画像", "Article": "記事", "Event": "イベント",
  "Podcast": "ポッドキャスト", "Livestream": "ライブ配信", "LIVE": "ライブ", "LIVE REPLAY": "ライブのリプレイ",
  "Chapters": "チャプター", "Find out more": "詳しく見る", "Learn more": "詳細", "Edit": "編集",
  "Close": "閉じる", "Back": "戻る", "Previous": "前へ", "Skip": "スキップ", "Add": "追加", "OK": "OK",
  "Options": "オプション", "Manage": "管理", "Setup": "設定", "Active": "有効", "Default": "既定",
  "Name": "名前", "Category": "カテゴリ", "Sort By": "並び替え", "Most Relevant": "関連度順",
  "Date": "日付", "Created By": "作成者", "Space": "スペース", "Team": "チーム", "All": "すべて",
  "ABOUT": "概要", "SPACE ADMINS": "スペース管理者", "Ask a Question": "質問する",
  "Give a Shout-out": "シャウトアウトを送る", "Give a Shout-Out": "シャウトアウトを送る",
  "Post a Value Update": "価値観を投稿", "Select Value": "価値観を選択", "Organization Value": "組織の価値観",
  "Normal Text": "標準テキスト", "Translations": "翻訳", "Attachment": "添付", "Poll": "投票",
  "Campaign": "キャンペーン", "Tag": "タグ", "GIF": "GIF", "Go Live": "ライブ配信",
  "Catch Me Up": "キャッチアップ", "Catch up on what you missed": "見逃した情報をチェック",
  "Here's what you missed": "見逃した情報はこちら", "A breakdown of this weeks plans": "今週の予定のまとめ",
  "Turn Off": "オフにする", "Unmute": "ミュート解除", "Leave": "退出", "End Stream": "配信を終了",
  "watching, started streaming": "人が視聴中・配信中", "Search Connect": "つながりを検索",
  "Search Manager Insights Action": "マネージャーインサイトのアクションを検索",
  "Content Search": "コンテンツ検索", "People Directory": "メンバー一覧", "steps completed": "ステップ完了",

  // ── Time and dates without a number in them ──────────────────────────────────
  "Published 1 day ago": "1日前に公開", "Published 1 day ago ·": "1日前に公開 ·", "Published 1 week ago": "1週間前に公開",
  "Published 2 days ago": "2日前に公開", "Published 4 days ago": "4日前に公開", "Posted 1 day ago": "1日前に投稿",
  "Posted 2 hours ago": "2時間前に投稿", "Jul": "7月", "JUN": "6月", "AUG": "8月", "10th July": "7月10日",
  "11:37 AM": "午前11:37", "Monday, March 27": "3月27日（月）", "Round 6 (2026/06/15)": "第6回（2026/06/15）",
  "Added June 23rd, 2025 (1 year ago)": "2025年6月23日に追加（1年前）",
  "Published May 23rd, 2026 (1 month ago)": "2026年5月23日に公開（1か月前）",
  "June 10th, 2026": "2026年6月10日", "June 14th, 2026": "2026年6月14日", "June 15th, 2026": "2026年6月15日",
  "June 10, 2026 12.00AM": "2026年6月10日 0:00", "June 11, 2026 11.00AM": "2026年6月11日 11:00",
  "June 12, 2026 10.00AM": "2026年6月12日 10:00", "June 17, 2026 10:00AM": "2026年6月17日 10:00",
  "Jan 15, 2026": "2026年1月15日", "Latency:2.0s": "遅延: 2.0秒", "30fps": "30fps",

  // ── People hardcoded in the chrome (names from the copy where they overlap) ──
  "Megan Wilson · 3 days ago ·": "小林 恵 · 3日前 ·", "Arjun Sharma": "高橋 亮",
  "John Tobin · 2 days ago": "田村 拓海 · 2日前", "Sarah Black · 2 days ago": "石田 彩 · 2日前",
  "Sonya Clarke · 1 day ago": "西村 紗希 · 1日前", "Cody Brown · 1 week ago ·": "岡田 大輝 · 1週間前 ·",
  "Jacob Johnson · 1 day ago ·": "藤井 陽太 · 1日前 ·", "· 3 days ago · New Hires": "· 3日前 · 新入社員",
  "Aoife Byrne": "青木 結衣", "Lena Fischer": "松田 玲奈", "Marcus Hale": "井上 誠", "Priya Raman": "山口 美月",
  "Tom Okafor": "村田 智也", "New Hires": "新入社員", "Human Resources": "人事", "IT": "IT", "CX": "CX",
  "Marketing": "マーケティング", "Sales": "営業", "Product": "プロダクト", "Boston": "大阪", "London": "東京",
  "Location": "拠点", "Department": "部門", "All Segments": "すべて",

  // ── Right column pseudo-copy ──────────────────────────────────────────────────
  "Run Club": "ランニング部",
  "For runners of every level. Share routes, training tips, race updates, and celebrate milestones together.":
    "レベルを問わず走る仲間のためのスペース。コース、練習のコツ、大会情報を共有し、節目を一緒に祝いましょう。",
  "Join colleagues from across the organization for an evening of updates, recognition, networking, and....":
    "全社の仲間が集まり、最新情報や表彰、交流を楽しむ夜。ぜひご参加ください…",

  // ── Mobile ────────────────────────────────────────────────────────────────────
  "Benefits Hub": "福利厚生", "Employee Handbook": "社員ハンドブック", "IT Support": "ITサポート",
  "Learning Centre": "ラーニングセンター", "Learning Resources": "学習リソース", "Payroll": "給与",
  "Safety Procedures": "安全衛生手順", "View Event": "イベントを見る",

  // ── Spaces / space page ───────────────────────────────────────────────────────
  "Q&A": "Q&A",

  // ── HQ search / chat ──────────────────────────────────────────────────────────
  "1 Attachment": "添付ファイル1件", "6.3 MB": "6.3 MB", "756 KB": "756 KB", "Share Point": "SharePoint",
  "Date Requested:": "申請日：", "Request ID:": "申請ID：", "Status:": "ステータス：",
  "Submitted to Manager for Approval": "上長の承認待ち", "Perfect! ✅": "完了しました！✅",

  // ── Widget store / list ───────────────────────────────────────────────────────
  "Widget Store": "ウィジェットストア", "Widget Categories": "ウィジェットのカテゴリ", "Browse by category": "カテゴリから探す",
  "Start with a category—or jump straight to search.": "カテゴリから探す。検索でもすぐに。",
  "Curated widgets for comms, culture, and everyday work—organized the way people actually browse.":
    "社内コミュニケーション、文化、日々の業務のためのウィジェットを、実際の使われ方に沿って整理しました。",
  "Discover": "見つける", "Productivity": "生産性", "Stay Informed": "最新情報", "Media": "メディア",
  "Technical": "テクニカル", "See all widgets": "すべてのウィジェット", "View Widgets": "ウィジェットを見る",
  "Shortcuts, apps, docs, and journeys.": "ショートカット、アプリ、ドキュメント、ジャーニー。",
  "Podcasts, video, and embeds.": "ポッドキャスト、動画、埋め込み。", "News, events, announcements, and more.": "ニュース、イベント、お知らせなど。",
  "Spaces and people in motion.": "スペースとメンバーの動き。", "Skills and serialized learning.": "スキルと段階的な学習。",
  "Time off, weather, live data.": "休暇、天気、ライブデータ。", "Make your landing page feel alive.": "ランディングページに動きを。",
  "Time Off": "休暇", "Billboards": "ビルボード",
  "Access your most important resources and tools instantly with customizable shortcuts.": "よく使うリソースやツールに、カスタマイズできるショートカットからすぐにアクセス。",
  "Apps provides you with instant access to essential productivity tools.": "業務に欠かせないツールにすぐアクセスできます。",
  "Billboards serve as a platform for promoting and showcasing your desired content.": "ビルボードは、伝えたいコンテンツを発信・紹介するためのプラットフォームです。",
  "Catch up on the latest episodes from your favorite shows and discover new content.": "お気に入り番組の最新エピソードをチェックし、新しいコンテンツに出会えます。",
  "Explore curated pages and resources handpicked for your team and interests.": "チームや関心に合わせて選ばれたページやリソースを探せます。",
  "Get the latest updates and announcements from across your organization in one place.": "全社の最新情報とお知らせをひとつの場所で。",
  "Join the conversation in the most active community spaces.": "最も活発なコミュニティスペースの会話に参加しましょう。",
  "Stay updated , designed to keep you informed about all the exciting activities on the horizon.": "これから予定されているイベントや活動を見逃さないために。",
  "Stay updated with the latest posts in your activity feed.": "アクティビティフィードの最新の投稿をチェック。",
  "Track your vacation days and plan your next break to recharge and stay balanced.": "休暇の残日数を確認し、次の休みを計画してリフレッシュを。",

  // ── Integrations ──────────────────────────────────────────────────────────────
  "Integrations": "連携", "INTEGRATIONS": "連携", "Integrations Marketplace": "連携マーケットプレイス",
  "Search Integrations": "連携を検索", "See all Integrations": "すべての連携", "View Integrations": "連携を見る",
  "HR & People": "人事・メンバー", "IT & Support": "IT・サポート", "IT & Support Integrations": "IT・サポートの連携",
  "Calendar": "カレンダー", "Social Media": "ソーシャルメディア", "Add Social Media Integrations": "ソーシャルメディア連携を追加",
  "Add Payrolls, HR and other people Integrations": "給与・人事などの連携を追加",
  "Get a  from your provider/Calendar Integrations": "カレンダー連携を追加",
  "The integrations setup is explained on": "連携の設定方法はこちら：", "Workvivo Help Center": "Workvivo ヘルプセンター",
  "Apple Calendar": "Apple カレンダー", "Yahoo Calendar": "Yahoo カレンダー", "IT Service Management": "ITサービス管理",
  "Gmail, Drive, Calendar,": "Gmail、ドライブ、カレンダー、",
  "Outlook Mail, Outlook Calendar, MS Teams Chat, Sharepoint +5": "Outlook メール、Outlook 予定表、Teams チャット、SharePoint ほか5件",
  "Quick Access widget, Zoom Mail, Zoom Calendar, Zoom Whiteboards +2": "クイックアクセス、Zoom Mail、Zoom Calendar、Zoom Whiteboard ほか2件",
  "Connect Jira to Workvivo to streamline project tracking and enhance team collaboration.": "Jira と連携して、プロジェクトの進捗管理とチームの協働をスムーズに。",
  "Connect to Jira and Confluence to streamline workflows and enhance team collaboration.": "Jira と Confluence に連携して、ワークフローと協働を効率化。",
  "Connect to ServiceNow to sync IT tickets, employee service requests, and workflows.": "ServiceNow と連携して、ITチケットや各種申請、ワークフローを同期。",
  "Connect to Workday to sync employee profiles, organizational data, and workforce information.": "Workday と連携して、社員プロフィールや組織情報を同期。",
  "Jump directly into your favorite Google apps and files with convenient, time-saving shortcuts.": "よく使う Google アプリやファイルにショートカットからすぐアクセス。",
  "Keep track of your schedule and events with ease using the Yahoo Calendar integration.": "Yahoo カレンダー連携で予定やイベントを手軽に管理。",
  "Quickly access Outlook, Teams, and other Microsoft 365 apps with a single click.": "Outlook、Teams などの Microsoft 365 アプリにワンクリックでアクセス。",
  "Securely share, manage, and collaborate on files with team members and external partners.": "社内外のメンバーと安全にファイルを共有・管理・共同編集。",
  "Start or join meetings, share screens, and collaborate in real-time with this integration.": "会議の開始や参加、画面共有、リアルタイムの協働をこの連携から。",
  "Sync your Apple Calendar to view events and schedules directly within the platform.": "Apple カレンダーを同期して、予定をプラットフォーム内で確認。",

  // ── Admin hub ─────────────────────────────────────────────────────────────────
  "Admin Hub": "管理ハブ", "Admin Tools": "管理ツール", "Search admin": "管理項目を検索", "Manage Favourites": "お気に入りを管理",
  "Manage People": "メンバー管理", "Moderation": "モデレーション", "Reported Content": "報告されたコンテンツ",
  "Products": "プロダクト", "Analytics": "分析", "Campaigns": "キャンペーン", "Workvivo TV": "Workvivo TV", "Awards": "表彰",
  "What's New": "新機能",
  "Bring company news and updates to every screen across your workplace.": "会社のニュースと最新情報を職場のあらゆる画面へ。",
  "Capture feedback, understand sentiment, make informed decisions.": "フィードバックを集め、雰囲気を把握し、根拠ある判断を。",
  "Celebrate achievements and recognize great work across your organization.": "成果を称え、組織全体の優れた働きを認め合う。",
  "Create engaging newsletters that keep everyone informed and connected.": "全員に情報が届き、つながりを保つニュースレターを。",
  "Guide employees through personalized key workplace moments.": "職場の大切な節目を、一人ひとりに合わせて案内。",
  "Measure engagement, uncover trends, and turn insights into action.": "エンゲージメントを測り、傾向をつかみ、行動につなげる。",
  "Plan, launch, and measure impactful internal communication campaigns.": "社内コミュニケーション施策を計画・実施・測定。",
  "Turn insights into meaningful actions with AI-powered recommendations.": "AIの提案で、インサイトを意味のある行動へ。",

  // ── Newsletters ───────────────────────────────────────────────────────────────
  "Create Newsletter": "ニュースレターを作成", "Recent Newsletters": "最近のニュースレター", "Search Newsletters": "ニュースレターを検索",
  "View Folders": "フォルダを表示", "Folders": "フォルダ", "Drafts": "下書き", "Scheduled": "予約済み", "Sent": "送信済み",
  "Segments": "セグメント", "Layouts": "レイアウト", "Components": "コンポーネント", "Content": "コンテンツ", "Design": "デザイン",
  "Full Width": "全幅", "One Third": "1/3", "Two Thirds": "2/3", "Heading": "見出し", "Heading text": "見出しテキスト",
  "Text": "テキスト", "Button": "ボタン", "Hero": "ヒーロー", "Spacer": "スペーサー", "Divider": "区切り線", "Update": "アップデート",
  "Save as Draft": "下書きとして保存", "Save as Template": "テンプレートとして保存",

  // ── Journeys ──────────────────────────────────────────────────────────────────
  "Share a Message": "メッセージを共有", "Create a custom message": "カスタムメッセージを作成", "Share Org Chart": "組織図を共有",
  "Share your companies structure": "会社の組織構成を共有", "Share an Update": "アップデートを共有", "Share an existing update": "既存のアップデートを共有",
  "Share Values": "価値観を共有", "Share your companies values": "会社の価値観を共有", "Enroll to a Space": "スペースに登録",
  "Automatically add to a space": "スペースに自動で追加", "Share an Article": "記事を共有", "Share and existing article": "既存の記事を共有",
  "Share a Page": "ページを共有", "Share existing page": "既存のページを共有", "Share a Link": "リンクを共有", "Share any URL": "任意のURLを共有",
  "Share a Survey": "アンケートを共有", "Share an existing survey": "既存のアンケートを共有", "Assign a Badge": "バッジを付与",
  "Reward with a badge": "バッジで称える", "A message has been shared with you": "メッセージが共有されました",
  "A page has been shared with you": "ページが共有されました", "A survey has been shared with you": "アンケートが共有されました",
  "An article has been shared with you": "記事が共有されました", "You have been enrolled in a space": "スペースに登録されました",
  "View your companies values": "会社の価値観を見る",

  // ── Seer ──────────────────────────────────────────────────────────────────────
  "Seer Insights": "Seer インサイト", "Manage Seer Insights": "Seer インサイトを管理", "Seer AI": "Seer AI",
  "Engagement": "エンゲージメント", "Drivers": "ドライバー", "Driver": "ドライバー", "Values": "価値観", "Value": "価値観",
  "Radar": "レーダー", "Segment": "セグメント", "NPS Category": "NPSカテゴリ", "Topic": "トピック", "Prescriptive": "提案",
  "Starred": "スター付き", "Popular Topics": "注目のトピック", "Summary": "サマリー", "Sentiment": "感情",
  "Very Positive": "とても良い", "Positive": "良い", "Negative": "悪い", "Very Negative": "とても悪い",
  "Export CSV": "CSVを書き出す", "Overview": "概要", "Metrics": "指標", "Score": "スコア", "Score Change": "スコアの変化",
  "Company Score": "全社スコア", "Completion Rate": "完了率", "Response Rate": "回答率", "Responses": "回答", "Completions": "完了",
  "Completed Rounds": "完了したラウンド", "Participants": "参加者", "Frequency": "頻度", "Survey Duration": "実施期間",
  "Survey Status": "実施状況", "Next Survey": "次回のサーベイ", "Previous Survey": "前回のサーベイ", "Out of": "／",
  "Engagement Score Timeline": "エンゲージメントスコアの推移", "Engagement Question Asked": "エンゲージメント設問",
  "Promoters": "推奨者", "Passives": "中立者", "Detractors": "批判者", "Team’s Engagement Score": "チームのエンゲージメントスコア",
  "Manager Insights": "マネージャーインサイト", "Manager Overview": "マネージャー概要", "Managers": "マネージャー",
  "Direct Reports": "直属の部下", "Total Reports": "部下の総数", "Individual Contributor": "個人貢献者",
  "Welcome to Your Manager Insights": "マネージャーインサイトへようこそ",
  "Here, you can see how your team is feeling and what they think. This dashboard helps you spot any issues, understand team opinions, and take steps to make things better.":
    "チームの状態や意見をここで確認できます。このダッシュボードで課題に気づき、チームの声を理解し、改善への一歩を踏み出しましょう。",
  "Wellbeing": "ウェルビーイング", "My Job": "仕事内容", "Culture and Values": "文化と価値観", "Career Development": "キャリア開発",
  "Compensation and Benefits": "報酬と福利厚生", "Senior Leadership": "経営層", "Reward and Recognition": "評価と称賛",
  "Empowerm...": "裁量…", "Team Collaboration": "チームの協働", "Work Environment": "職場環境", "Employee Satisfaction": "従業員満足度",
  "Workplace Atmosphere": "職場の雰囲気", "Competitive Environment": "競争環境", "Employee Morale": "従業員の士気",
  "Performance Recognition": "成果への評価", "Coworker Relationships": "同僚との関係", "Workplace Communication": "職場の情報共有",
  "Team Dynamics": "チームの力学",
  "I am provided with the necessary tools and resources I need to do my job": "業務に必要なツールやリソースが十分に提供されている",
  "My manager gives me regular, helpful feedback on my work": "上司から自分の仕事について有益なフィードバックを定期的にもらえている",
  "I feel my contributions are recognized and valued by my team": "自分の貢献がチームに認められ、評価されていると感じる",
  "I have good opportunities for career growth and professional development": "キャリアの成長と能力開発の機会が十分にある",
  "I would recommend our organization as a great place to work": "働きがいのある職場として、この組織を人に勧めたい",
  "I can effectively manage my work-life balance": "仕事と生活のバランスをうまく保てている",
  "I am given real opportunities to grow here": "ここには成長できる機会が実際にある",
  "I enjoy the kind of work I do": "自分の仕事の内容にやりがいを感じる",
  "Team meetings and communication are frequent and of high quality": "チームの会議や情報共有は頻度も質も十分である",
  "I try my best to manage my work-life balance, but it can be challenging at times.": "バランスを保つよう心がけていますが、難しく感じる時期もあります。",
  "I've received great training over the last quarter": "この四半期はとても良い研修を受けられました。",
  "We haven't had a team meeting in a while.": "しばらくチームで集まる機会がありません。",
  "Agree": "そう思う", "Neutral": "どちらでもない",
  "Disagree": "そう思わない", "Add Comment": "コメントを追加", "Survey Completed": "回答が完了しました",
  "Thanks for taking the time to complete our survey. Your feedback is important to us.": "アンケートへのご回答ありがとうございました。皆さんの声を大切にします。",

  // ── Analytics ─────────────────────────────────────────────────────────────────
  "Analytics & Reporting": "分析とレポート", "Snapshot": "スナップショット", "Activation": "アクティベーション",
  "Advanced Usage": "詳細な利用状況", "Advanced Content": "詳細なコンテンツ", "Governance": "ガバナンス",
  "Activity Feed": "アクティビティフィード", "Bookmarks": "ブックマーク", "Following": "フォロー中", "Recent Updates": "最近の更新",
  "Reported": "報告済み", "Activation Rate": "アクティベーション率", "Onboarding Rate": "オンボーディング率",
  "Mobile App Users": "モバイルアプリ利用者", "Profile Picture Upload": "プロフィール写真の設定", "Profile": "プロフィール",
  "Monthly Active Users": "月間アクティブユーザー", "Weekly Active Users": "週間アクティブユーザー", "Daily Active Users": "日間アクティブユーザー",
  "% of Monthly Active over Time users": "月間アクティブユーザーの推移（%）", "Shown as % active users in selected time period": "選択期間のアクティブユーザー率で表示",
  "Date From": "開始日", "Date To": "終了日", "Primary Team": "主担当チーム", "Secondary Team": "副担当チーム", "Tertiary Team": "第三チーム",
  "Revert to Old Version": "旧バージョンに戻す",
  "Jan 2026": "2026年1月", "Feb 2026": "2026年2月", "Mar 2026": "2026年3月", "Apr 2026": "2026年4月", "May 2026": "2026年5月", "Jun 2026": "2026年6月",
  "Dec 1, 2025": "2025年12月1日", "Dec 7, 2025": "2025年12月7日", "Jan 1, 2026": "2026年1月1日", "Feb 1, 2026": "2026年2月1日",
  "Mar 1, 2026": "2026年3月1日", "Apr 1, 2026": "2026年4月1日", "May 1, 2026": "2026年5月1日", "Jun 1, 2026": "2026年6月1日", "Jun 14, 2026": "2026年6月14日",

  // ── AI compose ────────────────────────────────────────────────────────────────
  "AI Compose Settings": "AI作成の設定", "Compose": "作成", "Writing Profiles": "文体プロファイル", "Add new profile": "プロファイルを追加",
  "Brand Voice": "ブランドボイス", "CEO Voice": "CEOボイス", "Internal Comms": "社内広報",
  "Workvivo AI for your Organization": "組織向け Workvivo AI",
  "Allow users to choose a writing profile to tailor AI output to a specific role or audience.": "役割や読み手に合わせてAIの文章を調整できるよう、文体プロファイルを選べるようにします。",
  "Use Workvivo AI assistance and prompts to create and revise updates, articles and comments.": "Workvivo AI の支援とプロンプトで、アップデート・記事・コメントを作成・推敲できます。",
  "By enabling AI, users in your organization can access and utilize Workvivo AI.": "AIを有効にすると、組織のユーザーが Workvivo AI を利用できるようになります。",

  // ── Weather enum, rendered as its own label beside the icon ───────────────────
  "Rainy": "雨", "Sunny": "晴れ", "Partly Cloudy": "晴れ時々曇り", "Cloudy": "曇り", "Snow": "雪",

  // ── Space page right rail ─────────────────────────────────────────────────────
  "FEATURED STORY": "注目のストーリー", "FEATURED PAGE": "注目のページ", "FEATURED PODCAST": "注目のポッドキャスト",

  // ── FIXED_COPY: the locked beats the research pass never rewrites ─────────────
  // These are copy, not chrome, but they are fixed by design (they name Workvivo's own
  // features and demo the product's own flows), so they are not in the customer copy
  // table and reach the screen through ui() like everything else.
  "Every employee deserves a headquarters.": "すべての社員に、本社を。",
  // Four reveal cards, one word each. The VO says それが今実現します。 at 3.6s; these are
  // that sentence cut on its own joints, with the fourth card empty rather than splitting
  // 実現します across two.
  "Now": "それが、", "they": "今", "have": "実現します。", "one.": "",
  "Personalized": "一人ひとりに合わせた", "Homepage": "ホームページ", "Experiences": "体験",
  "Smart Chapters": "スマートチャプター", "Summarize with AI": "AIで要約",
  "Your Voice Matters": "あなたの声が力になる",
  "A dedicated space to explore, discuss, and act on Employee Insights.": "従業員インサイトを探り、話し合い、行動につなげるためのスペース。",
  "Lee Johnson": "斎藤 健", "Rachel Lopez": "三浦 恵子", "Jay Lee": "小川 拓也", "Megan Wilson": "小林 恵",
  "Manager Insights Action Hub": "マネージャーインサイト アクションハブ",
  "We're sharing our latest insights and updates on the actions being taken based on the feedback we've received last week. This document highlights key themes, opportunities, and the steps we're taking to continue improving the employee experience. Thank you to everyone who continues to share their perspectives! Your feedback helps guide meaningful change and shape the future of our organization 👏":
    "先週いただいたフィードバックをもとに進めている取り組みと、最新のインサイトを共有します。この資料では、主なテーマ、改善の機会、そして従業員体験をさらに良くするためのステップをまとめました。声を寄せ続けてくださる皆さんに感謝します。皆さんのフィードバックが、意味のある変化と組織の未来を形づくります 👏",
  "The Complete Guide to our HR System": "人事システム 活用ガイド",
  "Thanks for sharing!": "共有ありがとうございます！", "Was waiting for this one": "これを待っていました",
  "A New Hire's Guide to Success": "新入社員のための活躍ガイド",
  "Management Enablement Session": "マネジメント研修セッション", "Conference Room B": "会議室B",
  "We Hear You: Acting on Your Feedback": "声を受け止め、行動に変える",
  "We share how listening to feedback helps us uncover insights, take action, and create a better workplace experience.": "フィードバックに耳を傾けることが、どのように気づきを生み、行動につながり、より良い職場体験をつくるのかをお伝えします。",
  "Why We Value Your Feedback": "なぜフィードバックを大切にするのか",
  "Feedback is one of the most valuable assets an organization can have. It surfaces blind spots that internal teams can't see, highlights friction points before they become crises, and signals what's working well enough to double down on. When people feel heard, trust grows. When trust grows, engagement follows. And engaged employees, customers, and partners are the foundation of any thriving organization. The cost of ignoring feedback, on the other hand, is steep: turnover rises, loyalty erodes, and the same problems resurface year after year.":
    "フィードバックは、組織にとって最も価値ある資産のひとつです。内側からは見えない盲点を明らかにし、摩擦が危機になる前に知らせ、うまくいっていることを教えてくれます。\n\n" +
    "声が届いていると感じられれば信頼が育ち、信頼が育てばエンゲージメントが高まります。そして、意欲ある社員、顧客、パートナーこそが、成長する組織の土台です。\n\n" +
    "一方で、フィードバックを無視する代償は大きく、離職は増え、信頼は薄れ、同じ問題が毎年繰り返されます。",
  "Turning Feedback Into Action": "フィードバックを行動へ",
  "We believe feedback is only valuable when it leads to meaningful action. By listening closely to the experiences, ideas, and perspectives shared with us, we gain a clearer understanding of what's working well and where there are opportunities to improve. Feedback helps us identify areas for growth, remove barriers, and make informed decisions that create a better experience for everyone. Taking action on feedback shows that every voice matters. It helps strengthen trust, improve communication, and build a culture where people feel encouraged to share openly. By turning insights into meaningful changes, we can continue to evolve, address challenges, and create a more connected and engaged organization.":
    "フィードバックは、意味のある行動につながって初めて価値を持つと私たちは考えています。寄せられた経験や考え、視点に丁寧に耳を傾けることで、何がうまくいき、どこに改善の余地があるのかがはっきり見えてきます。\n\n" +
    "フィードバックは成長すべき領域を示し、障壁を取り除き、全員にとってより良い体験をつくる判断の根拠になります。\n\n" +
    "フィードバックに行動で応えることは、すべての声に意味があると示すことです。信頼を強め、コミュニケーションを改善し、率直に話せる文化を育てます。気づきを具体的な変化に変え続けることで、私たちは進化し、課題に向き合い、よりつながりと意欲のある組織をつくっていけます。",
  "What is our time off policy?": "休暇制度について教えて",
  "Can you book me a day off?": "休暇を1日申請してもらえますか？",
  "Sure! I will book the day off on Workday for you. What date would you like to book?": "はい、Workday で休暇を申請します。希望日はいつですか？",
  "20th of February": "2月20日",
  "Your day off request for February 20th has been successfully submitted to your manager for approval. You'll be notified once it's approved.": "2月20日の休暇申請を上長に送信しました。承認されると通知が届きます。",
  "Brainstorm Meeting": "ブレスト会議", "Write a short paragraph about today": "今日について短い文章を書いて",
  "Product sync": "プロダクト定例", "What meetings do I have today?": "今日の会議は？", "Customer Presentation": "顧客向けプレゼン",
  /**
   * "Back from time off?" — four slots that animate in sequence: `Back` sits alone,
   * then the rest track out from behind it. The Japanese is 休暇明け？, which is two
   * slots' worth, so the last two are empty and the gap between the first two is zero
   * (see `wordGap` below). "Back" cannot be used as the key — it is the survey's back
   * button (戻る, above) — so the beat is carried by the three slots that remain.
   * The VO says 休暇明けも大丈夫 at 24.6s, directly under this card.
   *
   * Scoped keys: "Back" alone is the survey's back button (戻る), and the flat lookup gave
   * this card 戻る休暇明け？. The scene passes ctx "timeoff", so these win here only.
   */
  "timeoff/Back": "休暇", "timeoff/from": "明け？", "timeoff/time": "", "timeoff/off?": "",
  "Amplify": "広げる", "Reach": "届ける",
  // The VO reads 質問から回答へ、そして完了まで。 under these three cards; the nouns match it
  // and read better as single words than the verbs 聞く/答える did.
  "Ask": "質問", "Answer": "回答", "Job Done": "完了",
  "Create your own": "自分でつくる", "AI Widget Builder": "AIウィジェットビルダー",
  // lead + two tail slots. Was その先へ 数字を 超えて — English clause order, and the
  // particle を stranded before a verb that reads as a second predicate. The VO says
  // 数字の先にあるものを明らかに at 147.9s, under this card.
  "Go beyond": "数字の", "the": "先へ。", "numbers": "",
  "How can I help you?": "何をお手伝いしましょうか？", "Key Business Results": "主要な事業成果",

  // ── Stragglers from the frame sweep ───────────────────────────────────────────
  "Images": "画像", "Polls": "投票", "News articles": "ニュース記事",
  "Customer Success": "カスタマーサクセス", "Data & Insights": "データ・インサイト", "Engineering": "エンジニアリング",
  "People Ops": "ピープルオペレーション", "Product Design": "プロダクトデザイン",
  "2 Weeks": "2週間", "Inactive": "未実施", "Monthly": "毎月", "Not Started": "未開始",
  "AI can make mistakes. Review for accuracy.": "AIは間違えることがあります。内容を確認してください。",
  "All sources": "すべてのソース", "Thinking for 3s": "3秒間考え中", "Next": "次へ", "Submit": "送信",
  "Communication": "コミュニケーション", "Score: Engagement": "スコア：エンゲージメント",
  "Strongly Agree": "強くそう思う", "Strongly Disagree": "全くそう思わない",

  // ── Scenes ────────────────────────────────────────────────────────────────────
  /**
   * "No matter where they are" — five slots, because the reference brings the words up
   * one at a time and the last three do not share a fade. The Japanese is どこにいても
   * つながる, which is three slots' worth, so the last two are empty, the same shape as
   * the "Go beyond" and "Back from time off?" cards above. The gap between the slots is
   * zero (see `wordGap` below), so the three that carry text read as one line.
   *
   * Scoped: "No" and "are" alone are ordinary UI words elsewhere in the film, and a flat
   * entry for them would rewrite every one of those. The scene passes ctx "nomatter".
   */
  "nomatter/No": "どこに", "nomatter/matter": "いても", "nomatter/where": "つながる",
  "nomatter/they": "", "nomatter/are": "",

  // ══ Pages, surveys and the admin hub — the five sequences added after the first
  //    translation pass (global 2760, 3109, 4253, 4585, 5166) ═══════════════════════

  // ── Zoom Docs-style page editor, and the block types that fly past the prompt ──
  "Add Page": "ページを追加", "Add Icon": "アイコンを追加", "Add Cover Image": "カバー画像を追加",
  "Untitled": "無題", "Normal": "標準", "English": "英語",
  "Heading 1": "見出し1", "Heading 2": "見出し2", "Heading 3": "見出し3",
  "List": "リスト", "Embed": "埋め込み", "Table": "表", "Callout": "コールアウト",
  // The pill on the editor, and the same words as a category tile in the admin fan.
  "Help me write": "書くのを手伝う", "Help Me Write": "書くのを手伝う",
  // Rendered as two spans on one row: "Workvivo AI" + " " + "is generating..." — so the
  // particle has to live on the second half or the line reads without one.
  "Workvivo AI": "Workvivo AI", "is generating...": "が生成中...",
  "Stop": "停止",

  // ── Survey builder: the add-question list, the action bar, the AI modal ───────
  "Add Question": "質問を追加", "Required": "必須", "Duplicate": "複製", "Delete": "削除",
  "Short Text": "短文", "Paragraph": "長文", "Multiple Choice": "選択式",
  "Checkbox": "チェックボックス", "Number Line": "数値スケール", "File Upload": "ファイルアップロード",
  "Date and Time": "日付と時刻", "Dropdown": "ドロップダウン", "Contact Field": "連絡先フィールド",
  "Create a Survey or Form with Workvivo AI": "Workvivo AI でサーベイやフォームを作成",
  // The four suggestion pills. Title case in the admin fan, sentence case here; both
  // shapes are on screen in the film, so both are keys.
  // 7 characters, not 楽しいサーベイをつくる: this pill's box is the narrowest of the four at
  // 167px — it was measured from the shortest ENGLISH label — and eleven characters
  // overflow it on both sides. The verb is the part the pill can afford to lose.
  "Create a fun survey": "楽しいサーベイ",
  "Gauge employee sentiment": "社員の心情を測る", "Gauge Employee Sentiment": "社員の心情を測る",
  "Plan future improvements": "今後の改善を計画する", "Plan Future Improvements": "今後の改善を計画する",
  "Gather insights on trends": "傾向のインサイトを集める",
  "View more": "もっと見る", "Redo Survey": "サーベイをやり直す", "Enter description": "説明を入力",
  "Company-Wide Employee Sentiment Survey": "全社 社員意識サーベイ",
  "Welcome & Purpose": "ごあいさつと目的",
  "How would you rate your overall job satisfaction?": "総合的な仕事の満足度をどう評価しますか？",
  "How do you currently feel about working at this company?": "いまこの会社で働くことについて、どう感じていますか？",
  "This survey is designed to gauge the overall sentiment of our employees across the company. Your honest feedback helps leadership make informed decisions to improve our workplace culture, processes, and overall employee experience. All responses are anonymous and greatly appreciated.":
    "このサーベイは、全社の社員がいま何を感じているかを把握するためのものです。皆さんの率直なフィードバックは、職場の文化・プロセス・社員エクスペリエンスを改善するための経営判断に役立てられます。回答はすべて匿名です。ご協力に心より感謝します。",

  // ── Admin hub: the settings nav, and the category tiles on the fan ────────────
  "Platform": "プラットフォーム", "Features": "機能", "Themes": "テーマ", "Theming": "テーマ設定", "Localization": "ローカライズ",
  "Timezone": "タイムゾーン", "Provisioning": "プロビジョニング", "Permissions": "権限",
  // Same words the VO reads at 187.2s — きめ細かな制御、権限設定、ガバナンスを標準搭載。
  "Granular Controls": "きめ細かな制御",
  "API Keys & JWT Settings": "APIキーとJWT設定", "App Integrations": "アプリ連携",
  "Authentication Settings": "認証設定", "Profile Banner Settings": "プロフィールバナー設定",
  "Space Approvals": "スペースの承認", "Space Content Promotion": "スペースコンテンツの掲載",
  "Video Subtitle Translations": "動画字幕の翻訳", "Webhook Settings": "Webhook設定",
  "Zoom Configurations": "Zoom 設定",
  "People Manager": "ピープルマネージャー", "Team Manager": "チームマネージャー",
  "Powered by": "提供",
  "AI Compose": "AIで作成", "Book Time Off": "休暇を申請", "Build eNPS Surveys": "eNPSサーベイを作成",
  "Create a Form": "フォームを作成",
  "Create a Survey": "サーベイを作成", "Gather Insights": "インサイトを集める",
  "Localize Content": "コンテンツをローカライズ", "Measure Engagement": "エンゲージメントを測定",
  "Monitor Performance": "パフォーマンスを把握", "Personalize Your Experience": "体験をパーソナライズ",
  "Spot Trends": "傾向をとらえる",

};

const patterns: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(\d+) Questions?$/, "設問$1問"],
  [/^(\d+) steps? remaining$/, "残り$1ステップ"],
  [/^(\d[\d,]*) [Cc]omments?$/, "コメント$1件"],
  [/^(\d[\d,]*) reactions?$/, "リアクション$1件"],
  [/^(\d[\d,]*) Members$/, "メンバー$1人"],
  [/^(\d+) new replies$/, "新しい返信$1件"],
  [/^View all (\d+) comments$/, "コメント$1件をすべて表示"],
  [/^(\d+) days? ago(\s*·)?$/, "$1日前$2"],
  [/^(\d+) hours? ago(\s*·)?$/, "$1時間前$2"],
  [/^(\d+) minutes? ago(\s*·)?$/, "$1分前$2"],
  [/^(\d+)m ago$/, "$1分前"],
  [/^(\d+) weeks? ago(\s*·)?$/, "$1週間前$2"],
  [/^Just now(\s*·)?$/, "たった今$1"],
  // The composer placeholder is built with the first name in three different shapes; the
  // one-string form arrives here whole. The split forms hit the "What’s going on," key.
  [/^What[’']s going on, (.+)\?$/, "$1さん、調子はどうですか？"],
  [/^Published (\d+) days? ago(\s*·)?$/, "$1日前に公開$2"],
  [/^Published (\d+) weeks? ago(\s*·)?$/, "$1週間前に公開$2"],
  [/^Posted (\d+) days? ago$/, "$1日前に投稿"],
  [/^Posted (\d+) hours? ago$/, "$1時間前に投稿"],
  [/^(\d+) Minutes, (\d+) Questions, Anonymous$/, "$1分・$2問・匿名"],
  [/^Day (\d+)$/, "$1日目"],
  [/^(\d[\d,]*) Audience$/, "対象者$1人"],
  [/^(\d+) Columns$/, "$1カラム"],
  [/^Apr (\d+), 2026$/, "2026年4月$1日"],
  [/^(\d+) (Jan|Feb|Mar|Apr|May|Jun) 2026$/, "2026年$2$1日"],
];

/**
 * Japanese sets no space between slots and no margin either. The kinetic scenes split a
 * sentence so each fragment can animate; in English those fragments are words and want a
 * gap, in Japanese they are parts of one word and must touch.
 */
const wordGap = { sep: "", gapEm: "0" } as const;

export const JAPANESE_UI: UiStrings = { exact, patterns, wordGap };
