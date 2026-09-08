# Japanese voiceover script — v3, timed to the cut

Record **[docs/audio/japanese-vo-v3.txt](audio/japanese-vo-v3.txt)**. This document explains
it. The script itself is a plain text file, one beat a line, so that everything below can be
regenerated from it rather than transcribed:

```bash
python3 scripts/score-vo-script.py docs/audio/japanese-vo-v3.txt && python3 scripts/script-diff.py docs/audio/japanese-vo-v1.txt docs/audio/japanese-vo-v3.txt && node scripts/predict-vo-fit.mjs docs/audio/japanese-vo-v3.txt
```

## What v2 got wrong, since v2 is still in the repo

v2 was measured in **characters**, and characters are not the unit. A kanji carries two or
three mora and a katakana character carries one, so a character count means something
different for `エンゲージメントサーベイ` than for `経営層と現場` — which is exactly the
variation between lines that a timing model exists to capture. Against this read, per line:

| unit | rate | cv | median error | worst |
|---|---|---|---|---|
| mora | 8.48/sec | 0.139 | 0.38s | 1.44s |
| characters | 7.56/sec | 0.162 | 0.61s | 1.75s |

The mora model is 59% more accurate per line, so v2's budgets were wrong in proportion to
each line's script mix, and the ranking of "which beats are tight" was wrong with them.

v2 also budgeted **100% of each window**, which assumes the reader starts each sentence at
the instant the last one ends, 31 times. The budgets below are **85%**, leaving the rest as
breath.

One correction in the other direction: beat 2 is not the problem the character model made it
look like. In mora it is 78 into an 11.5s window — **9.2s of speech, 80% fill**, the most
comfortable of the long beats. The character count made it look 3 over because
`コミュニケーション、ナレッジ、アクション、インサイト` is almost pure katakana, where
characters and mora nearly coincide, while the budget it was compared against came from a
whole-script average dominated by kanji. Nothing in beat 2 needed cutting, so v2's three
silent cuts there are reverted below.

## The three cuts you pushed back on, restored

| beat | restored | what it cost |
|---|---|---|
| 4 | `パーソナライズされた` | dropped `大丈夫` and `状況を` instead |
| 21 | `社員にとって` | dropped `エンゲージメント` from `エンゲージメントサーベイ` |
| 27 | `セルフサービス型` and `社員エクスペリエンス` (was `体験`) | `機能のオン/オフ設定` → `機能設定`; this beat runs at 1.03x |

On beat 27 I had written that the toggles were visible on screen. They are not — the scene
under it (`Workvivo Admin Hub`, frames 4553–4591) shows `管理ツール`, `プロダクト` and
`クイックリンク`, with no toggle UI. The label that *is* on screen is `管理ツール`, so if this
beat has to give up more, `管理ツール` is the phrase the picture already supplies, not
`セルフサービス型`.

## The script

`•` = above the 85% target but inside its window. `⚠️` = over its window.

