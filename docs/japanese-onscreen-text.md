# Japanese on-screen text, for proofreading

Every Japanese string the film puts on screen, grouped by the screen that renders it and ordered as a viewer meets them. **Generated** — do not edit:

```bash
python3 scripts/export-japanese-text.py
```

To correct a line, change the Japanese against its English key in `src/japanese/japaneseUi.ts` (or `japaneseCopy.ts` for the customer copy at the end) and re-run the command above.

## What to look for

- **Terminology.** 社員 rather than 従業員; サーベイ rather than 調査; 本社 only in the opening line. Flag any drift.
- **Length.** Several strings are fitted to a box measured from the English, noted in the source where it matters. A longer correction may not fit — say so and we will re-measure rather than let it clip.
- **Register.** It is a product film: confident, not stiff, and not casual. です・ます throughout except on the kinetic type, which is deliberately clipped.
- **Word order.** Some kinetic scenes split a sentence across slots that animate separately; those are marked, and the fragments only read correctly in order.

694 strings across 62 screens.

### HqOpeningScene · frames 139–417 (0:05.6–0:16.7)
The opening HQ lockup and its tagline.

| English | Japanese |
|---|---|
| The AI-native employee experience platform | AIネイティブの社員エクスペリエンスプラットフォーム |

### WorkvivoHqFan · frames 139–417 (0:05.6–0:16.7)
The HQ fan diagram itself — its four segment labels.

| English | Japanese |
|---|---|
| People | メンバー |
| timeoff/from | 明け？ |

### WorkvivoMobileHome · frames 417–600 (0:16.7–0:24.0), frames 1630–1677 (1:05.2–1:07.1), frames 2100–2236 (1:24.0–1:29.4)
The phone home screen.

| English | Japanese |
|---|---|
| My Company | 会社情報 |
| Resources | リソース |
| My Work | マイワーク |
| Spotlight | スポットライト |
| Feed | フィード |
| View All | すべて表示 |
| Featured News | 注目のニュース |
| Quick Links | クイックリンク |
| Global | 全社 |
| Documents | ドキュメント |
| Published 1 day ago | 1日前に公開 |
| Published 2 days ago | 2日前に公開 |
| Benefits Hub | 福利厚生 |
| Employee Handbook | 社員ハンドブック |
| IT Support | ITサポート |
| Learning Centre | ラーニングセンター |
| Learning Resources | 学習リソース |
| Payroll | 給与 |
| Safety Procedures | 安全衛生手順 |

### BackFromScene · frames 600–738 (0:24.0–0:29.5)
Kinetic type: 'Back from time off?'.

| English | Japanese |
|---|---|
| Back | 戻る |
| Catch Me Up | キャッチアップ |
| timeoff/Back | 休暇 |

### WorkvivoCatchMeUp · frames 600–738 (0:24.0–0:29.5)
The AI catch-up summary card, after time off.

| English | Japanese |
|---|---|
| Spotlight | スポットライト |
| Feed | フィード |
| Global | 全社 |
| Catch Me Up | キャッチアップ |
| Here's what you missed | 見逃した情報はこちら |
| Published 1 day ago | 1日前に公開 |
| Published 2 days ago | 2日前に公開 |

### WorkvivoDesktop · frames 738–896 (0:29.5–0:35.8), frames 888–1285 (0:35.5–0:51.4)
The main home feed: posts, reactions, comments, the composer.

| English | Japanese |
|---|---|
| Home | ホーム |
| My Company | 会社情報 |
| Communications | コミュニケーション |
| Chat | チャット |
| Spaces | スペース |
| Admin | 管理 |
| EXPLORE | 探す |
| News | ニュース |
| Events | イベント |
| Pages | ページ |
| Podcasts | ポッドキャスト |
| Survey & Forms | アンケート・フォーム |
| Surveys & Forms | アンケート・フォーム |
| Newsletters | ニュースレター |
| Journeys | ジャーニー |
| CONNECT | つながる |
| Connect | つながる |
| People | メンバー |
| Teams | チーム |
| Org Chart | 組織図 |
| RESOURCES | リソース |
| Apps | アプリ |
| Docs | ドキュメント |
| Gallery | ギャラリー |
| Search | 検索 |
| Welcome | ようこそ |
| HQ agent | HQ エージェント |
| View All | すべて表示 |
| Trending Spaces | 注目のスペース |
| Featured News | 注目のニュース |
| Featured Pages | 注目のページ |
| ✓ Joined | ✓ 参加済み |
| Corporate | 全社 |
| Global | 全社 |
| Share | 共有 |
| Leave a comment… | コメントを入力… |
| Write a message | メッセージを入力 |
| Start New Chat | 新しいチャット |
| Summarise Content | コンテンツを要約 |
| Team Updates | チームの最新情報 |
| Expand | 展開 |
| Start Survey | アンケートに回答 |
| Attachments(1) | 添付ファイル(1) |
| PDF document | PDFドキュメント |
| New Hires | 新入社員 |
| IT | IT |
| 756 KB | 756 KB |
| Billboards | ビルボード |
| INTEGRATIONS | 連携 |

### VirginWorkvivoDesktopFullscreenScene · frames 888–1285 (0:35.5–0:51.4)
The desktop feed full-frame, into the match cut.

| English | Japanese |
|---|---|
| Give a Shout-Out | シャウトアウトを送る |
| Go Live | ライブ配信 |

### WorkvivoPostComposer · frames 888–1285 (0:35.5–0:51.4)
The 'what's going on' composer and its attachment row.

| English | Japanese |
|---|---|
| Everyone | 全員 |
| Post | 投稿 |
| Video | 動画 |
| Image | 画像 |
| Add | 追加 |
| OK | OK |
| Ask a Question | 質問する |
| Give a Shout-Out | シャウトアウトを送る |
| Post a Value Update | 価値観を投稿 |
| Select Value | 価値観を選択 |
| Organization Value | 組織の価値観 |
| Normal Text | 標準テキスト |
| Translations | 翻訳 |
| Attachment | 添付 |
| Poll | 投票 |
| Campaign | キャンペーン |
| Tag | タグ |
| GIF | GIF |
| Value | 価値観 |

### LivestreamScene · frames 1275–1477 (0:51.0–0:59.1)
The livestream beat.

| English | Japanese |
|---|---|
| Key Business Results | 主要な事業成果 |

### WorkvivoLiveReplay · frames 1275–1477 (0:51.0–0:59.1), frames 3903–4072 (2:36.1–2:42.9)
The livestream replay card.

| English | Japanese |
|---|---|
| LIVE REPLAY | ライブのリプレイ |
| Chapters | チャプター |

### WorkvivoLivestream · frames 1275–1477 (0:51.0–0:59.1)
The livestream player and its reaction bar.

| English | Japanese |
|---|---|
| See more | もっと見る |
| Everyone | 全員 |
| Comments | コメント |
| Leave a comment | コメントを入力 |
| LIVE | ライブ |
| All | すべて |
| End Stream | 配信を終了 |
| Latency:2.0s | 遅延: 2.0秒 |
| 30fps | 30fps |

### WorkvivoSidebar · frames 1468–1549 (0:58.7–1:02.0)
The left nav rail, on screen behind most of the desktop shots.

| English | Japanese |
|---|---|
| Home | ホーム |
| My Company | 会社情報 |
| Communications | コミュニケーション |
| Chat | チャット |
| Spaces | スペース |
| Admin | 管理 |
| EXPLORE | 探す |
| News | ニュース |
| Events | イベント |
| Pages | ページ |
| Podcasts | ポッドキャスト |
| Survey & Forms | アンケート・フォーム |
| Newsletters | ニュースレター |
| Journeys | ジャーニー |
| CONNECT | つながる |
| People | メンバー |
| Teams | チーム |
| Org Chart | 組織図 |
| RESOURCES | リソース |
| Apps | アプリ |
| Docs | ドキュメント |
| Gallery | ギャラリー |

### WorkvivoSpacePage · frames 1468–1549 (0:58.7–1:02.0)
A single Space — its header, tabs and right rail.

| English | Japanese |
|---|---|
| Admin | 管理 |
| News | ニュース |
| Events | イベント |
| Pages | ページ |
| Search | 検索 |
| More | その他 |
| Feed | フィード |
| View More | もっと見る |
| Corporate Spaces | 全社スペース |
| Members | メンバー |
| Join | 参加 |
| Everyone | 全員 |
| Share | 共有 |
| Start | 開始 |
| Countdown | カウントダウン |
| Days | 日 |
| Hours | 時間 |
| Minutes | 分 |
| Hooray to: | おめでとう： |
| Documents | ドキュメント |
| Videos | 動画 |
| ABOUT | 概要 |
| SPACE ADMINS | スペース管理者 |
| Ask a Question | 質問する |
| Give a Shout-out | シャウトアウトを送る |
| Post a Value Update | 価値観を投稿 |
| Search Connect | つながりを検索 |
| Posted 1 day ago | 1日前に投稿 |
| Q&A | Q&A |
| FEATURED STORY | 注目のストーリー |
| FEATURED PAGE | 注目のページ |
| FEATURED PODCAST | 注目のポッドキャスト |

### WorkvivoSpaces · frames 1468–1549 (0:58.7–1:02.0)
The Spaces directory.

| English | Japanese |
|---|---|
| View All | すべて表示 |
| Trending Spaces | 注目のスペース |
| My Spaces | マイスペース |
| Joined | 参加済み |
| Join | 参加 |
| Request to Join | 参加をリクエスト |
| New | 新着 |
| Corporate | 全社 |

### WorkvivoMobileSpotlight · frames 1630–1677 (1:05.2–1:07.1)
The mobile Spotlight / recognition screen.

