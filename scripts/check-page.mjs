#!/usr/bin/env node
/* ページの門。**人が見落とす3つ**を機械で止める。
 *
 *   ① 見出し・ボタンの文言に「、」「。」が入っていないこと
 *      竹蔵に何度も同じ指摘をさせている掟。目視では必ず漏れる。
 *      本文 (段落) は対象外 (句読点を使ってよい)。
 *   ② 絵文字が1つも無いこと (竹蔵「絶対やだ」)
 *   ③ AI 向けの節と llms.txt がずれていないこと
 *      ずれると AI が古いほうを読んで、できない機能を「できます」と言う。
 *
 * 使い方: node scripts/check-page.mjs
 * 依存パッケージは足さない (素の node だけで動く)。
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const llms = readFileSync(join(ROOT, 'llms.txt'), 'utf8');

let ng = 0;
const fail = (msg) => { ng++; console.log('NG  ' + msg); };
const ok = (msg) => console.log('OK  ' + msg);

/** タグの中身を素の文字にする (入れ子のタグと HTML の実体参照を落とす)。 */
const strip = (s) => s
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/\s+/g, ' ')
  .trim();

/** HTML のコメントを外す。注記の中の日本語まで見てしまうと、門が意味を失う。 */
const body = html.replace(/<!--[\s\S]*?-->/g, '');

/* ── ① 見出しとボタンの句読点 ───────────────────────────── */
const HEADING_RE =
  /<(h1|h2|h3|h4|h5|h6|summary|button)\b[^>]*>([\s\S]*?)<\/\1>/g;
// 押せる札 (.aud-link / .cap-kicker) も見出しと同じ扱いにする。
const EXTRA_RE =
  /<(a|p)\b[^>]*class="[^"]*\b(aud-link|cap-kicker|prov-name|feat-label)\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g;

const headings = [];
for (const m of body.matchAll(HEADING_RE)) headings.push([m[1], strip(m[2])]);
for (const m of body.matchAll(EXTRA_RE)) headings.push([m[2], strip(m[3])]);

const punct = headings.filter(([, t]) => /[、。]/.test(t));
if (punct.length) {
  punct.forEach(([tag, t]) => fail(`見出しに句読点: <${tag}> "${t}"`));
} else {
  ok(`見出し・ボタンの句読点なし (${headings.length} 件を検査)`);
}

/* ── ② 絵文字 ─────────────────────────────────────────
 * 記号と絵柄 / 補助記号 / 交通と地図 / 顔文字 / 旗 / 装飾記号 を見る。
 * ✓ ✕ → などの文字記号 (U+2190〜U+21FF, U+2713) は絵文字ではないので通す。 */
const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F2FF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
for (const file of ['index.html', 'llms.txt']) {
  const text = file === 'index.html'
    ? strip(body)
    : llms;
  const hit = [...text.matchAll(EMOJI_RE)].map((m) => m[0]);
  if (hit.length) fail(`${file} に絵文字: ${[...new Set(hit)].join(' ')}`);
  else ok(`${file} に絵文字なし`);
}

/* ── ③ AI 向けの節と llms.txt がそろっていること ───────────────
 * ページ側は <dt> の言葉、llms.txt 側は "- 言葉:" の行。両方を集めて突き合わせる。 */
const aiStart = body.indexOf('id="for-ai"');
if (aiStart < 0) fail('AI 向けの節 (id="for-ai") が無い');
// **節の終わりで必ず切る。** 切らないと下にある会社概要の <dt> まで拾ってしまう。
const aiSection = body.slice(aiStart, body.indexOf('</section>', aiStart));
// **名前だけでなく中身も突き合わせる。** 名前がそろっていても説明がずれていたら、
// AI は古いほうの説明を読む (対向レビューの指摘 2026-08-03)。
const pageFacts = new Map();
for (const m of aiSection.matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) {
  pageFacts.set(strip(m[1]), strip(m[2]));
}