| # | Start | Window | Mora | Speech | Fill | Line |
|---|---|---|---|---|---|---|
| 1 | 0.6s | 5.1s | 24 | 2.8s | 55% | すべての社員に、本社を。それが、いま実現します。 |
| 2 | 5.8s | 11.5s | 78 | 9.2s | 80% | Workvivo HQ へようこそ。コミュニケーション、ナレッジ、アクション、インサイト。そのすべてが一つにつながる、AIネイティブの社員エクスペリエンスプラットフォームです。 |
| 3 | 17.2s | 7.1s | 45 | 5.3s | 74% | パーソナライズされたホーム画面で、役割・チーム・拠点ごとに最適な体験を届けます。 |
| 4 | 24.4s | 4.7s | 34 | 4.0s | 85% • | 休暇明けも、パーソナライズされたAI要約ですぐにキャッチアップ。 |
| 5 | 29.1s | 7.3s | 43 | 5.1s | 69% | 思わず目を引くコンテンツで、情報を届け、つながりを生み、エンゲージメントを高めます。 |
| 6 | 36.4s | 7.5s | 45 | 5.3s | 71% | 企業のバリューに紐づいた称賛の投稿で、成果をたたえ、活躍する仲間を認め合う。 |
| 7 | 43.8s | 7.8s | 48 | 5.7s | 73% | 自社の人・文化・トーンを理解したAIが、コンテンツの作成・推敲・ローカライズを数秒で。 |
| 8 | 51.6s | 7.6s | 53 | 6.2s | 82% | 経営層と現場をリアルタイムにつなぎ、大切な瞬間を、誰もが参加できる双方向の体験に。 |
| 9 | 59.2s | 6.4s | 37 | 4.4s | 68% | コラボレーション、対話、つながりのための専用スペースで、コミュニティをより強く。 |
| 10 | 65.6s | 7.3s | 54 | 6.4s | 88% • | オンボーディングから変革の浸透まで。一人ひとりに最適化された、AI活用のジャーニーを届けます。 |
| 11 | 72.9s | 6.5s | 40 | 4.7s | 73% | 社内のディスプレイに Workvivo を表示し、コミュニケーションの届く範囲を広げます。 |
| 12 | 79.3s | 4.7s | 27 | 3.2s | 68% | ニュースレターで、いちばん届けたいストーリーを、もう一度。 |
| 13 | 84.0s | 7.0s | 46 | 5.4s | 78% | チャット、音声・ビデオ通話、AIによる会話の要約で、コラボレーションはもっとスピーディーに。 |
| 14 | 91.0s | 9.0s | 67 | 7.9s | 88% • | HQ に聞けば、連携したシステム全体から答えがすぐに見つかります。次のアクションまで、HQ を離れる必要はありません。 |
| 15 | 100.0s | 3.0s | 20 | 2.4s | 80% | 質問から、回答へ。そして、完了まで。 |
| 16 | 102.9s | 10.1s | 58 | 6.8s | 68% | 一つのアプリに、状況に応じた複数の体験を。どこにいても、必要なツール、リソース、情報にアクセスできます。 |
| 17 | 113.0s | 7.8s | 53 | 6.2s | 80% | 業務ツールや各種連携から、ニュース、カルチャー、社員向けリソースまで。すぐに使えるウィジェットで思いのままに。 |
| 18 | 120.8s | 3.7s | 23 | 2.7s | 73% | AI ウィジェットビルダーで、自分だけの一つを。 |
| 19 | 124.5s | 10.4s | 71 | 8.4s | 81% | AI によるページ作成で、洗練されたコンテンツを数分で公開。散在していた情報を、整理された検索可能なナレッジハブへ。 |
| 20 | 134.9s | 7.9s | 55 | 6.5s | 82% | 高度な分析機能で、何がうまくいっているかを可視化し、社員を理解し、勘ではなく実際のデータで動く。 |
| 21 | 142.8s | 5.1s | 36 | 4.2s | 83% | 回答が集まるサーベイで、社員にとって大切なことを測定します。 |
| 22 | 147.9s | 8.0s | 60 | 7.1s | 89% • | AI インサイトが、数字の先を明らかに。傾向をとらえ、エンゲージメントを動かす要因と、次の一手を示します。 |
| 23 | 155.9s | 6.2s | 40 | 4.7s | 76% | マネージャーはチームの状態をすぐに把握でき、自信を持って行動を起こせます。 |
| 24 | 162.1s | 7.6s | 54 | 6.4s | 84% | 場所を問わず。フィードバックが届いた瞬間から、変化を実感するまで。すべてが、ここ HQ で完結します。 |
| 25 | 169.7s | 6.1s | 41 | 4.8s | 80% | サーベイ作成の手間は AI におまかせ。すぐに結果の確認から始められます。 |
| 26 | 175.7s | 6.3s | 44 | 5.2s | 83% | 使い慣れたツールのすべてを、一つの体験レイヤーに。必要なものは、すべて HQ に。 |
| 27 | 182.0s | 5.2s | 47 | 5.5s | 107% ⚠️ | セルフサービス型の管理ツールと機能設定で、社員エクスペリエンスを安心して運用。 |
| 28 | 187.2s | 6.7s | 50 | 5.9s | 87% • | きめ細かな制御、権限設定、ガバナンスを標準搭載。安心して AI を活用できます。 |
| 29 | 193.9s | 5.6s | 39 | 4.6s | 82% | Zoom の AI を基盤に。エンタープライズグレードの知能を、すべての体験に。 |
| 30 | 199.5s | 7.2s | 50 | 5.9s | 82% | 社員が本当に使うエクスペリエンスプラットフォーム。世界を代表するブランドに選ばれています。 |
| 31 | 206.7s | 5.3s | 15 | 1.8s | 33% | これが、Workvivo HQ です。 |