| English | Japanese |
|---|---|
| Home | ホーム |
| Chat | チャット |
| Spaces | スペース |
| Inbox | 受信箱 |
| More | その他 |
| Spotlight | スポットライト |
| Feed | フィード |
| View All | すべて表示 |
| See All | すべて表示 |
| Featured News | 注目のニュース |
| Quick Links | クイックリンク |
| Upcoming Events | 今後のイベント |
| Join | 参加 |
| Global | 全社 |
| Start | 開始 |
| Documents | ドキュメント |
| Published 1 day ago | 1日前に公開 |
| Published 1 week ago | 1週間前に公開 |
| Published 2 days ago | 2日前に公開 |
| Published 4 days ago | 4日前に公開 |
| AUG | 8月 |
| View Event | イベントを見る |

### WorkvivoJourneyBuilder · frames 1677–1825 (1:07.1–1:13.0)
The journey builder — onboarding and change journeys.

| English | Japanese |
|---|---|
| Share a Message | メッセージを共有 |
| Create a custom message | カスタムメッセージを作成 |
| Share Org Chart | 組織図を共有 |
| Share your companies structure | 会社の組織構成を共有 |
| Share an Update | アップデートを共有 |
| Share an existing update | 既存のアップデートを共有 |
| Share Values | 価値観を共有 |
| Share your companies values | 会社の価値観を共有 |
| Enroll to a Space | スペースに登録 |
| Automatically add to a space | スペースに自動で追加 |
| Share an Article | 記事を共有 |
| Share and existing article | 既存の記事を共有 |
| Share a Page | ページを共有 |
| Share existing page | 既存のページを共有 |
| Share a Link | リンクを共有 |
| Share any URL | 任意のURLを共有 |
| Share a Survey | アンケートを共有 |
| Share an existing survey | 既存のアンケートを共有 |
| Assign a Badge | バッジを付与 |
| Reward with a badge | バッジで称える |

### WorkvivoJourneyCard · frames 1677–1825 (1:07.1–1:13.0)
A single journey card.

| English | Japanese |
|---|---|
| Start | 開始 |

### WorkvivoJourneyPhone · frames 1677–1825 (1:07.1–1:13.0)
A journey on a phone.

| English | Japanese |
|---|---|
| A message has been shared with you | メッセージが共有されました |
| A page has been shared with you | ページが共有されました |
| A survey has been shared with you | アンケートが共有されました |
| An article has been shared with you | 記事が共有されました |
| You have been enrolled in a space | スペースに登録されました |
| View your companies values | 会社の価値観を見る |
| Not Started | 未開始 |

### AmplifyReachScene · frames 1813–1978 (1:12.5–1:19.1)
Reach / amplify, into the office signage.

| English | Japanese |
|---|---|
| Amplify | 広げる |
| Reach | 届ける |

### HeadquartersScene · frames 1813–1978 (1:12.5–1:19.1)
Kinetic type: the opening headline.

| English | Japanese |
|---|---|
| Now | それが、 |

### WorkvivoBillboardScreen · frames 1813–1978 (1:12.5–1:19.1)
Workvivo on an office display / digital signage.

| English | Japanese |
|---|---|
| Value: | 価値観： |
| Article | 記事 |
| Event | イベント |
| Livestream | ライブ配信 |
| Find out more | 詳しく見る |
| Posted 2 hours ago | 2時間前に投稿 |
| Jul | 7月 |
| 11:37 AM | 午前11:37 |
| Monday, March 27 | 3月27日（月） |
| Partly Cloudy | 晴れ時々曇り |

### WorkvivoNewsletters · frames 1978–2058 (1:19.1–1:22.3), frames 3758–3794 (2:30.3–2:31.8), frames 4553–4591 (3:02.1–3:03.6)
The newsletters list.

| English | Japanese |
|---|---|
| Newsletters | ニュースレター |
| Global | 全社 |
| Options | オプション |
| All | すべて |
| June 10, 2026 12.00AM | 2026年6月10日 0:00 |
| June 11, 2026 11.00AM | 2026年6月11日 11:00 |
| June 12, 2026 10.00AM | 2026年6月12日 10:00 |
| June 17, 2026 10:00AM | 2026年6月17日 10:00 |
| Create Newsletter | ニュースレターを作成 |
| Recent Newsletters | 最近のニュースレター |
| Search Newsletters | ニュースレターを検索 |
| View Folders | フォルダを表示 |
| Folders | フォルダ |
| Drafts | 下書き |
| Scheduled | 予約済み |
| Sent | 送信済み |
| Segments | セグメント |

### WorkvivoTopbar · frames 1978–2058 (1:19.1–1:22.3), frames 3388–3572 (2:15.5–2:22.9), frames 3758–3794 (2:30.3–2:31.8)
The top bar — search, notifications, avatar.

| English | Japanese |
|---|---|
| Search | 検索 |

### WorkvivoNewsletterBuilder · frames 2058–2100 (1:22.3–1:24.0)
The newsletter builder canvas.

| English | Japanese |
|---|---|
| Post | 投稿 |
| Image | 画像 |
| Article | 記事 |
| Event | イベント |
| Layouts | レイアウト |
| Components | コンポーネント |
| Content | コンテンツ |
| Design | デザイン |
| Full Width | 全幅 |
| One Third | 1/3 |
| Two Thirds | 2/3 |
| Heading | 見出し |
| Heading text | 見出しテキスト |
| Text | テキスト |
| Button | ボタン |
| Hero | ヒーロー |
| Spacer | スペーサー |
| Divider | 区切り線 |
| Update | アップデート |
| Save as Draft | 下書きとして保存 |
| Save as Template | テンプレートとして保存 |

### CatchUpRevealScene · frames 2100–2236 (1:24.0–1:29.4)
The catch-up card revealing on the phone.

| English | Japanese |
|---|---|
| Summarize | 要約 |
| AI Summary | AI要約 |
| Catch up on what you missed | 見逃した情報をチェック |
| A breakdown of this weeks plans | 今週の予定のまとめ |

### WorkvivoPhonesScene · frames 2100–2236 (1:24.0–1:29.4)
The three-phone arrangement.

| English | Japanese |
|---|---|
| Chat | チャット |
| More | その他 |
| Send message | 送信 |
| Summarize | 要約 |
| Catch up on what you missed | 見逃した情報をチェック |
| Turn Off | オフにする |
| Unmute | ミュート解除 |
| Leave | 退出 |

### AskBarScene · frames 2268–2317 (1:30.7–1:32.7)
The HQ ask bar as a question is typed.

| English | Japanese |
|---|---|
| How can I help you? | 何をお手伝いしましょうか？ |

### WorkvivoHqChat · frames 2317–2392 (1:32.7–1:35.7), frames 2392–2499 (1:35.7–1:40.0)
The HQ chat answer, with its sources.

| English | Japanese |
|---|---|
| Write a message | メッセージを入力 |
| Date Requested: | 申請日： |
| Request ID: | 申請ID： |
| Status: | ステータス： |
| Perfect! ✅ | 完了しました！✅ |
| 20th of February | 2月20日 |
| AI can make mistakes. Review for accuracy. | AIは間違えることがあります。内容を確認してください。 |
| All sources | すべてのソース |
| Thinking for 3s | 3秒間考え中 |

### WorkvivoHqSearch · frames 2317–2392 (1:32.7–1:35.7)
HQ search results across connected systems.

| English | Japanese |
|---|---|
| Connect | つながる |
| Apps | アプリ |
| HQ agent | HQ エージェント |
| View More | もっと見る |
| PDF document | PDFドキュメント |
| Document | ドキュメント |
| Sort By | 並び替え |
| Most Relevant | 関連度順 |
| Date | 日付 |
| Created By | 作成者 |
| Space | スペース |
| Team | チーム |
| All | すべて |
| Added June 23rd, 2025 (1 year ago) | 2025年6月23日に追加（1年前） |
| Published May 23rd, 2026 (1 month ago) | 2026年5月23日に公開（1か月前） |
| 1 Attachment | 添付ファイル1件 |
| 6.3 MB | 6.3 MB |
| Share Point | SharePoint |
| Time Off | 休暇 |
| the | 先へ。 |
| nomatter/where | つながる |
| nomatter/are |  |

### WorkvivoHqSidebar · frames 2317–2392 (1:32.7–1:35.7)
The HQ side rail.

| English | Japanese |
|---|---|
| Search | 検索 |
| History | 履歴 |
| New chat | 新しいチャット |

### HqChatScene · frames 2392–2499 (1:35.7–1:40.0)
The HQ chat beat.

| English | Japanese |
|---|---|
| New chat | 新しいチャット |

### BrandWordScene · frames 2499–2520 (1:40.0–1:40.8), frames 2520–2547 (1:40.8–1:41.9), frames 2547–2577 (1:41.9–1:43.1)
A single brand word held full-frame.

| English | Japanese |
|---|---|
| Ask | 質問 |

### NoMatterScene · frames 2760–2823 (1:50.4–1:52.9)
Kinetic type: 'No matter where they are', one word a slot.

| English | Japanese |
|---|---|
| they | 今 |
| nomatter/No | どこに |
| nomatter/matter | いても |
| nomatter/they |  |
| nomatter/are |  |
| Powered by | 提供 |

### WorkvivoWidgetStore · frames 2823–2883 (1:52.9–1:55.3), frames 2883–3109 (1:55.3–2:04.4)
The widget store.

| English | Japanese |
|---|---|
| Connect | つながる |
| Search | 検索 |
| New | 新着 |
| Category | カテゴリ |
| Widget Store | ウィジェットストア |
| Widget Categories | ウィジェットのカテゴリ |
| Browse by category | カテゴリから探す |
| Start with a category—or jump straight to search. | カテゴリから探す。検索でもすぐに。 |
| Discover | 見つける |
| Productivity | 生産性 |
| Stay Informed | 最新情報 |
| Media | メディア |
| Technical | テクニカル |
| See all widgets | すべてのウィジェット |
| View Widgets | ウィジェットを見る |
| Shortcuts, apps, docs, and journeys. | ショートカット、アプリ、ドキュメント、ジャーニー。 |
| Podcasts, video, and embeds. | ポッドキャスト、動画、埋め込み。 |
| News, events, announcements, and more. | ニュース、イベント、お知らせなど。 |
| Spaces and people in motion. | スペースとメンバーの動き。 |
| Skills and serialized learning. | スキルと段階的な学習。 |
| Time off, weather, live data. | 休暇、天気、ライブデータ。 |
| Make your landing page feel alive. | ランディングページに動きを。 |
| Integrations | 連携 |

