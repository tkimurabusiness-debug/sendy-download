/* 機能の一覧と、声の受け口 (竹蔵 2026-08-01)。
 *
 *   「LP に実装済み機能、これから追加予定の機能 (ウェイトリスト的なボタンあると面白そう)
 *     希望機能とかバグ窓口とか設定したいかも」
 *
 * 送り先は Sendy 自身の受け口。**他社のフォームを使わない** —
 * 「会話はあなたの Mac から出ません 預かりもしません」と言っている以上、
 * 名前とメールを他社に預けると、その一文が信用されなくなる。
 *
 * **できていない物を「できます」と書かない。** 下の一覧は実物に合わせて手で保つ。
 */
(function () {
  'use strict';
  var EP = 'https://sendy-telemetry.t-kimura-business.workers.dev/v1/feedback';

  /* 今できること。**実際に動く物だけ**を書く。 */
  var DONE = [
    ['メール', 'Gmail も Outlook も 何個でも'],
    ['LINE', '仕事も個人も 1つの受信箱で'],
    ['Messenger', 'Facebook のやり取り'],
    ['Instagram', 'DM をまとめて'],
    ['LinkedIn', '海外とのやり取り'],
    ['Slack / Discord', 'そのままの画面で'],
    ['予約して送る', '深夜に書いて 朝に届ける'],
    ['AI の下書き', '返す文を考えてもらう'],
    ['過去の履歴を復元', '暗号化された会話も取り込める'],
    ['フォルダ', '仕事と友達を分ける'],
    ['通知をまとめる', '切りたいものだけ切れる'],
    ['AI から使える窓口', 'Claude などから会話を読める'],
  ];

  /* これから足すもの。**「いつ」は書かない** — 守れない約束をしない。 */
  var NEXT = [
    ['翻訳', '相手の言葉で読んで 日本語で返す'],
    ['カカオトーク', '韓国の連絡先とつながる'],
    ['Zalo', 'ベトナムの連絡先とつながる'],
    ['iMessage / SMS', 'iPhone のやり取りも'],
    ['Chatwork', '仕事の連絡をまとめる'],
    ['X の DM', 'X のやり取りも'],
    ['スマホ版', '外でも同じ受信箱'],
    ['同じサービスで複数アカウント', '仕事用と個人用を並べて'],
  ];

  function li(pair, pickable) {
    var el = document.createElement('li');
    el.className = 'feat-item' + (pickable ? ' feat-item--pick' : '');
    var h = document.createElement('b'); h.textContent = pair[0];
    var p = document.createElement('span'); p.textContent = pair[1];
    el.appendChild(h); el.appendChild(p);
    if (pickable) {
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
    }
    return el;
  }

  function fill(id, rows, pickable) {
    var ul = document.getElementById(id);
    if (!ul) return;
    rows.forEach(function (r) { ul.appendChild(li(r, pickable)); });
  }
  fill('featDone', DONE, false);
  fill('featNext', NEXT, true);

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
