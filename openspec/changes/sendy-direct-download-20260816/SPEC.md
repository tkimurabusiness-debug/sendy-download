# SPEC: sendy-direct-download-20260816 DMG直ダウンロード

- 対象リポジトリ: `/Users/kimuratakezou/uicos/sendy-download-page`
- 関連リポジトリ: `/Users/kimuratakezou/uicos/app-messenger`
- 起票日: 2026-08-16
- 状態: 実装前
- 作業種別: `[DEBUG]` 配布ボタンがGitHubのリリース画面を開く

## 1 目的

Sendyのダウンロードボタンを押した利用者が、GitHubのリリース画面ではなくDMGを受け取る応答へ直接進める。
JavaScriptの実行前、JavaScriptが失敗した時、GitHubの公開情報取得が遅い時も同じ条件を保つ。

## 2 原因

1. `/Users/kimuratakezou/uicos/sendy-download-page/index.html` の主ボタンとフッターボタンは、初期状態で `https://github.com/tkimurabusiness-debug/sendy-download/releases/latest` を指している。
2. `/Users/kimuratakezou/uicos/sendy-download-page/js/download.js` は、GitHubの公開情報を取得できた後だけDMGの添付先へリンクを入れ替える。
3. そのため、読み込み直後、JavaScript無効、取得失敗、取得待ちの間に押すと、GitHubのリリース画面を開く。
4. ブラウザの種類は原因ではない。GPT Atlasを含む任意のブラウザで同じ初期リンクを押すと同じ画面へ進む。
5. HTMLの `download` 属性は別のドメインにあるGitHub添付の保存を保証しない。DMGを返すHTTP応答へリンクする必要がある。

## 3 受入条件

| ID | 要件 | 受入条件 |
|---|---|---|
| R1 | 主ボタンはDMGへ直接進む | ページの主ボタンを読み込み直後に押しても、`/releases/latest` のHTML画面へ進まない。最終的に `Content-Disposition: attachment` を持つDMGの応答へ進む。 |
| R2 | フッターボタンもDMGへ直接進む | フッターのダウンロード操作にも、リリース画面を開く予備経路がない。 |
| R3 | JavaScriptが動かなくてもDMGへ進む | `index.html` に最初から入っているすべてのダウンロードリンクが、固定名のDMG添付先を指す。GitHub公開情報の取得を待たない。 |
| R4 | CPUの種類ごとに正しいDMGを出す | Apple Silicon版は `Sendy-arm64.dmg`、Intel版は `Sendy-intel.dmg` を使う。JavaScriptによる判定は既存どおり使ってよいが、判定失敗時もDMG添付先を使う。 |
| R5 | 固定名のDMGを毎回公開する | `app-messenger/scripts/release-publish.sh` が版番号付きDMGに加え、`Sendy-arm64.dmg` と `Sendy-intel.dmg` を同じGitHubリリースへ公開する。次の版でもリンクを変えずに最新のDMGを受け取れる。 |
| R6 | 表示を変えない | 配布ページの色、文字、ボタン位置、CSSの土台を変えない。リンク先の変更と、必要なCPU判定だけを触る。 |
| R7 | 配布物を実際に確認する | 公開前に、固定名DMGの署名、公証、HTTP応答、仮想Macでのダウンロードを確認する。GitHubの画面を開かないことだけで完了としない。 |
| R8 | 外部公開前の門を守る | GitHubリリースの公開とGitHub Pagesの公開は、試験と対向レビューが終わった後だけ行う。公開済みの版を壊す操作はしない。 |

## 4 採用するURL

Apple Silicon版:

```text
https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-arm64.dmg
```

Intel版:

```text
https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-intel.dmg
```

GitHubの `releases/latest/download/<固定名>` は、最新公開版の添付ファイルへ進むURLである。`releases/latest` のHTML画面とは別である。

## 5 実装計画