**Do not read to the clock.** Read naturally; the pipeline places each line on its anchor.
The budgets exist so that placement never needs to compress.

## What the one over-window beat actually costs

A per-beat budget is the right unit for writing but pessimistic about what happens next,
because `scripts/build-japanese-vo.mjs` does not place lines one at a time — it solves the
whole track, so a long line next to a short one is placed early rather than sped up. Running
the real solver over these predicted durations (`node scripts/predict-vo-fit.mjs`):

| | v1 | v2 | v3 |
|---|---|---|---|
| beats left at 1.00x | 21 of 31 | 31 of 31 | 30 of 31 |
| worst tempo | 1.162x | 1.000x | **1.034x** |
| worst drift from anchor | 0.61s | 0.00s | 0.13s |

So beat 27 at 107% of its own window is placed 0.13s early, into beat 26's slack, and read
at 1.034x. v1's problem was three beats at 1.12–1.16x, which is audible. This is not.

That is a prediction from mora, carrying the calibration's own median error of 0.38s a line.
It is not a promise — but the comparison between the three drafts is sound, because all
three go through the same model.

## What changed from v1 — generated, not remembered

This table is produced by `python3 scripts/script-diff.py docs/audio/japanese-vo-v1.txt
docs/audio/japanese-vo-v3.txt`, which tokenises both files and reports every insertion,
deletion and replacement. The v2 log was written from memory and was wrong by omission —
beat 2's `その`, `つながる→なる` and `です` were all missing from it, as was beat 17's `各種`,
and beat 21's entry gave "duplicate intensifiers" as the reason for an edit that also removed
the possessor `社員にとって`. Reading that log, you would have approved changes you had never
seen. This one cannot omit anything; the *Why* column has to account for what the diff
already shows.

`−x` = removed, `+x` = added, `x → y` = replaced.