### WorkvivoWidgetList · frames 2883–3109 (1:55.3–2:04.4)
The widget library list.

| English | Japanese |
|---|---|
| Connect | つながる |
| Apps | アプリ |
| Learn | 学ぶ |
| Trending Spaces | 注目のスペース |
| Featured News | 注目のニュース |
| Featured Pages | 注目のページ |
| Quick Links | クイックリンク |
| Upcoming Events | 今後のイベント |
| Posts | 投稿 |
| Podcast | ポッドキャスト |
| Productivity | 生産性 |
| Stay Informed | 最新情報 |
| Technical | テクニカル |
| Time Off | 休暇 |
| Billboards | ビルボード |
| Access your most important resources and tools instantly with customizable shortcuts. | よく使うリソースやツールに、カスタマイズできるショートカットからすぐにアクセス。 |
| Apps provides you with instant access to essential productivity tools. | 業務に欠かせないツールにすぐアクセスできます。 |
| Billboards serve as a platform for promoting and showcasing your desired content. | ビルボードは、伝えたいコンテンツを発信・紹介するためのプラットフォームです。 |
| Catch up on the latest episodes from your favorite shows and discover new content. | お気に入り番組の最新エピソードをチェックし、新しいコンテンツに出会えます。 |
| Explore curated pages and resources handpicked for your team and interests. | チームや関心に合わせて選ばれたページやリソースを探せます。 |
| Get the latest updates and announcements from across your organization in one place. | 全社の最新情報とお知らせをひとつの場所で。 |
| Join the conversation in the most active community spaces. | 最も活発なコミュニティスペースの会話に参加しましょう。 |
| Stay updated , designed to keep you informed about all the exciting activities on the horizon. | これから予定されているイベントや活動を見逃さないために。 |
| Stay updated with the latest posts in your activity feed. | アクティビティフィードの最新の投稿をチェック。 |
| Track your vacation days and plan your next break to recharge and stay balanced. | 休暇の残日数を確認し、次の休みを計画してリフレッシュを。 |

### CreateYourOwnScene · frames 3022–3058 (2:00.9–2:02.3), frames 3058–3109 (2:02.3–2:04.4)
Kinetic type: 'Create your own'.

| English | Japanese |
|---|---|
| Create your own | 自分でつくる |

### PageBuilderScene · frames 3109–3264 (2:04.4–2:10.6)
The page-builder beat: Add Page, the editor, then the card field.

| English | Japanese |
|---|---|
| Document | ドキュメント |
| Video | 動画 |
| Image | 画像 |
| Button | ボタン |
| Heading 1 | 見出し1 |
| Heading 2 | 見出し2 |
| Heading 3 | 見出し3 |
| List | リスト |
| Embed | 埋め込み |
| Table | 表 |
| Callout | コールアウト |
| Help me write | 書くのを手伝う |

### WorkvivoPageEditor · frames 3109–3264 (2:04.4–2:10.6)
The Zoom Docs-style page editor, its block types and AI prompt bar.

| English | Japanese |
|---|---|
| Document | ドキュメント |
| Video | 動画 |
| Image | 画像 |
| Button | ボタン |
| Submit | 送信 |
| Add Page | ページを追加 |
| Add Icon | アイコンを追加 |
| Add Cover Image | カバー画像を追加 |
| Untitled | 無題 |
| Normal | 標準 |
| English | 英語 |
| Heading 1 | 見出し1 |
| Heading 2 | 見出し2 |
| Heading 3 | 見出し3 |
| List | リスト |
| Embed | 埋め込み |
| Table | 表 |
| Callout | コールアウト |
| Help me write | 書くのを手伝う |
| Workvivo AI | Workvivo AI |
| is generating... | が生成中... |
| Stop | 停止 |

### WorkvivoArticle · frames 3264–3326 (2:10.6–2:13.0)
A published article page.

| English | Japanese |
|---|---|
| AI Summary | AI要約 |
| Open | 開く |

### WorkvivoAnalytics · frames 3388–3572 (2:15.5–2:22.9)
The analytics dashboard — the film's densest screen.

| English | Japanese |
|---|---|
| Chat | チャット |
| Spaces | スペース |
| Spotlight | スポットライト |
| Open Fullscreen | 全画面で開く |
| All | すべて |
| Campaigns | キャンペーン |
| Analytics & Reporting | 分析とレポート |
| Snapshot | スナップショット |
| Activation | アクティベーション |
| Advanced Usage | 詳細な利用状況 |
| Advanced Content | 詳細なコンテンツ |
| Governance | ガバナンス |
| Activity Feed | アクティビティフィード |
| Bookmarks | ブックマーク |
| Following | フォロー中 |
| Recent Updates | 最近の更新 |
| Reported | 報告済み |
| Activation Rate | アクティベーション率 |
| Onboarding Rate | オンボーディング率 |
| Mobile App Users | モバイルアプリ利用者 |
| Profile Picture Upload | プロフィール写真の設定 |
| Profile | プロフィール |
| Monthly Active Users | 月間アクティブユーザー |
| Weekly Active Users | 週間アクティブユーザー |
| Daily Active Users | 日間アクティブユーザー |
| % of Monthly Active over Time users | 月間アクティブユーザーの推移（%） |
| Shown as % active users in selected time period | 選択期間のアクティブユーザー率で表示 |
| Date From | 開始日 |
| Date To | 終了日 |
| Primary Team | 主担当チーム |
| Secondary Team | 副担当チーム |
| Tertiary Team | 第三チーム |
| Revert to Old Version | 旧バージョンに戻す |
| Jan 2026 | 2026年1月 |
| Feb 2026 | 2026年2月 |
| Mar 2026 | 2026年3月 |
| Apr 2026 | 2026年4月 |
| May 2026 | 2026年5月 |
| Jun 2026 | 2026年6月 |
| Dec 1, 2025 | 2025年12月1日 |
| Dec 7, 2025 | 2025年12月7日 |
| Jan 1, 2026 | 2026年1月1日 |
| Feb 1, 2026 | 2026年2月1日 |
| Mar 1, 2026 | 2026年3月1日 |
| Apr 1, 2026 | 2026年4月1日 |
| May 1, 2026 | 2026年5月1日 |
| Jun 1, 2026 | 2026年6月1日 |
| Jun 14, 2026 | 2026年6月14日 |

### WorkvivoAdminHub · frames 3758–3794 (2:30.3–2:31.8), frames 4553–4591 (3:02.1–3:03.6)
The admin hub landing screen.

| English | Japanese |
|---|---|
| Surveys | アンケート |
| Newsletters | ニュースレター |
| Journeys | ジャーニー |
| Quick Links | クイックリンク |
| Billboards | ビルボード |
| Admin Hub | 管理ハブ |
| Admin Tools | 管理ツール |
| Search admin | 管理項目を検索 |
| Manage Favourites | お気に入りを管理 |
| Manage People | メンバー管理 |
| Moderation | モデレーション |
| Reported Content | 報告されたコンテンツ |
| Products | プロダクト |
| Analytics | 分析 |
| Campaigns | キャンペーン |
| Workvivo TV | Workvivo TV |
| Awards | 表彰 |
| What's New | 新機能 |
| Bring company news and updates to every screen across your workplace. | 会社のニュースと最新情報を職場のあらゆる画面へ。 |
| Capture feedback, understand sentiment, make informed decisions. | フィードバックを集め、雰囲気を把握し、根拠ある判断を。 |
| Celebrate achievements and recognize great work across your organization. | 成果を称え、組織全体の優れた働きを認め合う。 |
| Create engaging newsletters that keep everyone informed and connected. | 全員に情報が届き、つながりを保つニュースレターを。 |
| Guide employees through personalized key workplace moments. | 職場の大切な節目を、一人ひとりに合わせて案内。 |
| Measure engagement, uncover trends, and turn insights into action. | エンゲージメントを測り、傾向をつかみ、行動につなげる。 |
| Plan, launch, and measure impactful internal communication campaigns. | 社内コミュニケーション施策を計画・実施・測定。 |
| Turn insights into meaningful actions with AI-powered recommendations. | AIの提案で、インサイトを意味のある行動へ。 |

### WorkvivoSeerChrome · frames 3758–3794 (2:30.3–2:31.8)
Shared chrome around the Insights screens.

| English | Japanese |
|---|---|
| Comments | コメント |
| Seer Insights | Seer インサイト |
| Manage Seer Insights | Seer インサイトを管理 |
| Engagement | エンゲージメント |
| Drivers | ドライバー |
| Values | 価値観 |
| Radar | レーダー |

### WorkvivoSeerInsights · frames 3758–3794 (2:30.3–2:31.8), frames 3903–4072 (2:36.1–2:42.9)
Employee Insights — the comments and themes tabs.

| English | Japanese |
|---|---|
| View All | すべて表示 |
| Comments | コメント |
| All Comments | すべてのコメント |
| Round 6 (2026/06/15) | 第6回（2026/06/15） |
| June 10th, 2026 | 2026年6月10日 |
| June 14th, 2026 | 2026年6月14日 |
| June 15th, 2026 | 2026年6月15日 |
| Seer AI | Seer AI |
| Engagement | エンゲージメント |
| Driver | ドライバー |
| Value | 価値観 |
| Segment | セグメント |
| NPS Category | NPSカテゴリ |
| Topic | トピック |
| Prescriptive | 提案 |
| Starred | スター付き |
| Popular Topics | 注目のトピック |
| Summary | サマリー |
| Sentiment | 感情 |
| Very Positive | とても良い |
| Positive | 良い |
| Negative | 悪い |
| Very Negative | とても悪い |
| Wellbeing | ウェルビーイング |
| Career Development | キャリア開発 |
| Team Collaboration | チームの協働 |
| Work Environment | 職場環境 |
| Employee Satisfaction | 従業員満足度 |
| Workplace Atmosphere | 職場の雰囲気 |
| Competitive Environment | 競争環境 |
| Employee Morale | 従業員の士気 |
| Performance Recognition | 成果への評価 |
| Coworker Relationships | 同僚との関係 |
| Workplace Communication | 職場の情報共有 |
| Team Dynamics | チームの力学 |
| I can effectively manage my work-life balance | 仕事と生活のバランスをうまく保てている |
| I am given real opportunities to grow here | ここには成長できる機会が実際にある |
| Team meetings and communication are frequent and of high quality | チームの会議や情報共有は頻度も質も十分である |
| I try my best to manage my work-life balance, but it can be challenging at times. | バランスを保つよう心がけていますが、難しく感じる時期もあります。 |
| I've received great training over the last quarter | この四半期はとても良い研修を受けられました。 |
| We haven't had a team meeting in a while. | しばらくチームで集まる機会がありません。 |
| Neutral | どちらでもない |
| Communication | コミュニケーション |