| リポジトリ | ファイル | 変更内容 |
|---|---|---|
| `sendy-download-page` | `index.html` | 主ボタンとフッターボタンの初期リンクを、固定名DMGの直リンクへ変える。リリース画面のURLをダウンロード用の予備リンクとして残さない。 |
| `sendy-download-page` | `js/download.js` | `FALLBACK` と初期設定を固定名DMGの直リンクに変える。OSとCPUの判定後も、版番号付きの添付先ではなく固定名DMGを選ぶ。公開情報取得の失敗・遅延・未実行でリリース画面へ戻る経路を消す。 |
| `sendy-download-page` | `scripts/check-page.mjs` | 主ボタン、フッターボタン、JavaScriptの予備リンクがすべて `/releases/latest/download/Sendy-*.dmg` を使い、裸の `/releases/latest` を使わないことを機械で確認する。 |
| `app-messenger` | `scripts/release-publish.sh` | 版番号付きのApple Silicon DMGとIntel DMGから固定名のコピーを作り、同じリリースに `Sendy-arm64.dmg` と `Sendy-intel.dmg` を添付する。元の版番号付き資産、更新用zip、Windows資産は消さない。 |
| `app-messenger` | `scripts/check-shipped.mjs` | 最新リリースに固定名DMGの2本があり、配布ページのリンク先がその2本の添付URLであることを確認する。 |

## 6 フォーク調査結果

| 調べたもの | 採用 | 理由 |
|---|---|---|
| GitHub公式の `releases/latest/download/<asset>` 形式 | 採用 | 版番号をページに焼き込まず、添付ファイルの応答へ直接進める。次版でページのリンクを直さなくてよい。 |
| 現在のGitHub公開情報取得 | 条件付きで維持 | CPU判定の補助には使える。ただし、リンクの安全な初期値や失敗時の行き先を決める役割から外す。 |
| Cloudflare PagesへDMGを複製する構成 | 非採用 | 大きい配布物の保存先を二重にして、版の食い違いと公開手順を増やす。GitHubの添付を正本のまま使う。 |
| `download` 属性だけで保存を強制する案 | 非採用 | 別のドメインの添付ではブラウザによる。DMG添付のHTTP応答へ進むことを検証する方が確実である。 |
| GitHubのリリース画面を予備経路として残す案 | 非採用 | 今回の不具合そのものである。取得失敗時にも利用者がDMGを受け取れる状態を作る。 |

## 7 状態別の動き

| 状態 | 期待する動き |
|---|---|
| HTMLを読んだ直後 | 主ボタンとフッターボタンはDMG添付のURLを持つ。 |
| JavaScriptが実行できない | DMG添付のURLを押せる。GitHubのリリース画面を開かない。 |
| 公開情報の取得が遅い | DMG添付のURLを押せる。取得完了を待たない。 |
| 公開情報の取得に失敗 | DMG添付のURLを保つ。GitHubのリリース画面へ戻さない。 |
| Apple Silicon | `Sendy-arm64.dmg` を選ぶ。 |
| Intel Mac | `Sendy-intel.dmg` を選ぶ。 |
| CPUを判定できない | Apple Silicon用のDMG添付先を保ち、GitHubのリリース画面へは進ませない。 |

## カテゴリ標準機能

このカテゴリは、Mac向けデスクトップアプリの配布ページである。

| 既存製品 | 当然ある動き | 今回 |
|---|---|---|
| GitHub Desktop | Mac向けの配布ファイルを直接受け取れる | 実装 |
| Raycast | 利用中のMacに合う版を選んで受け取れる | 実装 |
| Notion | ダウンロード操作からインストール用ファイルへ進める | 実装 |
| Linear | 公開情報の取得が失敗しても、配布ページの主操作が別画面へ化けない | 実装 |
| 上記4製品 | CPUが違う場合に別の配布ファイルを選べる | 実装 |

今回の要求は、GitHubのリリース画面を経由しないことまで固定する。配布ページの見た目を作り直すことは対象外である。

## 8 対象外

- DMGをCloudflare Pagesや別の保存先へ複製すること
- Windows版の配布経路変更
- GitHubのアカウント、権限、認証情報の変更
- 配布ページの新しい装飾、色、カード、CSS土台
- ダウンロード数の計測方法の変更

## 9 検証

