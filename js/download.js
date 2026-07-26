/* ダウンロードボタンの行き先を、GitHub の「最新のリリース」から毎回引き直す。
   固定で書いていると版が上がるたびに 404 になる (2026-07-25 に実際に起きた)。
   同じ id のボタンがページに2つあるので querySelectorAll で全部に入れる
   (getElementById は1つしか返さず、2つ目が死んだままになる)。 */
(function () {
  'use strict';
  var API = 'https://api.github.com/repos/tkimurabusiness-debug/sendy-download/releases/latest';
  var FALLBACK = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest';

  function setAll(href, size, ver) {
    var btns = document.querySelectorAll('#download-btn, .footer-dl-btn');
    Array.prototype.forEach.call(btns, function (b) { b.setAttribute('href', href); });
    if (size) {
      var s = document.getElementById('dl-size');
      if (s) s.textContent = '約 ' + size + ' MB';
    }
    if (ver) {
      var v = document.getElementById('dl-ver');
      if (v) v.textContent = ver;
    }
  }

  setAll(FALLBACK);   // 取得に失敗しても、リリース一覧までは必ず飛べるようにしておく

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      var dmg = rel.assets.filter(function (a) { return /\.dmg$/.test(a.name); })[0];
      if (!dmg) return;
      setAll(dmg.browser_download_url, Math.round(dmg.size / 1048576), rel.tag_name);
    })
    .catch(function () { /* 取得できなければ FALLBACK のまま */ });
})();