### WorkvivoSeerManagerInsights · frames 3758–3794 (2:30.3–2:31.8), frames 3903–4072 (2:36.1–2:42.9)
The manager's view of their team's insights.

| English | Japanese |
|---|---|
| Team | チーム |
| Round 6 (2026/06/15) | 第6回（2026/06/15） |
| Segments | セグメント |
| Engagement | エンゲージメント |
| Overview | 概要 |
| Metrics | 指標 |
| Score | スコア |
| Score Change | スコアの変化 |
| Completion Rate | 完了率 |
| Response Rate | 回答率 |
| Responses | 回答 |
| Completions | 完了 |
| Completed Rounds | 完了したラウンド |
| Participants | 参加者 |
| Frequency | 頻度 |
| Survey Duration | 実施期間 |
| Survey Status | 実施状況 |
| Next Survey | 次回のサーベイ |
| Previous Survey | 前回のサーベイ |
| Out of | ／ |
| Engagement Score Timeline | エンゲージメントスコアの推移 |
| Engagement Question Asked | エンゲージメント設問 |
| Promoters | 推奨者 |
| Passives | 中立者 |
| Detractors | 批判者 |
| I enjoy the kind of work I do | 自分の仕事の内容にやりがいを感じる |
| 2 Weeks | 2週間 |
| Inactive | 未実施 |
| Monthly | 毎月 |

### WorkvivoSeerRater · frames 3758–3794 (2:30.3–2:31.8)
The rating / eNPS screen.

| English | Japanese |
|---|---|
| Global | 全社 |
| Round 6 (2026/06/15) | 第6回（2026/06/15） |
| Human Resources | 人事 |
| IT | IT |
| CX | CX |
| Marketing | マーケティング |
| Sales | 営業 |
| Product | プロダクト |
| Boston | 大阪 |
| London | 東京 |
| Location | 拠点 |
| Department | 部門 |
| All Segments | すべて |
| Productivity | 生産性 |
| Engagement | エンゲージメント |
| Radar | レーダー |
| Export CSV | CSVを書き出す |
| Wellbeing | ウェルビーイング |
| My Job | 仕事内容 |
| Culture and Values | 文化と価値観 |
| Career Development | キャリア開発 |
| Compensation and Benefits | 報酬と福利厚生 |
| Senior Leadership | 経営層 |
| Reward and Recognition | 評価と称賛 |
| Empowerm... | 裁量… |
| Score: Engagement | スコア：エンゲージメント |

### WorkvivoSeerManagerMobile · frames 3903–4072 (2:36.1–2:42.9)
The manager's insights on a phone.

| English | Japanese |
|---|---|
| Home | ホーム |
| Chat | チャット |
| Inbox | 受信箱 |
| More | その他 |
| Comments | コメント |
| Aoife Byrne | 青木 結衣 |
| Lena Fischer | 松田 玲奈 |
| Marcus Hale | 井上 誠 |
| Priya Raman | 山口 美月 |
| Tom Okafor | 村田 智也 |
| Engagement | エンゲージメント |
| Drivers | ドライバー |
| Values | 価値観 |
| Company Score | 全社スコア |
| Team’s Engagement Score | チームのエンゲージメントスコア |
| Manager Insights | マネージャーインサイト |
| Manager Overview | マネージャー概要 |
| Managers | マネージャー |
| Direct Reports | 直属の部下 |
| Total Reports | 部下の総数 |
| Individual Contributor | 個人貢献者 |
| Welcome to Your Manager Insights | マネージャーインサイトへようこそ |
| Customer Success | カスタマーサクセス |
| Data & Insights | データ・インサイト |
| Engineering | エンジニアリング |
| People Ops | ピープルオペレーション |
| Product Design | プロダクトデザイン |

### WorkvivoSeerRateCard · frames 3903–4072 (2:36.1–2:42.9)
One rating card in the survey.

| English | Japanese |
|---|---|
| Company Score | 全社スコア |
| Completion Rate | 完了率 |
| Response Rate | 回答率 |
| Responses | 回答 |

### WorkvivoSpaceFeed · frames 4066–4110 (2:42.6–2:44.4)
The feed inside a Space.

| English | Japanese |
|---|---|
| Admin | 管理 |
| News | ニュース |
| Events | イベント |
| Pages | ページ |
| More | その他 |
| Feed | フィード |
| View All | すべて表示 |
| Corporate Spaces | 全社スペース |
| Featured News | 注目のニュース |
| Upcoming Events | 今後のイベント |
| UPCOMING EVENTS | 今後のイベント |
| Members | メンバー |
| Join | 参加 |
| Global | 全社 |
| Share | 共有 |
| Reply | 返信 |
| Leave a comment... | コメントを入力… |
| Attachments(1) | 添付ファイル(1) |
| PDF document | PDFドキュメント |
| Documents | ドキュメント |
| Videos | 動画 |
| ABOUT | 概要 |
| SPACE ADMINS | スペース管理者 |
| Ask a Question | 質問する |
| Give a Shout-out | シャウトアウトを送る |
| Post a Value Update | 価値観を投稿 |
| GIF | GIF |
| Search Manager Insights Action | マネージャーインサイトのアクションを検索 |
| JUN | 6月 |
| Human Resources | 人事 |
| Q&A | Q&A |
| 756 KB | 756 KB |
| Your Voice Matters | あなたの声が力になる |

### WorkvivoFeedbackArticle · frames 4110–4253 (2:44.4–2:50.1)
The feedback article the film scrolls through.

| English | Japanese |
|---|---|
| Published 2 days ago | 2日前に公開 |

### SurveyBuilderScene · frames 4253–4397 (2:50.1–2:55.9)
The survey-builder beat.

| English | Japanese |
|---|---|
| Submit | 送信 |
| Redo Survey | サーベイをやり直す |

### WorkvivoSurveyBuilder · frames 4253–4397 (2:50.1–2:55.9)
The survey builder: question list, action bar, and the AI modal.

| English | Japanese |
|---|---|
| Add Question | 質問を追加 |
| Required | 必須 |
| Duplicate | 複製 |
| Delete | 削除 |
| Short Text | 短文 |
| Paragraph | 長文 |
| Multiple Choice | 選択式 |
| Checkbox | チェックボックス |
| Number Line | 数値スケール |
| File Upload | ファイルアップロード |
| Date and Time | 日付と時刻 |
| Dropdown | ドロップダウン |
| Contact Field | 連絡先フィールド |
| Create a Survey or Form with Workvivo AI | Workvivo AI でサーベイやフォームを作成 |
| Create a fun survey | 楽しいサーベイ |
| Gauge employee sentiment | 社員の心情を測る |
| Plan future improvements | 今後の改善を計画する |
| Gather insights on trends | 傾向のインサイトを集める |
| Redo Survey | サーベイをやり直す |
| Enter description | 説明を入力 |
| Company-Wide Employee Sentiment Survey | 全社 社員意識サーベイ |
| Welcome & Purpose | ごあいさつと目的 |
| How would you rate your overall job satisfaction? | 総合的な仕事の満足度をどう評価しますか？ |
| How do you currently feel about working at this company? | いまこの会社で働くことについて、どう感じていますか？ |

### WorkvivoIntegrationsMarketplace · frames 4397–4480 (2:55.9–2:59.2)
The integrations marketplace.

| English | Japanese |
|---|---|
| Category | カテゴリ |
| Browse by category | カテゴリから探す |
| Productivity | 生産性 |
| Shortcuts, apps, docs, and journeys. | ショートカット、アプリ、ドキュメント、ジャーニー。 |
| Integrations Marketplace | 連携マーケットプレイス |
| Search Integrations | 連携を検索 |
| See all Integrations | すべての連携 |
| View Integrations | 連携を見る |
| HR & People | 人事・メンバー |
| IT & Support | IT・サポート |
| IT & Support Integrations | IT・サポートの連携 |
| Calendar | カレンダー |
| Social Media | ソーシャルメディア |
| Add Social Media Integrations | ソーシャルメディア連携を追加 |
| Add Payrolls, HR and other people Integrations | 給与・人事などの連携を追加 |
| Get a  from your provider/Calendar Integrations | カレンダー連携を追加 |
| Workvivo Help Center | Workvivo ヘルプセンター |

### WorkvivoIntegrationsList · frames 4459–4554 (2:58.4–3:02.2)
The installed-integrations list.