1. `/Users/kimuratakezou/uicos/sendy-download-page` で `node scripts/check-page.mjs` が終了コード0で終わる。
2. `/Users/kimuratakezou/uicos/app-messenger` で `node scripts/check-shipped.mjs` が終了コード0で終わる。
3. 配布ページのHTMLとJavaScriptから、裸の `https://github.com/tkimurabusiness-debug/sendy-download/releases/latest` がダウンロード先として0件であることを機械で確認する。
4. GitHubの最新リリースに `Sendy-arm64.dmg` と `Sendy-intel.dmg` が各1本あり、ファイル名、サイズ、版番号付き元ファイルとの対応を確認する。
5. 固定名のURLへ `curl -I -L` を行い、最終応答がGitHubのリリースHTMLではなく、DMG添付の `Content-Disposition` を返すことを確認する。
6. 組み立てたDMGを `spctl` と `stapler` で確認し、Developer ID署名と公証が通ることを確認する。
7. 仮想Macで配布ページを開き、主ボタンとフッターボタンから実際にDMGを受け取る。ブラウザのconsole errorが0件であることを確認する。
8. 1440px幅と390px幅で配布ページを確認し、リンク変更による横はみ出し、文字崩れ、console errorが0件であることを確認する。
9. 公開前に変更全体を `~/.claude/bin/xreview` へ渡し、致命的な指摘を残さない。

## 10 戻し方

- 配布ページはリンク先だけを変える。見た目、本文、既存の版番号付き資産を変えない。
- 固定名DMGに問題が見つかった時は、固定名の添付を正しい署名済みDMGで同じリリースへ差し替える。版番号付き資産は検証済みのまま残す。
- ページに問題がある時は、ページのリンク変更だけを戻せる。会話データ、認証情報、接続先の処理には影響しない。

## MECE宣言

### 枠の宣言

分解軸は、利用者が押す前後の経路と、配布物を公開して保守する経路である。

### 網羅表

| 枠 | 定義 | 今回の扱い |
|---|---|---|
| 異常系 | JavaScript無効、公開情報取得失敗、CPU判定失敗、添付不在 | R3とR4で固定名のDMG添付URLを残す。リリース画面へ戻さない。 |
| 非機能 | 応答先、署名、公証、画面崩れ | R1とR7のHTTP応答・署名・公証・実ブラウザ確認で測る。 |
| ロールバック | 固定名DMGまたはページの不具合 | 10節の戻し方で、固定名添付の差し替えまたはページ変更だけを戻す。 |
| データ移行 | 既存利用者の保存内容と更新用資産 | 対象外。DMGのリンクを変えるだけで、端末内データと既存の版番号付き資産は変えない。 |
| UI4状態 | 読込前、取得中、取得失敗、CPU判定済み | 7節の状態表で、どの状態でもDMG添付URLを保つ。新しい画面状態は足さない。 |
| 並行性 | 同じ固定名DMGを複数の公開処理が上書きする事故 | R5の公開処理は、1つの版の資産確認を終えてから固定名を添付する。並列公開を行わない。 |
| 権限 | GitHubリリース資産の追加とGitHub Pagesの公開 | R8で、検証と対向レビューが終わるまで外部公開をしない。 |
| 観測性 | 直リンクがHTML画面へ化ける事故 | `check-page.mjs`、`check-shipped.mjs`、HTTP応答、仮想Macの受取で確認する。 |
| TZ・i18n | 時刻や言語による配布先の変化 | 対象外。固定名URLは時刻・表示言語に依存しない。CPU判定だけを使う。 |
| スコープ外 | Windows、保存先の増設、見た目の再設計 | 8節に明記する。 |
| 運用CS | 利用者がDMGを受け取れない時の切り分け | 失敗時も固定名DMGを残し、既存の不具合報告窓口へ渡せる。新しい問い合わせ先は作らない。 |

### 全射トレース

| 要件 | 網羅表の行 | 実装先または検証 |
|---|---|---|
| R1 R2 | 異常系 非機能 観測性 | `index.html` と `js/download.js` とHTTP応答確認 |
| R3 R4 | 異常系 UI4状態 | `index.html` と `js/download.js` と`check-page.mjs` |
| R5 | 並行性 権限 観測性 | `release-publish.sh` と`check-shipped.mjs` |
| R6 | スコープ外 | `index.html` のリンクだけを変更 |
| R7 | 非機能 観測性 | `spctl` `stapler` 仮想Macの受取 |
| R8 | 権限 ロールバック | 公開前の対向レビューと10節 |

埋まらない枠はない。

## 11 MECE確認

- 漏れの点検: 上の11枠で、リンク、CPU別資産、公開物、HTTP応答、署名、公証、実ブラウザ、戻し方を確認した。
- 重複の点検: HTML初期値とJavaScriptの予備値は別の失敗時に効くため、重複ではない。
- 別の分け方: ファイル別に分けると、公開した固定名DMGが無いままページだけ直す事故を見落とす。利用者が押す順番で分ける。