| # | Mechanical diff | Why |
|---|---|---|
| 1 | `−WorkvivoHQへようこそ。` | Moved to beat 2, not cut — see the next row. |
| 2 | `+WorkvivoHQへようこそ。` | The welcome belongs to the English sentence at 5.76s, not the two at 0.64s. Beat 1 drops from 39 mora to 24 and beat 2 rises to 78, both comfortable. |
| 4 | `大丈夫。AIによる → 、` ; `+AI` ; `−、` ; `−状況を` | Reads as: `休暇明けも大丈夫。AIによるパーソナライズされた要約で、すぐに状況をキャッチアップ。` → `休暇明けも、パーソナライズされたAI要約ですぐにキャッチアップ。` `大丈夫` is reassurance the rest of the sentence already gives; `状況を` is implied by `キャッチアップ`. `AIによる…要約` becomes `AI要約` to put the personalisation claim first. `パーソナライズされた` is kept — it is the product claim. |
| 8 | `−変えます` | 体言止め, matching beats 7, 12 and 29. The `に` carries the transformation. |
| 10 | `−合わせて` ; `れる → れた` | `一人ひとりに合わせて最適化される` → `一人ひとりに最適化された`. The `に` already means "tailored to"; `合わせて` says it twice. |
| 11 | `−あらゆる` ; `−のコンテンツ` ; `−社内` ; `が → の` | `社内` appeared twice in one sentence; the second is implied. `のコンテンツ` goes because displaying Workvivo *is* displaying its content. `あらゆる` is emphasis on a list of one. |
| 13 | `−そして` | Third item in a three-item list; the comma does the work. |
| 14 | `−必要な` ; `−さらに、そのまま` ; `。 → 、` | `さらに、` adds nothing after a full stop, and `そのまま` repeats what `次のアクションまで` says. `必要な答え` → `答え`: an answer you did not need is not an answer. |
| 17 | `+で思い` ; `ライブラリで、思い描いた形 → まま` | `ウィジェットのライブラリで、思い描いた形に` → `ウィジェットで思いのままに`. The library is what is on screen; `思いのままに` is the idiom `思い描いた形に` is reaching for. `各種` is **kept** — v2 dropped it silently. |
| 18 | `−もちろん、` ; `+、` ; `ウィジェット → 一つ` ; `−作ることもできます` | 38 mora into a 26 budget in v1 — the tightest beat in the film. `もちろん、` is filler; `ウィジェットを作ることもできます` repeats `ウィジェットビルダー` immediately after saying it. |
| 20 | `にもとづいて → で` | `実際のデータにもとづいて動く` → `実際のデータで動く`. Same claim, and `で` is what a person says. |
| 21 | `−きちんと` ; `−エンゲージメント` ; `−本当に` | `きちんと` and `本当に` are two intensifiers on one clause, which was the v2 reasoning and stands. **`社員にとって` is kept** — v2 removed the possessor and did not say so. Paying for it by shortening `エンゲージメントサーベイ` to `サーベイ`: beat 22 says `エンゲージメント` 5 seconds later, and the screen under this beat is a survey. |
| 22 | `−にあるもの` ; `を可視化し → と` ; `に注力すべきポイント → の一手` | `数字の先にあるもの` → `数字の先` loses nothing. `要因を可視化し、次に注力すべきポイントを示します` → `要因と、次の一手を示します`: `可視化` is already beat 20's verb, and `次の一手` is the idiom. |
| 24 | `社員 → フィードバック` ; `フィードバックを届け → 届い` ; `−確かな` ; `−その時` ; `−その` | `社員がフィードバックを届けた瞬間` → `フィードバックが届いた瞬間`. The subject is established and the sentence is about the feedback. `その時まで` duplicates `まで`; `確かな` and `その` are emphasis. |
| 26 | `−社員に` ; `−の中` | `社員` is the subject of the previous clause. `HQ の中に` → `HQ に` — `に` is already "in". |
| 27 | `−強力な` ; `−のオン/オフ` ; `−できます` | 61 mora into a 5.2s window, the most over-stuffed beat in the film. `強力な` is an adjective doing no work next to four concrete claims. `機能のオン/オフ設定` → `機能設定` is the only real loss and it is deliberate: it is the cheapest of the four claims, and **`セルフサービス型` and `社員エクスペリエンス` are both kept**, which is what v2 got wrong. |
| 29 | `−テクノロジー` ; `インテリジェンス → 知能` | `Zoom の AI テクノロジー` → `Zoom の AI` — `AI` is already the technology. `インテリジェンス` is 7 mora of katakana for a word Japanese has; `知能` is 3. |

14 of the 31 beats are unchanged from v1.

## Unchanged and deliberate

- Terminology per the brief: `社員` (not `従業員`), `本社` only in beat 1, `拠点` kept in
  beat 3, `サーベイ` (not `調査`), `世界を代表する` (not `世界最大`).
- `社員エクスペリエンスプラットフォーム` is left as supplied. If Workvivo's Japanese site
  uses `従業員エクスペリエンス`, that is a human decision, not this document's.
- Beat 31 is 15 mora into a 5.3s window. It is the closing line and should breathe.

## After recording

1. Drop the file in `public/audio/` and point `scripts/transcribe-vo.mjs` at it.
2. Re-run the alignment, then `node scripts/build-japanese-vo.mjs`.
3. `node scripts/verify-japanese-vo.mjs` transcribes the built soundtrack and reports where
   each line actually landed. Check that against the predicted table above — if a beat needs
   materially more compression than predicted, the rate in `scripts/score-vo-script.py`
   wants recalibrating against the new read, not overriding by hand.
4. Re-run `python3 scripts/prep-japanese-font.py` only if the on-screen copy changed. The
   voiceover does not affect the font subset.