| English | Japanese |
|---|---|
| Manage | 管理 |
| Setup | 設定 |
| Active | 有効 |
| Content Search | コンテンツ検索 |
| People Directory | メンバー一覧 |
| Productivity | 生産性 |
| Calendar | カレンダー |
| Apple Calendar | Apple カレンダー |
| Yahoo Calendar | Yahoo カレンダー |
| IT Service Management | ITサービス管理 |
| Gmail, Drive, Calendar, | Gmail、ドライブ、カレンダー、 |
| Outlook Mail, Outlook Calendar, MS Teams Chat, Sharepoint +5 | Outlook メール、Outlook 予定表、Teams チャット、SharePoint ほか5件 |
| Quick Access widget, Zoom Mail, Zoom Calendar, Zoom Whiteboards +2 | クイックアクセス、Zoom Mail、Zoom Calendar、Zoom Whiteboard ほか2件 |
| Connect Jira to Workvivo to streamline project tracking and enhance team collaboration. | Jira と連携して、プロジェクトの進捗管理とチームの協働をスムーズに。 |
| Connect to Jira and Confluence to streamline workflows and enhance team collaboration. | Jira と Confluence に連携して、ワークフローと協働を効率化。 |
| Connect to ServiceNow to sync IT tickets, employee service requests, and workflows. | ServiceNow と連携して、ITチケットや各種申請、ワークフローを同期。 |
| Connect to Workday to sync employee profiles, organizational data, and workforce information. | Workday と連携して、社員プロフィールや組織情報を同期。 |
| Jump directly into your favorite Google apps and files with convenient, time-saving shortcuts. | よく使う Google アプリやファイルにショートカットからすぐアクセス。 |
| Keep track of your schedule and events with ease using the Yahoo Calendar integration. | Yahoo カレンダー連携で予定やイベントを手軽に管理。 |
| Quickly access Outlook, Teams, and other Microsoft 365 apps with a single click. | Outlook、Teams などの Microsoft 365 アプリにワンクリックでアクセス。 |
| Securely share, manage, and collaborate on files with team members and external partners. | 社内外のメンバーと安全にファイルを共有・管理・共同編集。 |
| Start or join meetings, share screens, and collaborate in real-time with this integration. | 会議の開始や参加、画面共有、リアルタイムの協働をこの連携から。 |
| Sync your Apple Calendar to view events and schedules directly within the platform. | Apple カレンダーを同期して、予定をプラットフォーム内で確認。 |

### AdminCategoriesScene · frames 4585–4983 (3:03.4–3:19.3)
The admin beat: category tiles flying past the HQ fan.

| English | Japanese |
|---|---|
| Catch Me Up | キャッチアップ |
| Governance | ガバナンス |
| Homepage | ホームページ |
| Smart Chapters | スマートチャプター |
| Summarize with AI | AIで要約 |
| Help Me Write | 書くのを手伝う |
| Gauge Employee Sentiment | 社員の心情を測る |
| Plan Future Improvements | 今後の改善を計画する |
| Permissions | 権限 |
| Granular Controls | きめ細かな制御 |
| Powered by | 提供 |
| AI Compose | AIで作成 |
| Book Time Off | 休暇を申請 |
| Build eNPS Surveys | eNPSサーベイを作成 |
| Create a Form | フォームを作成 |
| Create a Survey | サーベイを作成 |
| Gather Insights | インサイトを集める |
| Localize Content | コンテンツをローカライズ |
| Measure Engagement | エンゲージメントを測定 |
| Monitor Performance | パフォーマンスを把握 |
| Personalize Your Experience | 体験をパーソナライズ |
| Spot Trends | 傾向をとらえる |

### WorkvivoAdminCategories · frames 4585–4983 (3:03.4–3:19.3)
The admin settings nav — every category and sub-item.

| English | Japanese |
|---|---|
| Chat | チャット |
| Spaces | スペース |
| People | メンバー |
| Integrations | 連携 |
| View more | もっと見る |
| Platform | プラットフォーム |
| Features | 機能 |
| Themes | テーマ |
| Theming | テーマ設定 |
| Localization | ローカライズ |
| Timezone | タイムゾーン |
| Provisioning | プロビジョニング |
| API Keys & JWT Settings | APIキーとJWT設定 |
| App Integrations | アプリ連携 |
| Authentication Settings | 認証設定 |
| Profile Banner Settings | プロフィールバナー設定 |
| Space Approvals | スペースの承認 |
| Space Content Promotion | スペースコンテンツの掲載 |
| Video Subtitle Translations | 動画字幕の翻訳 |
| Webhook Settings | Webhook設定 |
| Zoom Configurations | Zoom 設定 |
| People Manager | ピープルマネージャー |
| Team Manager | チームマネージャー |

### SignOffScene · frames 5166–5300 (3:26.6–3:32.0)
The closing card.

| English | Japanese |
|---|---|
| The AI-native employee experience platform | AIネイティブの社員エクスペリエンスプラットフォーム |

### GoBeyondScene · appears in more than one scene
Kinetic type: 'Go beyond the numbers'.

| English | Japanese |
|---|---|
| Go beyond | 数字の |
| the | 先へ。 |
| numbers |  |

### WorkvivoAiComposeSettings · appears in more than one scene
The AI compose settings panel.

| English | Japanese |
|---|---|
| Learn more | 詳細 |
| Default | 既定 |
| Name | 名前 |
| AI Compose Settings | AI作成の設定 |
| Compose | 作成 |
| Writing Profiles | 文体プロファイル |
| Add new profile | プロファイルを追加 |
| Brand Voice | ブランドボイス |
| CEO Voice | CEOボイス |
| Internal Comms | 社内広報 |
| Workvivo AI for your Organization | 組織向け Workvivo AI |
| Allow users to choose a writing profile to tailor AI output to a specific role or audience. | 役割や読み手に合わせてAIの文章を調整できるよう、文体プロファイルを選べるようにします。 |
| Use Workvivo AI assistance and prompts to create and revise updates, articles and comments. | Workvivo AI の支援とプロンプトで、アップデート・記事・コメントを作成・推敲できます。 |
| By enabling AI, users in your organization can access and utilize Workvivo AI. | AIを有効にすると、組織のユーザーが Workvivo AI を利用できるようになります。 |

### WorkvivoBillboards · appears in more than one scene
The office-display arrangement.

| English | Japanese |
|---|---|
| Billboards | ビルボード |

### WorkvivoLeftColumn · appears in more than one scene
Left column of the home feed — profile card, quick links.

| English | Japanese |
|---|---|
| Surveys & Forms | アンケート・フォーム |
| Connect | つながる |
| View All | すべて表示 |
| View More | もっと見る |
| Trending Spaces | 注目のスペース |
| Featured News | 注目のニュース |
| Featured Pages | 注目のページ |
| Featured Documents | 注目のドキュメント |
| Joined | 参加済み |
| Corporate | 全社 |
| Global | 全社 |
| Posts | 投稿 |
| Days | 日 |
| Hours | 時間 |
| Minutes | 分 |
| Megan Wilson · 3 days ago · | 小林 恵 · 3日前 · |
| John Tobin · 2 days ago | 田村 拓海 · 2日前 |
| Sarah Black · 2 days ago | 石田 彩 · 2日前 |
| Sonya Clarke · 1 day ago | 西村 紗希 · 1日前 |
| Cody Brown · 1 week ago · | 岡田 大輝 · 1週間前 · |
| Jacob Johnson · 1 day ago · | 藤井 陽太 · 1日前 · |
| New Hires | 新入社員 |
| IT | IT |

### WorkvivoRightColumn · appears in more than one scene
Right column of the home feed — events, birthdays, links.

| English | Japanese |
|---|---|
| Events | イベント |
| View All | すべて表示 |
| View More | もっと見る |
| Trending Spaces | 注目のスペース |
| Featured Pages | 注目のページ |
| Featured Podcast | 注目のポッドキャスト |
| Quick Links | クイックリンク |
| Headquarters & Livestream | 本社・ライブ配信 |
| Joined | 参加済み |
| Social | ソーシャル |
| Posts | 投稿 |
| posted an article | が記事を投稿しました |
| 10th July | 7月10日 |
| Arjun Sharma | 高橋 亮 |
| IT | IT |
| Run Club | ランニング部 |
| For runners of every level. Share routes, training tips, race updates, and celebrate milestones together. | レベルを問わず走る仲間のためのスペース。コース、練習のコツ、大会情報を共有し、節目を一緒に祝いましょう。 |
| Join colleagues from across the organization for an evening of updates, recognition, networking, and.... | 全社の仲間が集まり、最新情報や表彰、交流を楽しむ夜。ぜひご参加ください… |
| Partly Cloudy | 晴れ時々曇り |

### WorkvivoSeerSurveyMobile · appears in more than one scene
The engagement survey as an employee answers it on a phone.

| English | Japanese |
|---|---|
| Close | 閉じる |
| Back | 戻る |
| Previous | 前へ |
| Skip | スキップ |
| Manager Insights | マネージャーインサイト |
| I am provided with the necessary tools and resources I need to do my job | 業務に必要なツールやリソースが十分に提供されている |
| My manager gives me regular, helpful feedback on my work | 上司から自分の仕事について有益なフィードバックを定期的にもらえている |
| I feel my contributions are recognized and valued by my team | 自分の貢献がチームに認められ、評価されていると感じる |
| I have good opportunities for career growth and professional development | キャリアの成長と能力開発の機会が十分にある |
| I would recommend our organization as a great place to work | 働きがいのある職場として、この組織を人に勧めたい |
| Agree | そう思う |
| Neutral | どちらでもない |
| Disagree | そう思わない |
| Add Comment | コメントを追加 |
| Survey Completed | 回答が完了しました |
| Thanks for taking the time to complete our survey. Your feedback is important to us. | アンケートへのご回答ありがとうございました。皆さんの声を大切にします。 |
| timeoff/Back | 休暇 |
| Next | 次へ |
| Submit | 送信 |

### Not traceable to one screen
Scoped keys, strings assembled from fragments, and entries whose English no longer appears in the source. Worth a read; harder to place.

