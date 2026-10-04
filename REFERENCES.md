# 現在の参照: Arcの描画を保ったSendy版

参照URL: https://arc.net/ / 取得日: 2026-10-01 / 使用手順: `/ui-replica`。

利用者の「一旦完全同じでどんどん変えていく」に従い、原版と一致する状態を作った後、「Sendyばんちゃんと作って」に基づきSendy版へ差し替えた。`index.html` の原版CSS、描画chunkのレイアウト・アニメーション実装、Exposure・Marlinの書体、220pxの紙粒子、波形SVGの形状を保持している。原版の書体定義を維持し、最新の注釈に従い見出し・説明を日本語にする。日本語字形は原版のfallback書体で描画する。

変更はSendyのロゴ・確認済み機能・実画面と動画・3機種の配布先・青紫の背景。原版の口コミと第三者評価は使わず、機能説明と開発元表記へ置き換えた。画像内に他社のUIを残さない。実画面を原版の枠へ収める指定と、Intel版の同寸法ボタンに必要な折り返しだけ加えた。波形の塗りに同じ横方向gradientを重ね、白文字が読めるよう背景色を調整した。原版の書体を別フォントへ置き換えていない。

保存先: `/Users/kimuratakezou/Documents/Sendy-arc-replica-20261001/`。

- `arc-original/`: 原版のHTML・CSS・描画ランタイム・フォント・画像・動画。比較基準として変更しない。
- `reference/manifest.json`: 元URLから取得した素材と取得結果。
- `reference-supplement/manifest.json`: 初回取得で不足したMarlin Bold/BoldItalicを公式から取得した応答とhash。元の保存物を上書きせず補完配信する。
- `baseline-restoration/report.md`: Sendy差し替え前に36幅の寸法・style差分0、主要8幅とスクロール・メニュー13枚のpixel差分0を確認した証拠。
- `sendy-faithful/manifest.json`: 有効なchunkのStringLiteral置換数、構造置換の一致数、入出力hash、色の役割と波形maskの対応。
- `sendy-faithful/runtime/`: Sendyに差し替えたchunkと、公開済みSendy画面由来の動画・画像。
- `sendy-faithful/verify.py`: 画面幅、原版書体、メニュー、スクロール、動画・サービス列、no-JS/reduced-motion、機種別Release取得の成功・失敗の検証。
- `sendy-faithful/verification.json`: 今回の実行結果。見た目の変更を入れたSendy版を原版とpixel一致したとは扱わない。
- `rejected-sendy-adaptation/`: 却下された独自Sendy化。以前の技術検査は今回の受入証拠にしない。

作業ページ: `http://127.0.0.1:8879/` と `http://127.0.0.1:8879/sendy-download/`。比較原版: `http://127.0.0.1:8878/`。会話プロセスから独立した専用launchdジョブで配信する。`scripts/preview-reference.py` はrepo外の `serve-original.py` を使い、HTMLは作業repo、変更chunkは `sendy-faithful/runtime/`、他の素材と書体は原版と補完保存物から配信する。計測はローカルstub、外部フォームは無効化し、GitHub Release APIのGETだけ外部通信を許可する。

2026-10-04の「本番のダウンロードページ差し替えちゃっていい」に基づき公開用の静的資産を書き出す。必要な描画chunk・書体・紙背景・波形とSendyの公開画面由来の動画だけを同梱する。原版の計測初期化・scriptと登録サービスの設定値を除外し、別ルートのchunkや取得記録・他LPは公開しない。共有ライブラリ内の未使用SVG・内部名称は表示や通信へ引き継がない。配置先は既存のGitHub Pages `/sendy-download/`。Nextの配置先・静的画像・内部リンクとCSS内のURLを合わせ、CSSのclass名は配置先変更で変えない。技術検証の成功と利用者によるデザイン受入は別に扱う。

2026-10-03の追加依頼: 動画の表示を縮小し、日本語の見出し・短いラベルと右下のAI入口を追加した。原版の機能動画はviewport全幅のcanvasに約80.56%幅のアプリ画面を含む。余白のないSendy素材へ同じ余白をCSSで補い、ヒーローは原版の60%幅に合わせる。原版の書体・紙粒子・SVG波形・レイアウトのCSSは維持する。AIメニューはReactのroot外に配置する。

追加のWeb注釈では、3つの装飾アイコン、主CTAの上にあるOS・ベータ説明とStock Valueロゴを削除し、主CTAと製品画面の間に48px（小画面は32px）の余白を追加する。本文・機能見出しは日本語。続く追加注釈により、上部ナビ・ヒーローCTA・追従帯は英語と原版の書体へ戻し、見出しの引用符装飾4個をSSRと描画chunkの両方で削除する。追従帯のガラス化は最新指示で取り消され、元の紙色・上下の波形を保持する。

- `ai-refinement/media-before.json`: 原版と旧Sendyのcanvas・動画・画像・parentの測定値。
- `ai-refinement/matrix-refinement.json`: 調整後の15幅、原版のfont styleとの比較、4動画の表示比率、メニューのviewport内配置。
- `ai-refinement/widget-verification.json`: キーボード、外側クリック、clipboard拒否、provider遷移、reduced-motion、no-JS、解説の表示と26機能の一致。
- `ai-refinement/grok-prefill.json`: 外部POSTを遮断した匿名ブラウザで、渡した文章が送信前の確認画面に表示された証拠。実送信していない。
- `ai-refinement/public-guide.json`: 外部AIへ渡す公開済みllms.txtのHTTP 200とhash。ローカルの未公開ai.htmlを外部AIに読ませるURLとして渡さない。

Claude Desktopのprefillは[公式のdeep link仕様](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link)に基づく。ChatGPT・Claude Webは匿名ブラウザの認証・セキュリティ制限により認証後の入力を確認できていない。説明付きリンクに加えて同じ文章をコピーし、入力されない場合の貼り付け手段を表示する。Grokの外部MCP要件は[公式接続仕様](https://docs.x.ai/grok/connectors)に基づき、SendyのローカルMCPが自動的に外部から使えるとは説明しない。

LINE着信・通話画面・音声処理、MCPのlist_members、AI接続先の選択と/コマンドは現行コードを読み取り確認した。公開リリースv0.2.138の説明は版番号だけのため、配布版の実通話受入を推測せず、解説とllms.txtに実装・未検証の状態を記載する。「史上初」の比較は裏付けがないため掲載しない。


別LPの比較用原版（2026-10-03）: [Beeper](https://www.beeper.com/)、[Craft](https://www.craft.do/)、[Raycast](https://www.raycast.com/)、[Superhuman](https://superhuman.com/)。`ui-replica`でDOM・CSS・JS・画像・書体を取得し、事業用差分を混ぜる前の独立したローカル基準画面を作る。取得物は `/Users/kimuratakezou/Documents/Sendy-lp-references-20261003/`、一覧は `http://127.0.0.1:8885/`。原版資料と計測設定を公開repoへ持ち込まない。URLのローカル化に際してSVG名前空間を保持し、Next FlightのテキストレコードはURL変更後のUTF-8長を更新する。比較結果と制限は同資料の `verification.json` と `report.md` に記録する。

<details>
<summary>旧ページの参照記録 (2026-08-03)</summary>

# 旧ページが下敷きにした実在サイト

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

</details>

2026-10-04の動画サイズ: 1440px幅でヒーロー720→648px、機能動画1160→1044px。公開資産と調整後のローカル版は8幅の配置・書体・配色を比較する。公開前後の表示と操作の証拠は `production-20261004/` に保存し、公開repoには含めない。
