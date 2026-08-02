/* 声の受け口 (竹蔵 2026-08-01)。
 *
 *   「LP に実装済み機能、これから追加予定の機能 (ウェイトリスト的なボタンあると面白そう)
 *     希望機能とかバグ窓口とか設定したいかも」
 *
 * 送り先は Sendy 自身の受け口。**他社のフォームを使わない** —
 * 「会話はあなたの Mac から出ません 預かりもしません」と言っている以上、
 * 名前とメールを他社に預けると、その一文が信用されなくなる。
 *
 * 2026-08-03 に変えたこと:
 *   機能の一覧を**この JavaScript で組み立てるのをやめ、index.html に直に書いた。**
 *   理由は2つ。
 *   ① 竹蔵「AIが見る用のところと人間が読む用のところは別にして欲しい」。
 *      AI に読ませる事実の一覧は、JavaScript を動かさない取り込み機からも見えないと
 *      意味がない。前の作りだと、そういう相手には**1件も見えていなかった**。
 *   ② 人が読む言葉 (困りごとが消える言い方) と 機械が読む言葉 (短い事実) は
 *      書き分けるべきもので、同じ配列から両方を出すと必ずどちらかが不自然になる。
 *   ここに残すのは「押せるようにする」「送る」だけ。文言は持たない。
 *   一覧と llms.txt がずれていないことは node scripts/check-page.mjs が確かめる。
 */
(function () {
  'use strict';
  var EP = 'https://sendy-telemetry.t-kimura-business.workers.dev/v1/feedback';

  /* 「これから足すもの」の札を押せるようにする。**中身は index.html 側にある。**
     ここでは押した時の見た目と、選ばれたことの記録だけを足す。 */
  (function makePickable() {
    var items = document.querySelectorAll('#featNext .feat-item--pick');
    Array.prototype.forEach.call(items, function (el) {
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-pressed', 'false');
      var toggle = function () {
        var on = el.getAttribute('aria-pressed') === 'true';
        el.setAttribute('aria-pressed', on ? 'false' : 'true');
        el.classList.toggle('is-on', !on);
      };
      el.addEventListener('click', toggle);
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  })();

  /** クリップボードへ入れる。
   *  navigator.clipboard は安全な接続 (https / 127.0.0.1) でしか使えないので、
   *  使えない時のために古いやり方 (選択して copy) を残す。 */
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      /* 画面の外に置く。押した時に画面が飛ばないよう position:fixed にする。 */
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) resolve(); else reject(new Error('copy failed'));
    });
  }

  var aiBtn = document.getElementById('aiCopyBtn');
  var aiPrompt = document.getElementById('aiPrompt');
  var aiNote = document.getElementById('aiCopyNote');
  var aiTimer = null;
  if (aiBtn && aiPrompt && aiNote) aiBtn.addEventListener('click', function () {
    /* **画面に出ている文をそのまま**入れる。JS 側にもう1本文を持つと、
       見えている物と入る物が食い違う。 */
    var text = aiPrompt.textContent.trim();
    copyText(text).then(function () {
      aiNote.textContent = 'コピーしました';
      if (aiTimer) clearTimeout(aiTimer);
      aiTimer = setTimeout(function () { aiNote.textContent = ''; }, 2000);
    }).catch(function () {
      aiNote.textContent = 'コピーできませんでした 上の文を選んでコピーしてください';
    });
  });

  /** 選ばれている「待っているもの」を集める。 */
  function picked() {
    var on = document.querySelectorAll('#featNext .feat-item[aria-pressed="true"] b');
    return Array.prototype.map.call(on, function (b) { return b.textContent; }).join(' / ');
  }

  /** 送る。**失敗しても画面は壊さない。** 受け口は弾いた時も 200 を返す (何が通るか探らせない)。 */
  function send(payload, noteEl, okText) {
    noteEl.textContent = '送っています…';
    fetch(EP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) {
      noteEl.textContent = r.ok ? okText : '送れませんでした 少し待ってからもう一度お試しください';
    }).catch(function () {
      noteEl.textContent = '送れませんでした 通信をご確認ください';
    });
  }

  var wait = document.getElementById('waitForm');
  if (wait) wait.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('waitEmail').value.trim();
    var note = document.getElementById('waitNote');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note.textContent = 'メールアドレスの形をご確認ください'; return;
    }
    send({ kind: 'waitlist', email: email, wants: picked(), hp: document.getElementById('waitHp').value },
      note, 'ありがとうございます できたらお知らせします');
    wait.reset();
  });

  function wireText(formId, textId, emailId, hpId, noteId, kind, okText) {
    var f = document.getElementById(formId);
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = document.getElementById(textId).value.trim();
      var note = document.getElementById(noteId);
      if (!t) { note.textContent = '内容を書いてください'; return; }
      send({ kind: kind, text: t, email: document.getElementById(emailId).value.trim(),
             hp: document.getElementById(hpId).value }, note, okText);
      f.reset();
    });
  }
  wireText('wishForm', 'wishText', 'wishEmail', 'wishHp', 'wishNote', 'feature',
    'ありがとうございます 参考にします');
  wireText('bugForm', 'bugText', 'bugEmail', 'bugHp', 'bugNote', 'bug',
    'ありがとうございます 確認します');
})();