| English | Japanese |
|---|---|
| Communication & Engagement | コミュニケーション とエンゲージメント |
| Reach, engage, and align every employee | 情報を届け、共感を生み、 組織を一つに |
| Search & Knowledge | 検索と ナレッジ |
| Find and access what you need instantly | 必要な情報に すぐにたどり着く |
| People Intelligence | ピープル インテリジェンス |
| Turn signals into insight, action, and results | シグナルを洞察に変え、 行動と成果へ |
| Tools | ツール |
| Anonymous | 匿名 |
| Shout-outs | シャウトアウト |
| Value updates | 価値観の投稿 |
| GIFs | GIF |
| Personalized Homepage Experiences | 一人ひとりに 最適化された ホーム画面 |
| What’s going on, | 調子はどうですか、 |
| reactions | リアクション |
| Just now | たった今 |
| posted a document. | がドキュメントを投稿しました |
| posted a Shout-out. | がシャウトアウトを投稿しました |
| is celebrating a work anniversary. | が勤続記念日を迎えました |
| Edit | 編集 |
| watching, started streaming | 人が視聴中・配信中 |
| steps completed | ステップ完了 |
| Published 1 day ago · | 1日前に公開 · |
| Jan 15, 2026 | 2026年1月15日 |
| · 3 days ago · New Hires | · 3日前 · 新入社員 |
| Submitted to Manager for Approval | 上長の承認待ち |
| Curated widgets for comms, culture, and everyday work—organized the way people actually browse. | 社内コミュニケーション、文化、日々の業務のためのウィジェットを、実際の使われ方に沿って整理しました。 |
| The integrations setup is explained on | 連携の設定方法はこちら： |
| Here, you can see how your team is feeling and what they think. This dashboard helps you spot any issues, understand team opinions, and take steps to make things better. | チームの状態や意見をここで確認できます。このダッシュボードで課題に気づき、チームの声を理解し、改善への一歩を踏み出しましょう。 |
| Rainy | 雨 |
| Sunny | 晴れ |
| Cloudy | 曇り |
| Snow | 雪 |
| Every employee deserves a headquarters. | すべての社員に、本社を。 |
| have | 実現します。 |
| one. |  |
| Personalized | 一人ひとりに合わせた |
| Experiences | 体験 |
| A dedicated space to explore, discuss, and act on Employee Insights. | 従業員インサイトを探り、話し合い、行動につなげるためのスペース。 |
| Lee Johnson | 斎藤 健 |
| Rachel Lopez | 三浦 恵子 |
| Jay Lee | 小川 拓也 |
| Megan Wilson | 小林 恵 |
| Manager Insights Action Hub | マネージャーインサイト アクションハブ |
| We're sharing our latest insights and updates on the actions being taken based on the feedback we've received last week. This document highlights key themes, opportunities, and the steps we're taking to continue improving the employee experience. Thank you to everyone who continues to share their perspectives! Your feedback helps guide meaningful change and shape the future of our organization 👏 | 先週いただいたフィードバックをもとに進めている取り組みと、最新のインサイトを共有します。この資料では、主なテーマ、改善の機会、そして従業員体験をさらに良くするためのステップをまとめました。声を寄せ続けてくださる皆さんに感謝します。皆さんのフィードバックが、意味のある変化と組織の未来を形づくります 👏 |
| The Complete Guide to our HR System | 人事システム 活用ガイド |
| Thanks for sharing! | 共有ありがとうございます！ |
| Was waiting for this one | これを待っていました |
| A New Hire's Guide to Success | 新入社員のための活躍ガイド |
| Management Enablement Session | マネジメント研修セッション |
| Conference Room B | 会議室B |
| We Hear You: Acting on Your Feedback | 声を受け止め、行動に変える |
| We share how listening to feedback helps us uncover insights, take action, and create a better workplace experience. | フィードバックに耳を傾けることが、どのように気づきを生み、行動につながり、より良い職場体験をつくるのかをお伝えします。 |
| Why We Value Your Feedback | なぜフィードバックを大切にするのか |
| Feedback is one of the most valuable assets an organization can have. It surfaces blind spots that internal teams can't see, highlights friction points before they become crises, and signals what's working well enough to double down on. When people feel heard, trust grows. When trust grows, engagement follows. And engaged employees, customers, and partners are the foundation of any thriving organization. The cost of ignoring feedback, on the other hand, is steep: turnover rises, loyalty erodes, and the same problems resurface year after year. | フィードバックは、組織にとって最も価値ある資産のひとつです。内側からは見えない盲点を明らかにし、摩擦が危機になる前に知らせ、うまくいっていることを教えてくれます。   |
| Turning Feedback Into Action | フィードバックを行動へ |
| We believe feedback is only valuable when it leads to meaningful action. By listening closely to the experiences, ideas, and perspectives shared with us, we gain a clearer understanding of what's working well and where there are opportunities to improve. Feedback helps us identify areas for growth, remove barriers, and make informed decisions that create a better experience for everyone. Taking action on feedback shows that every voice matters. It helps strengthen trust, improve communication, and build a culture where people feel encouraged to share openly. By turning insights into meaningful changes, we can continue to evolve, address challenges, and create a more connected and engaged organization. | フィードバックは、意味のある行動につながって初めて価値を持つと私たちは考えています。寄せられた経験や考え、視点に丁寧に耳を傾けることで、何がうまくいき、どこに改善の余地があるのかがはっきり見えてきます。   |
| What is our time off policy? | 休暇制度について教えて |
| Can you book me a day off? | 休暇を1日申請してもらえますか？ |
| Sure! I will book the day off on Workday for you. What date would you like to book? | はい、Workday で休暇を申請します。希望日はいつですか？ |
| Your day off request for February 20th has been successfully submitted to your manager for approval. You'll be notified once it's approved. | 2月20日の休暇申請を上長に送信しました。承認されると通知が届きます。 |
| Brainstorm Meeting | ブレスト会議 |
| Write a short paragraph about today | 今日について短い文章を書いて |
| Product sync | プロダクト定例 |
| What meetings do I have today? | 今日の会議は？ |
| Customer Presentation | 顧客向けプレゼン |
| timeoff/time |  |
| timeoff/off? |  |
| Answer | 回答 |
| Job Done | 完了 |
| AI Widget Builder | AIウィジェットビルダー |
| Images | 画像 |
| Polls | 投票 |
| News articles | ニュース記事 |
| Strongly Agree | 強くそう思う |
| Strongly Disagree | 全くそう思わない |
| This survey is designed to gauge the overall sentiment of our employees across the company. Your honest feedback helps leadership make informed decisions to improve our workplace culture, processes, and overall employee experience. All responses are anonymous and greatly appreciated. | このサーベイは、全社の社員がいま何を感じているかを把握するためのものです。皆さんの率直なフィードバックは、職場の文化・プロセス・社員エクスペリエンスを改善するための経営判断に役立てられます。回答はすべて匿名です。ご協力に心より感謝します。 |

## Customer copy

The words a customer's own film would replace — posts, the article, names, the survey. Everything above is Workvivo's product chrome; this is the content inside it. Corrections go into `src/japanese/japaneseCopy.ts` at the path shown.

274 entries.

