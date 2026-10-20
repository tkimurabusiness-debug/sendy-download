<div align="center">

<img src="https://stockvalue.co.jp/products/sendy/assets/icon.png" width="112" alt="Sendy" />

# Sendy

**連絡を1か所に。返信は AI と一緒に片づける。**

Messenger・LINE・Instagram・LinkedIn・Chatwork・メールを1つの受信箱にまとめる macOS アプリです。
読んでも相手に既読は付きません。返信は、あなたの言い回しを学んだ下書きを承認するだけ。

**[▶ 紹介ページを見る](https://stockvalue.co.jp/products/sendy/)** ・
**[⬇ ダウンロード (最新版)](https://github.com/tkimurabusiness-debug/sendy-download/releases/latest)**

開発元 [株式会社 Stock Value](https://stockvalue.co.jp/)

</div>

---

## Sendy がすること

| | |
|---|---|
| **1つの受信箱にまとまる** | 複数のサービスをひとつの画面で読み書きします。対応先は [確認済み事実](llms.txt) をご覧ください |
| **読んでも既読が付かない** | 開いて読むだけでは相手に既読が伝わりません。返信を送った時にだけ既読が付きます |
| **あなたの言い回しで下書きが出る** | 過去のやり取りから文体を学び、返信の下書きを用意します。選んで直して送るだけです |
| **相手のことを覚えている** | 誰と何を話したかを記憶し、返信の材料として差し出します。毎回さかのぼる必要がありません |
| **送る時間を決められる** | 深夜に書いても、届く時間は指定できます。相手の時間を邪魔しません |

## 対応している連絡先

対応先と動作確認の状況は [AI向けの確認済み事実](llms.txt) にまとめています。

Slack と Discord は Sendy の中で各サービスの元の画面を開きます。

## 動作条件

- macOS 12 以降
- Apple Silicon (M1 以降)

## 入れ方

1. [リリースのページ](https://github.com/tkimurabusiness-debug/sendy-download/releases/latest)から `.dmg` を落とす
2. `.dmg` を開き、Sendy を「アプリケーション」へドラッグする
3. **初回だけ、Sendy を右クリックして「開く」を選ぶ** → 出てきた確認で「開く」

> Sendy は Apple の署名と公証を通した配布物です。初回の確認が出た場合は内容を確認して「開く」を選んでください。

## よくあるつまずき

<details>
<summary><b>Messenger の過去のやり取りが出てこない</b></summary>

Messenger の暗号化されたチャットは、**会話ごとに1回だけ**取り込みの操作が要ります。

1. 画面上部の**相手の名前**を押してチャット設定を開く
2. **「過去の履歴を復元」**を押す

途中で Messenger の暗証番号 (PIN) を求められたら入力してください。
取り込みは**あなたの Mac の中だけ**で行われます。何度でも実行でき、押すたびに最新の内容で取り直します。

</details>

<details>
<summary><b>「開発元を確認できないため開けません」と出る</b></summary>

上の「入れ方」の 3 のとおり、**右クリック → 開く**で入れてください。
ターミナルでの操作は必要ありません。

</details>

<details>
<summary><b>アップデートはどうなる</b></summary>

Sendy は起動中に新しい版を見つけると自動で取りに行き、**閉じた時に入れ替わります**。
手動で入れ直す必要はありません。

</details>

## データの扱い

- メッセージの本文とログイン情報は、**あなたの Mac の中にだけ**保存されます
- 各サービスへのログインは、Sendy の中のブラウザでサービスの公式画面に直接行います。Sendy がパスワードを預かることはありません
- 外部へ送るのは、下書きを作るために必要な範囲の文章だけです

詳しくは[プライバシーポリシー](https://stockvalue.co.jp/products/sendy/privacy.html)と[利用規約](https://stockvalue.co.jp/products/sendy/terms.html)をご覧ください。

## このリポジトリについて

トップページは [Arc](https://arc.net/) を `/ui-replica` で取得し、原版と一致する状態を作ってからSendyの内容を差し替えています。Exposure・Marlinの書体、紙の粒子、SVG波形、余白、構成、メニュー・追従CTA・動画・サービス列の描画コードを保ち、ロゴ・文章・実画面・配布先と青紫の背景をSendyに合わせています。以前の独自Sendy化は利用者からデザイン不一致として却下され、repo外に退避しました。出所と比較証拠は [REFERENCES.md](REFERENCES.md) を参照してください。
確認URLは `http://127.0.0.1:8879/` または `http://127.0.0.1:8879/sendy-download/`（原版のルートURLへリダイレクト）。保存した原版の比較用URLは `http://127.0.0.1:8878/` です。会話の実行プロセスから独立した `launchctl` のジョブで起動し、会話終了や追加メッセージで停止しないようにしています。ジョブ名は `com.stockvalue.sendy-arc-working-20261002` と `com.stockvalue.sendy-arc-reference-20261002`。起動・停止はこの2ジョブだけを対象にし、他のサーバーは変更しません。

手動でサーバーを起動する場合はrepoのルートで以下を実行します。使用中の8879と競合しないよう、この例は8880を使います。

```bash
python3 scripts/preview-reference.py --fonts-dir /Users/kimuratakezou/Documents/Sendy-arc-replica-20261001/arc-original/fonts --port 8880 --base-path sendy-download
```

原版のCSS・Next.js描画ランタイム・画像・動画・フォントはrepo外の保存物から配信し、Sendy向けに差し替えたchunkと動画を優先します。計測はローカルの空スクリプト、フォーム送信はCSPで制限します。GitHub Release APIのGETを使い、機種別リンクを更新します。ローカル比較用のHTMLは保存物を配信する専用サーバーを使います。本番用には `scripts/export-production.py` で描画に必要な資産を同梱し、`/sendy-download/` の配置に合わせてURLを書き出します。npm依存の追加はありません。アプリの配布物は変更しません。

差し替えを再生成するコマンドと既存検査は以下です。原版保存物に加えて、この環境のBeautifulSoup・tinycss2・ffmpeg・Prismに導入済みのBabel parserを使います。

```bash
python3 scripts/adapt-reference.py --reference /Users/kimuratakezou/Documents/Sendy-arc-replica-20261001/arc-original
node scripts/check-page.mjs
```

実画面と操作の検証コード・結果はrepo外の `/Users/kimuratakezou/Documents/Sendy-arc-replica-20261001/sendy-faithful/` に保存します。
ここは**配布と紹介ページのための場所**です。
`.dmg` はリリースの添付ファイルとして配っており、**Sendy 本体のソースコードは公開していません。**
このリポジトリに入っているのは紹介ページ (HTML / CSS / 画像) だけです。

2026-10-03の追加依頼では、動画内のアプリ画面をArcの余白に合わせて縮小しました。ヒーローは原版の60%幅、機能動画は素材に埋め込まれた余白を補い約80.56%幅です。最新の注釈に従い、見出し・ラベル・説明を日本語に統一しました。

右下の丸い「AIに聞く」ボタンでChatGPT・Claude・Grokを選び、Sendyの説明付きリンクを開きます。同じ説明をclipboardへコピーし、入力欄が空の場合に貼り付けられます。拒否された場合は選択可能な文章を表示します。Claude Desktop用の公式prefillリンクもあります。Grokは匿名ブラウザで送信前の確認画面まで確認し、送信はしていません。ChatGPT・Claude Webの認証後の実入力は未検証です。

全機能と使い道は [ai.html](ai.html)、機械可読の説明は [llms.txt](llms.txt) にまとめています。ローカル確認時に外部AIへ渡すURLは公開済みのllms.txtで、未公開のローカルURLを読み取り先として要求しません。説明文にも機能の要点と未検証範囲を含めます。新しい解説ページは `http://127.0.0.1:8879/ai.html` です。LINE着信は実装確認済み・配布版の実通話は未検証とし、「史上初」は掲載しません。MCPによる会話読み取りには別途接続が必要で、AIが作った返信案は人が承認して送信します。

今回の表示・メニュー・遷移・コピーの証拠はrepo外の `Sendy-arc-replica-20261001/ai-refinement/` に保存します。追加のCSS/JSとwidgetは `scripts/adapt-reference.py` でトップと解説ページに同時に組み込み、hash付きURLで配信します。

## 問い合わせ

- 不具合の報告・要望: [Issues](https://github.com/tkimurabusiness-debug/sendy-download/issues)
- メール: info@stockvalue.co.jp

---

© Stock Value, Inc. — 開発元 [株式会社 Stock Value](https://stockvalue.co.jp/)

2026-10-03の追加注釈に合わせ、上部ナビ・ヒーローCTA・追従帯は英語と原版の書体へ戻し、見出しの引用符装飾を削除しました。追従帯は最新の「元に戻して」に従いガラス化を取り消し、元の紙色・上下の波形を保っています。別のLPの原版比較は `http://127.0.0.1:8885/`、取得資料とサーバーは `/Users/kimuratakezou/Documents/Sendy-lp-references-20261003/`。Sendyの本文へ各参考サイトの内容を混ぜていません。

2026-10-04の公開対象は現在のSendy版です。動画を従来の幅から約10%縮小し、ヒーローは54%、機能動画は72.5%幅にしました。紙粒子・書体・波形・英語ナビと日本語本文は保持しています。公開用のHTML・CSS・描画runtime・必要な書体・背景・Sendy動画は通常の静的HTTP配信で動作します。原版の計測初期化・scriptと登録サービスの設定値を除外し、他LPの資料やSendy本体の非公開コードは含めません。GitHub Pagesは `main` のルートを配信します。公開用checkoutで `node scripts/check-page.mjs` とブラウザの表示・操作を検証します。