// llms.txt 側も同じ範囲だけを見る。「## リンク」は住所の一覧で、事実の一覧ではない。
const llmsFacts = llms.slice(0, llms.indexOf('## リンク') >= 0 ? llms.indexOf('## リンク') : llms.length);
const llmsMap = new Map();
for (const m of llmsFacts.matchAll(/^- ([^:\n]+): (.+)$/gm)) {
  llmsMap.set(m[1].trim(), m[2].trim());
}

const dts = [...pageFacts.keys()];
const llmsKeys = [...llmsMap.keys()];
const missingInLlms = dts.filter((d) => !llmsMap.has(d));
const missingInPage = llmsKeys.filter((k) => !pageFacts.has(k));
const valueMismatch = dts
  .filter((d) => llmsMap.has(d) && llmsMap.get(d) !== pageFacts.get(d))
  .map((d) => `${d}\n      ページ : ${pageFacts.get(d)}\n      llms.txt: ${llmsMap.get(d)}`);

if (dts.length === 0) fail('AI 向けの節に <dt> と <dd> の対が1件も無い');
if (missingInLlms.length) missingInLlms.forEach((d) => fail(`llms.txt に無い項目: ${d}`));
if (missingInPage.length) missingInPage.forEach((k) => fail(`ページに無い項目: ${k}`));
if (valueMismatch.length) valueMismatch.forEach((v) => fail(`説明がずれている項目: ${v}`));
if (!missingInLlms.length && !missingInPage.length && !valueMismatch.length && dts.length) {
  ok(`AI 向けの節と llms.txt が一致 (${dts.length} 項目・名前と説明の両方)`);
}

/* ── ④ AI 向けの節を隠していないこと ───────────────────────
 * 機械にだけ見せると、検索エンジンから「人と機械に違う物を見せている」と
 * 判定される危険がある。隠す指定が入り込んでいないか見る。 */
const hideRe = /(display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0|aria-hidden="true")/;
const forAiBlock = aiSection.slice(0, aiSection.indexOf('</section>'));
if (hideRe.test(forAiBlock)) fail('AI 向けの節に隠す指定がある');
else ok('AI 向けの節を隠していない');

/* ── ⑤ ダウンロードがGitHubのリリース画面を開かないこと ───── */
const ARM_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-arm64.dmg';
const INTEL_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-intel.dmg';
const downloadJs = readFileSync(join(ROOT, 'js', 'download.js'), 'utf8');
const mainDownload = body.match(/<a\b[^>]*\bid="download-btn"[^>]*\bhref="([^"]+)"/);
const footerDownload = body.match(/<a\b[^>]*\bclass="[^"]*\bfooter-dl-btn\b[^"]*"[^>]*\bhref="([^"]+)"/);
const initialDownloads = [mainDownload?.[1], footerDownload?.[1]].filter(Boolean);

if (initialDownloads.length !== 2) {
  fail('主ボタンとフッターボタンの初期リンクを2件読めない');
} else if (initialDownloads.some((href) => href !== ARM_DMG)) {
  fail('初期ダウンロードリンクがApple Silicon用DMGの直リンクではない');
} else {
  ok('主ボタンとフッターボタンは最初からDMGの直リンク');
}

if (!downloadJs.includes(ARM_DMG) || !downloadJs.includes(INTEL_DMG)) {
  fail('JavaScriptにCPU別の固定名DMGリンクがそろっていない');
} else {
  ok('JavaScriptにApple Silicon用とIntel用の固定名DMGリンクがある');
}

const releasePageUrls = `${body}\n${downloadJs}`.match(
  /https:\/\/github\.com\/tkimurabusiness-debug\/sendy-download\/releases\/latest(?!\/download\/)/g,
) ?? [];
if (releasePageUrls.length) {
  fail(`GitHubのリリース画面を開くURLが残っている (${releasePageUrls.length} 件)`);
} else {
  ok('GitHubのリリース画面を開く予備リンクがない');
}

console.log('');
if (ng) { console.log(`失敗 ${ng} 件`); process.exit(1); }
console.log('すべて通りました');