| Path | Japanese |
|---|---|
| `companySize` | large |
| `companyName` | Spotify |
| `quote.original` | 四半期の締めくくりにあたり、チームの皆さんの努力と献身に心から感謝を伝えたいと思います。素晴らしい成果を上げ、困難な場面では互いに支え合い、お客様と事業の双方に価値を届け続けることができました。ここまで共に成し遂げてきたことを誇りに思うとともに、これからの数か月で何を実現できるのか、とても楽しみにしています。 |
| `quote.rewritten` | 素晴らしい四半期でした。<br><br>努力と協力、そして強い責任感に心から感謝します。共に大きな成果を上げ、互いを支え合い、確かな成果を残しました。ここまでの歩みを誇りに思い、次の挑戦を楽しみにしています 🚀 |
| `quote.translated` | What a quarter!<br><br>A huge thank you to the team for your hard work, collaboration, and commitment. Together we've delivered great results, supported one another, and made a real impact. Proud of everything we've achieved and excited for what's next. 🚀 |
| `livestream.title` | 全社ミーティング 🙌 |
| `livestream.description` | 8月の全社ライブ配信にぜひご参加ください。ひとつのチームとして集まり、成果を称え合い、課題に向き合いながら、これから進む道を一緒に見つめる時間です。 |
| `livestream.comments[0].name` | 江口 詩織 |
| `livestream.comments[0].text` | 質問があればコメントしてください 😊 |
| `livestream.comments[1].name` | 尾上 玲央 |
| `livestream.comments[1].text` | 共有ありがとうございます。 |
| `livestream.comments[2].name` | 小林 沙耶 |
| `livestream.comments[2].text` | すごい勢いですね！ |
| `livestream.comments[3].name` | 安藤 康平 |
| `livestream.comments[3].text` | いいですね、楽しみです :) |
| `livestream.comments[4].name` | 原 杏奈 |
| `livestream.comments[4].text` | 質問があればコメントしてください 😊 |
| `livestream.comments[5].name` | 馬場 佳奈 |
| `livestream.comments[5].text` | いい報告でした！ |
| `livestream.comments[6].name` | 田 悠人 |
| `livestream.comments[6].text` | シンガポールから参加中 |
| `livestream.chapters[0]` | CEO挨拶 |
| `livestream.chapters[1]` | 四半期の振り返り |
| `livestream.chapters[2]` | 主要な事業成果 |
| `livestream.chapters[3]` | 今後の展望 |
| `feed.billboards[0].title` | 考え、形にし、つながる |
| `feed.billboards[0].blurb` | 「考え、形にし、つながる」イベントにぜひご参加ください… |
| `feed.billboards[1].title` | 多様性とインクルージョンの取り組み |
| `feed.billboards[1].blurb` | 当社は誰もが力を発揮できる環境づくりに取り組んでいます… |
| `feed.billboards[2].title` | カスタマーサミット |
| `feed.billboards[2].blurb` | まもなく開催のカスタマーサミットにぜひご参加ください… |
| `feed.news[0].title` | 生産性を高める新しい取り組み |
| `feed.news[1].title` | 新入社員のための活躍ガイド |
| `feed.news[2].title` | 優れたチームがつながり続ける理由 |
| `feed.mobileNews[0].title` | 次のカスタマーイベントに向けた準備 |
| `feed.mobileNews[1].title` | 移動中の心の整え方 |
| `feed.mobileNews[2].title` | AI活用を加速する |
| `feed.spaces[0].name` | 新入社員ネットワーク |
| `feed.spaces[0].description` | 新しく加わった仲間が早く慣れ、必要な情報にたどり着けるように。 |
| `feed.spaces[1].name` | AI・デジタル推進 |
| `feed.spaces[1].description` | AIや自動化、新しい技術の可能性を探る場です。 |
| `feed.spaces[2].name` | 地域貢献活動 |
| `feed.spaces[2].description` | ボランティアや募金活動の情報を共有しています。 |
| `feed.pages[0].title` | AIリソースセンター |
| `feed.pages[1].title` | マネージャー向け資料 |
| `feed.pages[2].title` | 人事ページ |
| `feed.posts[0].title` | ボランティア募集を開始しました |
| `feed.posts[1].title` | 社員紹介：松岡 誠 |
| `feed.posts[2].title` | 読書会：今月の一冊 |
| `feed.appPost.document.author` | 山本 加奈 |
| `feed.appPost.document.space` | 新入社員 |
| `feed.appPost.document.body` | プロフィールの確認や休暇の申請など、人事システムの主な機能をこの資料で一通り確認できます。 |
| `feed.appPost.document.title` | 人事システム 活用ガイド |
| `feed.appPost.anniversary.author` | 中村 健一 |
| `feed.appPost.anniversary.body` | 本日で10年になりました。この10年を支えてくださった皆さんに感謝します。 |
| `feed.surveys[0].title` | 四半期サーベイ |
| `feed.surveys[1].title` | AI活用サーベイ |
| `feed.surveys[2].title` | 称賛に関するサーベイ |
| `feed.sidePost.headline` | ひとつの職場、ひとつの体験。 |
| `feed.sidePost.body` | 共通のスペースや協働、そして文化を通じて、組織全体でどのようにつながりが生まれているかをご紹介します。 |
| `feed.event.countdownName` | 社員サミット |
| `feed.event.bannerTitle` | 四半期キックオフ |
| `feed.documents[0].name` | 第3四半期 決算資料 |
| `feed.documents[1].name` | 年次報告書.pdf |
| `feed.documents[2].name` | ブランドガイドライン |
| `feed.documents[3].name` | ロゴデータ.svg |
| `feed.weather.city` | 東京 |
| `feed.weather.condition` | Rainy |
| `feed.weather.unit` | C |
| `feed.weather.temperature` | 11 |
| `feed.weather.high` | 14 |
| `feed.weather.low` | 9 |
| `feed.podcast.show` | リーディング・フォワード |
| `feed.podcast.episode` | #8 · これからのリーダーシップ |
| `stories[0].title` | カウントダウン開始 ⏱️ |
| `stories[0].body` | 年次「従業員体験サミット」まで、あと19日となりました。世界中のチームが一堂に会し、新しい働き方を探り、共通のビジョンのもとでつながり、これからの従業員体験を形づくります。 |
| `stories[1].title` | 四半期パルスサーベイのご案内 |
| `stories[1].body` | 皆さんの声をお聞かせください。数分で回答でき、組織全体の改善に活かされます。一人ひとりの意見が、より良い職場づくりにつながります。 |
| `stories[2].title` | マネージャー研修 – 残り1ステップ 🚀 |
| `stories[2].body` | ゴールはすぐそこです。最後のステップを完了すると、実践的な指針や資料、次に取るべき行動が確認できるようになります。 |
| `stories[3].title` | 全社でAI活用を加速 ⚡ |
| `stories[3].body` | AIは働き方を大きく変えています。必要な情報に素早くたどり着き、定型業務を自動化し、より確かな判断ができるよう、全拠点で活用が広がっています。 |
| `catchup[0].title` | ボランティアデーに400名が参加しました |
| `catchup[1].title` | 新しいラーニングセンターを訪ねて |
| `composed.recipient` | 佐藤 美咲 |
| `composed.values[0]` | 思いやりを大切に |
| `composed.values[1]` | 高い目標を掲げる |
| `composed.values[2]` | 全力で働き、全力で楽しむ |
| `composed.values[3]` | 自分らしく |
| `composed.value` | 思いやりを大切に |
| `composed.body` | 佐藤 美咲さん、ウェルビーイングの取り組みを牽引いただきありがとうございます。その働きが、組織全体の健やかな職場づくりを支えています 💜 |
| `person.name` | 田中 陽子 |
| `person.title` | 最高経営責任者 |
| `spaces.welcome.title` | 成長のためのスペース |
| `spaces.welcome.body` | ようこそ。メンター制度やツール、各種サポートに関する情報をここにまとめています。 |
| `spaces.directory[0].name` | リーダーシップの部屋 |
| `spaces.directory[0].description` | 経営からの発信、AMA、戦略アップデート、全社ミーティングの記録。 |
| `spaces.directory[1].name` | 管理職ネットワーク |
| `spaces.directory[1].description` | 管理職のための指針と資料、そして意見交換の場。 |
| `spaces.directory[2].name` | ラーニングハブ |
| `spaces.directory[2].description` | 研修、ワークショップ、資格取得、キャリア開発に関する情報。 |
| `spaces.directory[3].name` | 人事 |
| `spaces.directory[3].description` | 福利厚生、各種規程、キャリア開発、評価に関する資料と社員向けサポートの窓口。 |
| `spaces.directory[4].name` | 年次社員サミット |
| `spaces.directory[4].description` | アジェンダ、登壇者、最新情報、当日の資料など必要な情報をすべて。 |
| `spaces.directory[5].name` | お客様事例 |
| `spaces.directory[5].description` | 受注事例やケーススタディ、ビジネスへの影響をまとめています。 |
| `spaces.directory[6].name` | ITサポート |
| `spaces.directory[6].description` | ヘルプデスクの案内、稼働状況、各種手順書。 |
| `spaces.directory[7].name` | 営業支援 |
| `spaces.directory[7].description` | 営業向けのプレイブック、競合情報、商談サポート。 |
| `spaces.directory[8].name` | ランニング部 |
| `spaces.directory[8].description` | コース情報、大会エントリー、ペースを問わない練習メニュー。 |
| `spaces.directory[9].name` | ウェルビーイング |
| `spaces.directory[9].description` | メンタルヘルス支援、福利厚生、日々の健康づくりに役立つ情報。 |
| `spaces.page.about` | 今年の年次社員サミットのページへようこそ。アジェンダ、移動に関する案内、登壇者情報、よくある質問、ライブ配信の詳細、当日の資料まで、開催前に必要な情報をまとめています。 |
| `spaces.page.survey.title` | 社員サミット 移動サーベイ |
| `spaces.page.survey.meta` | 6問・記名式 |
| `spaces.page.post.author` | 松本 直樹 |
| `spaces.page.post.body` | 👏 今年の社員サミットの準備を進めてくれた運営メンバーに、心から感謝します。皆が集まる場をつくるために、何か月もの準備が舞台裏で重ねられてきました。当日を迎えるのが本当に楽しみです。 |
| `spaces.page.post.credit` | 社員サミット運営チーム |
| `spaces.page.featured.story` | 社員サミットのアジェンダを公開 |
| `spaces.page.featured.page` | 移動に関するご案内 |
| `spaces.page.featured.podcast` | サミット参加が初めての方へ |
| `spotlight.journey` | 新入社員オンボーディング 👋 |
| `spotlight.apps[0]` | Workday |
| `spotlight.apps[1]` | ServiceNow |
| `spotlight.apps[2]` | Zoom |
| `spotlight.quickLinks[0]` | 給与 |
| `spotlight.quickLinks[1]` | 福利厚生 |
| `spotlight.quickLinks[2]` | ITサポート |
| `spotlight.quickLinks[3]` | ラーニング |
| `spotlight.documents[0]` | 安全衛生手順 |
| `spotlight.documents[1]` | 社員ハンドブック |
| `spotlight.documents[2]` | 学習リソース |
| `spotlight.documents[3]` | 各種規程 |
| `spotlight.news[0].title` | 社員紹介 |
| `spotlight.news[1].title` | 学び続ける文化 |
| `spotlight.event.title` | 社員サミット |
| `spotlight.event.when` | 2026年8月13日（水）<br>17:00 - 20:30 |
| `journeys.phone.title` | 新入社員オンボーディング 👋 |
| `journeys.phone.blurb` | オンボーディングは、新しく加わった方が組織になじみ、自分の役割を理解するための道筋です。 |
| `journeys.phone.steps[0]` | ようこそ 🚀 |
| `journeys.phone.steps[1]` | 新入社員スペース |
| `journeys.phone.steps[2]` | オンボーディング概要 |
| `journeys.phone.steps[3]` | はじめの一歩 |
| `journeys.phone.steps[4]` | 私たちの価値観 |
| `journeys.phone.steps[5]` | オンボーディングサーベイ |
| `journeys.wall[0]` | IT・セキュリティ研修 |
| `journeys.wall[1]` | 新入社員オンボーディング |
| `journeys.wall[2]` | 転勤に関する案内 |
| `journeys.wall[3]` | AI活用プログラム |
| `journeys.wall[4]` | 実践する企業文化 |
| `journeys.wall[5]` | 育児休業制度 |
| `journeys.wall[6]` | リーダーシップ研修 |
| `journeys.wall[7]` | 学び続ける文化 |
| `journeys.wall[8]` | 職場のサステナビリティ |
| `signage.translatedFrom` | スウェーデン語から翻訳 |
| `signage.reactionEmoji` | 🎵 |
| `signage.stories[0].author` | 田中 陽子 |
| `signage.stories[0].action` | 全社アップデートを投稿 |
| `signage.stories[0].scope` | 全社 |
| `signage.stories[0].headline` | チームにとって大きな節目です 👏 |
| `signage.stories[0].body` | この節目を実現するために力を合わせてくれた世界中のチームに、心から感謝します。音楽とクリエイターへの情熱、そして高い集中力が違いを生みました。共に築いてきたものを誇りに思い、この先をとても楽しみにしています。 |
| `signage.stories[0].value` | 情熱と革新 |
| `signage.stories[1].author` | 小林 恵 |
| `signage.stories[1].action` | 職場に関する投稿 |
| `signage.stories[1].scope` | ストックホルム本社 |
| `signage.stories[1].headline` | ストックホルムのスタジオが開設しました 🎧 |
| `signage.stories[1].body` | ハイブリッドなチーム、クリエイターとの協業、ライブ録音のために設計された空間です。リスニングルームやポッドキャストスタジオは、Workvivo の予約ツールから利用できます。 |
| `signage.stories[1].value` | 協働と遊び心 |
| `signage.stories[2].author` | 高橋 亮 |
| `signage.stories[2].action` | プロダクトリリースを投稿 |
| `signage.stories[2].scope` | クリエイターチーム |
| `signage.stories[2].headline` | Spotify for Artists: In Focus を全世界で公開 🚀 |
| `signage.stories[2].body` | 次世代のアナリティクス、リアルタイムのリスナー分析、ファンとの直接的な収益化を、世界中のインディペンデントなアーティストへ。部門を越えた大きな成果です。 |
| `signage.stories[2].value` | 成長とインパクト |
| `signage.article.title` | Spotify for Artists：In Focus 特集 |
| `signage.article.author` | 小林 恵 |
| `signage.event.title` | グローバル全社ミーティング |
| `signage.anniversary.name` | 渡辺 翔太 |
| `signage.anniversary.note` | 本日で入社2周年を迎えました！ |
| `signage.link` | https://spotify.link/all-hands-stream |
| `newsletters.items[0].title` | 全社ミーティング |
| `newsletters.items[0].folder` | 全社 |
| `newsletters.items[1].title` | 最新アップデート |
| `newsletters.items[1].folder` | 更新情報 |
| `newsletters.items[2].title` | 金曜まとめ |
| `newsletters.items[2].folder` | レポート |
| `newsletters.items[3].title` | 新しい仲間たち |
| `newsletters.items[3].folder` | Woofvivo |
| `newsletters.folders[0]` | 全社 |
| `newsletters.folders[1]` | 更新情報 |
| `newsletters.folders[2]` | Woofvivo |
| `newsletters.folders[3]` | レポート |
| `newsletters.folders[4]` | ニュース |
| `chat.channel` | 東京オフィス 👋 |
| `chat.channelMeta` | # 723 · 東京オフィスへようこそ… |
| `chat.messages[0]` | おはようございます！調子はいかがですか？ |
| `chat.messages[1]` | 皆さん、先日の社員旅行の写真を共有します 😊 |
| `chat.messages[2]` | とてもいいですね！ |
| `chat.messages[3]` | 企画ありがとうございました 👏 |
| `chat.messages[4]` | ありがとうございます！当日の資料も共有いただけますか？ 😎 |
| `chat.senders[0]` | 加藤 明日香 |
| `chat.senders[1]` | 森田 拓也 |
| `chat.caller` | 石井 麻衣 |
| `chat.summary` | 協働とつながり、そして共通の目標に重点を置いた社員旅行が開催されました。参加者はコミュニケーションを深め、重点課題の認識を揃えるワークショップに取り組みました。会場や会議スペース、各種アクティビティの手配は、参加者が滞りなく過ごせるよう調整され、当日はスケジュールや現地対応をチーム全体で支えました。今後の取り組みについても一部が共有され、詳細は数週間以内に案内される予定です。 |
| `hq.answer.title` | 休暇の申請 |
| `hq.answer.body` | 休暇の申請方法は2つあります。HQ エージェントに依頼して自動で処理する方法と、Workday から自分で手続きする方法です。 |
| `hq.results[0].title` | 休暇制度について |
| `hq.results[0].space` | 人事資料 |
| `hq.results[0].description` | 年次有給休暇、傷病休暇、祝日、特別休暇など、利用できるすべての休暇について、付与日数、申請期限、承認の流れとあわせて説明しています。 |
| `hq.results[1].title` | Workday での休暇申請手順 |
| `hq.results[1].space` | 新入社員 |
| `hq.results[1].description` | Workday での申請・変更・取り消しの手順を、承認者や申請の目安時期とあわせて順を追って説明します。 |
| `hq.attachment` | 休暇制度について.pdf |
| `hq.resultAuthor` | 山本 加奈 |
| `article.prompt` | チームの生産性を高めるページを作成して |
| `article.title` | チームの生産性 |
| `article.language` | 日本語 |
| `article.lead` | 生産性の向上は、効率よく働き、明確に伝え合い、共通の目標に集中できる環境をつくることから始まります。 |
| `article.heading` | 認識を揃えるための重点領域 |
| `article.points[0].label` | 明確な方向性 |
| `article.points[0].body` | チームの目標、担当範囲、測定できる成果を全員が理解している状態をつくります。 |
| `article.points[1].label` | 率直なコミュニケーション |
| `article.points[1].body` | 定期的な対話と部門を越えた可視化によって、停滞の要因を取り除きます。 |
| `article.points[2].label` | 優先順位の見極め |
| `article.points[2].body` | 不要な負荷を減らし、影響の大きい取り組みに力を集中させます。 |
| `article.quote` | 明確な優先順位とつながりのあるコミュニケーションが、日々の協働を確かな成果へと変えていきます。 |
| `article.quoteAuthor` | 従業員体験チーム |
| `article.closing` | 大きな目標を具体的な行動に分解することで、チームは共通の目的のもと、より速く前進できます。 |
| `surveyBuilder.prompt` | 社員がいまどう感じているかを確かめるサーベイを作成します。 |
| `seer.questions[0]` | 業務に必要なツールやリソースが十分に提供されている |
| `seer.questions[1]` | 上司から自分の仕事について有益なフィードバックを定期的にもらえている |
| `seer.questions[2]` | 自分の貢献がチームに認められ、評価されていると感じる |
| `seer.questions[3]` | キャリアの成長と能力開発の機会が十分にある |
| `seer.questions[4]` | 働きがいのある職場として、この組織を人に勧めたい |
| `seer.segments[0].name` | 全社 |
| `seer.segments[0].kind` | すべて |
| `seer.segments[1].name` | 大阪 |
| `seer.segments[1].kind` | 拠点 |
| `seer.segments[2].name` | 東京 |
| `seer.segments[2].kind` | 拠点 |
| `seer.segments[3].name` | CX |
| `seer.segments[3].kind` | 部門 |
| `seer.segments[4].name` | 人事 |
| `seer.segments[4].kind` | 部門 |
| `seer.segments[5].name` | IT |
| `seer.segments[5].kind` | 部門 |
| `seer.segments[6].name` | マーケティング |
| `seer.segments[6].kind` | 部門 |
| `seer.segments[7].name` | プロダクト |
| `seer.segments[7].kind` | 部門 |
| `seer.segments[8].name` | 営業 |
| `seer.segments[8].kind` | 部門 |
| `seer.topics[0]` | チームの協働 |
| `seer.topics[1]` | 職場環境 |
| `seer.topics[2]` | 従業員満足度 |
| `seer.topics[3]` | 職場の雰囲気 |
| `seer.topics[4]` | 競争環境 |
| `seer.topics[5]` | 従業員の士気 |
| `seer.topics[6]` | 成果への評価 |
| `seer.topics[7]` | 同僚との関係 |
| `seer.topics[8]` | 職場の情報共有 |
| `seer.topics[9]` | チームの力学 |
| `seer.comments[0].driver` | ウェルビーイング |
| `seer.comments[0].question` | 仕事と生活のバランスをうまく保てている |
| `seer.comments[0].body` | バランスを保つよう心がけていますが、難しく感じる時期もあります。 |
| `seer.comments[1].driver` | キャリア開発 |
| `seer.comments[1].question` | ここには成長できる機会が実際にある |
| `seer.comments[1].body` | この四半期はとても良い研修を受けられました。 |
| `seer.comments[2].driver` | コミュニケーション |
| `seer.comments[2].question` | チームの会議や情報共有は頻度も質も十分である |
| `seer.comments[2].body` | しばらくチームで集まる機会がありません。 |

