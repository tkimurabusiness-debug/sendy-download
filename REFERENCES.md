# このページが下敷きにした実在サイト

竹蔵の指示 (2026-08-03)

> UIを作る時は既存のsaasとかを参考のものを探し、それのCSSやレイアウトをそのまま使うようにして。
> 0から君に書かせると文字が多いゴミになるのでちゃんと参考のものを探してきて提示し、
> それを元に完璧なものを作れるようにして。

だからこのページのレイアウトは**実在する製品の紹介ページから採寸して移植**している。
下に「どのページの何を借りたか」を1行ずつ書く。数値は 2026-08-03 に
`~/.claude/bin/css-harvest` と Chrome DevTools の `getComputedStyle` で**実測**したもの。

色・書体・角丸は借りない。それは `css/00-base.css` の `:root` (Sendy 自身の土台) をそのまま使う。
借りるのは**並べ方 (レイアウト) と 文章の長さの配分 (情報設計)** だけ。

---

## 1. Linear — 機能一覧のページ (https://linear.app/features)

採寸日 2026-08-03 / 幅 1440 で実測。

| 借りたもの | 実測値 | Sendy のどこに使ったか |
|---|---|---|
| 機能カードの並べ方 | `display:grid` / `grid-template-columns: 476px 476px` / `gap: 24px` / 枠 976px | `.cap-grid` (できること一覧)。枠は 1100px。**載せる機能が23個あるので2列ではなく3列**にした (`repeat(auto-fill, minmax(300px,1fr))`)。gap 24px は Linear の実測値のまま |
| カードの中身の作り | 上に**小さい灰色の分類名**、下に**大きい白い1文**。機能の名前を主役にせず、benefit の1文を主役にする | `.cap-kicker` (機能の名前) + `.cap-title` (困りごとが消える1行) |
| 分類名の文字 | `font-size:13px / line-height:19.5px / weight:510 / letter-spacing:-0.13px / color:#8a8f98` | `.cap-kicker` = 13px / 1.5 / 600 / -0.01em / `var(--fg-faint)` |
| 主役の1文の文字 | `font-size:20px / line-height:26.6px / weight:510 / letter-spacing:-0.24px` | `.cap-title` = 19px / 1.45 / 650 / -0.02em (3列にして幅が狭いぶん 20px→19px) |
| カードの余白 | `padding: 32px 24px` / `border-radius:16px` | `.cap-card` = padding 26px 24px。角丸は Sendy 既定の `var(--radius)` 18px を使う (新しい角丸を作らない) |
| 説明文の長さ | 1機能につき **6〜10語の1文だけ** (「Streamline product development with AI-powered workflows and agents」) | 1機能につき **説明は2行まで**。それを超える話は `<details>` に畳む |

## 2. Notion Calendar (旧 Cron) — 製品ページ (https://www.notion.com/product/calendar)

| 借りたもの | 実測・実物 | Sendy のどこに使ったか |
|---|---|---|
| 見出しの言い方 | 見出しが**機能名ではなく結果**。実物: 「See your schedule at a glance」「No more double bookings」「Work across time zones」 | `.cap-title` の文言をぜんぶ「◯◯が無くなる / ◯◯しなくていい」の形にした |
| 見出しの句読点 | 小見出しに **`.` を付けていない** (大見出しだけ付ける) | 竹蔵の掟 (見出しに「、」「。」を入れない) と同じ。`node scripts/check-page.mjs` で機械的に固定 |
| 3列グリッド | `grid-template-columns: 248.6px × 3` / `column-gap: 24px` / 枠 794px | `.aud-grid` (あなたはどれですか。3つの入口) = `repeat(auto-fit, minmax(260px,1fr))` / gap 24px |

## 3. Superhuman — トップページ (https://superhuman.com/)

| 借りたもの | 実物 | Sendy のどこに使ったか |
|---|---|---|
| 使う人の型で入口を分ける | ナビの Solutions が Enterprises / Education / Marketing teams / IT teams と**役割で分岐**している | `#audience` の3つの入口 (毎日たくさん返す人 / AI を仕事で使う人 / 窓口がいくつもある人) |
| 効きめで言い切る見出し | 「Fly through your inbox twice as fast as before」「Schedule meetings without leaving the conversation」— 機能名を一切出さない | `.aud-title` と `.cap-title` の言い方 |
| 1つの製品につき箇条書き4つ | 製品ごとに mockup + **4つだけ**の要点 | 入口1つにつき紹介する機能は**3つまで**に絞った |

