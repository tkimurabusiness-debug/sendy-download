<div align="center">

<img src="assets/icon.png" width="112" alt="Sendy" />

# Sendy

**連絡を1か所に。返信は AI と一緒に片づける。**

Messenger・LINE・Instagram・LinkedIn・Chatwork・メールを1つの受信箱にまとめる macOS アプリです。
読んでも相手に既読は付きません。返信は、あなたの言い回しを学んだ下書きを承認するだけ。

**[▶ 紹介ページを見る](https://tkimurabusiness-debug.github.io/sendy-download/)** ・
**[⬇ ダウンロード (最新版)](https://github.com/tkimurabusiness-debug/sendy-download/releases/latest)**

開発元 [株式会社 Stock Value](https://stockvalue.co.jp/)

</div>

---

## Sendy がすること

| | |
|---|---|
| **1つの受信箱にまとまる** | Messenger・LINE・Instagram・LinkedIn・Chatwork・メールをひとつの画面で読み書きします。アプリを行き来する必要がなくなります |
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

詳しくは[プライバシーポリシー](https://tkimurabusiness-debug.github.io/sendy-download/privacy.html)と[利用規約](https://tkimurabusiness-debug.github.io/sendy-download/terms.html)をご覧ください。

## このリポジトリについて

ここは**配布と紹介ページのための場所**です。
`.dmg` はリリースの添付ファイルとして配っており、**Sendy 本体のソースコードは公開していません。**
このリポジトリに入っているのは紹介ページ (HTML / CSS / 画像) だけです。

## 問い合わせ

- 不具合の報告・要望: [Issues](https://github.com/tkimurabusiness-debug/sendy-download/issues)
- メール: info@stockvalue.co.jp

---

© Stock Value, Inc. — 開発元 [株式会社 Stock Value](https://stockvalue.co.jp/)