### Number and date rules
These are patterns, not fixed strings — anything with a count or a date in it. `$1` is the number the film supplies.

| Matches | Becomes |
|---|---|
| `/^(\d+) Questions?$/` | 設問$1問 |
| `/^(\d+) steps? remaining$/` | 残り$1ステップ |
| `/^(\d[\d,]*) [Cc]omments?$/` | コメント$1件 |
| `/^(\d[\d,]*) reactions?$/` | リアクション$1件 |
| `/^(\d[\d,]*) Members$/` | メンバー$1人 |
| `/^(\d+) new replies$/` | 新しい返信$1件 |
| `/^View all (\d+) comments$/` | コメント$1件をすべて表示 |
| `/^(\d+) days? ago(\s*·)?$/` | $1日前$2 |
| `/^(\d+) hours? ago(\s*·)?$/` | $1時間前$2 |
| `/^(\d+) minutes? ago(\s*·)?$/` | $1分前$2 |
| `/^(\d+)m ago$/` | $1分前 |
| `/^(\d+) weeks? ago(\s*·)?$/` | $1週間前$2 |
| `/^Just now(\s*·)?$/` | たった今$1 |
| `/^What[’']s going on, (.+)\?$/` | $1さん、調子はどうですか？ |
| `/^Published (\d+) days? ago(\s*·)?$/` | $1日前に公開$2 |
| `/^Published (\d+) weeks? ago(\s*·)?$/` | $1週間前に公開$2 |
| `/^Posted (\d+) days? ago$/` | $1日前に投稿 |
| `/^Posted (\d+) hours? ago$/` | $1時間前に投稿 |
| `/^(\d+) Minutes, (\d+) Questions, Anonymous$/` | $1分・$2問・匿名 |
| `/^Day (\d+)$/` | $1日目 |
| `/^(\d[\d,]*) Audience$/` | 対象者$1人 |
| `/^(\d+) Columns$/` | $1カラム |
| `/^Apr (\d+), 2026$/` | 2026年4月$1日 |
| `/^(\d+) (Jan|Feb|Mar|Apr|May|Jun) 2026$/` | 2026年$2$1日 |