## 4. Raycast — トップページ (https://www.raycast.com/)

| 借りたもの | 実測値 | Sendy のどこに使ったか |
|---|---|---|
| 名前と値の対を並べる格子 | `Testimonials_highlight` = `grid-template-columns: 147.9px 311.1px` / `gap: 16px 24px` | `.feat--ai .feat-ai-facts` (AI 向けの情報) の `dt` 幅 = 148px。以前は 210px で、2列に折り返すと説明の欄が細くなりすぎていた |
| 説明を付けない密な索引 | footer が `146.6px × 6列` / `gap:32px`、**説明文ゼロ**のリンクだけ | AI 向けの節は文章にせず、短い項目の並びにする |
| 機能を2つ横に並べる | `Automation_grid` = `582px 582px` / `gap: 40px` | `.cap-grid` の2列構成の裏付け (Linear と同値の作り) |

## 5. すでにこのページで使っている下敷き (前から入っているもの・変えていない)

| 借りたもの | 出所 |
|---|---|
| 上のヘッダーが丸いピルに縮む動き | `@samasante/liquid-glass` のヘッダー実装 (`css/00-base.css` の `.lg-header`) |
| 連番画像を canvas で送る演出 | GSAP 公式 `imageSequence()` ヘルパー (Apple の AirPods Pro ページを GreenSock が再現したもの) — `js/features.js` |
| スクロールで画面を固定する構成 | Codrops `folding-cardboard-box` (MIT) の `gsap.timeline({ scrollTrigger: { scrub, pin } })` — `css/10-features.css` |
| 一番下の巨大な文字 | Leonardo.ai の `s-text-fill` のマークアップ — `css/30-footer.css` |

---

## 借りなかったもの (意図的に外した)

- Linear の書体 `Inter Variable` — css-harvest の判定で「AI/汎用フォント支配」と出る。Sendy は `Bricolage Grotesque` + `Zen Kaku Gothic New` のまま。
- Linear の角丸 24px の単一値 — 「角丸カードが単一値24pxに収束(91%)」も AI っぽさのフラグ。Sendy は既存の 12 / 14 / 18px を使い分ける。
- どのサイトの配色も借りない。`--accent-from #3b6dff` → `--accent-to #8b5cf6` の既存の2色だけで組む。

## 採寸の生データ

再起動で消えないよう `/tmp` から移してある。

- `/Users/kimuratakezou/uicos/sendy-lp-shots/harvest/harvest-linear.json`
- `/Users/kimuratakezou/uicos/sendy-lp-shots/harvest/harvest-raycast.json`
- `/Users/kimuratakezou/uicos/sendy-lp-shots/harvest/harvest-superhuman.json`

同じ場所に、直したあとの画面の写真 (PC 1440 が6枚・スマホ 390 が4枚) も置いてある。


## 実装した後の答え合わせ (2026-08-03)

借りた値と、実際に入れた値がずれていないかを目で突き合わせた結果。

| 借りた所 | 実際に入れた値 | ずらした場合の理由 |
|---|---|---|
| Linear の gap 24px | `.cap-grid` `.aud-grid` とも gap 24px | そのまま |
| Linear の card padding `32px 24px` | `.cap-card` は `26px 24px` | 2列 (476px) ではなく3列 (350px) にしたので、上下だけ 6px 詰めた |
| Linear の radius 16px | `var(--radius)` = 18px | **借りない**。Sendy が既に持っている角丸を使う (新しい角丸を作らない掟) |
| Linear の分類名の色 `#8a8f98` | `var(--fg-faint)` = `rgba(255,255,255,0.40)` | **借りない**。Sendy の既存の薄い文字の色を使う |
| Raycast の `147.9px + gap 16px 24px` | `.feat--ai .feat-ai-facts dt` = 148px / gap `16px 40px` | 横の間だけ 40px に広げた。2列に折り返した時、24px だと左の列の説明と右の列の名前がくっついて読めなかった |
