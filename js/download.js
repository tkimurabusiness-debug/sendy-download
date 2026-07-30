/* ダウンロードボタンの行き先を、GitHub の「最新のリリース」から毎回引き直す。
   固定で書いていると版が上がるたびに 404 になる (2026-07-25 に実際に起きた)。
   同じ id のボタンがページに2つあるので querySelectorAll で全部に入れる
   (getElementById は1つしか返さず、2つ目が死んだままになる)。

   **v0.2.45 から Intel の Mac 版、v0.2.49 から Windows 版も配っている。** 資産は:
     Sendy-x.y.z-arm64.dmg … Apple の M シリーズ用
     Sendy-x.y.z.dmg       … Intel の Mac 用
     Sendy Setup x.y.z.exe … Windows 用 (試験中)
   前は「最初に見つかった .dmg」を渡していたので、Intel の Mac の人にも
   M シリーズ用が渡り、開いても起動しなかった。ここで機種を見分けて渡し分ける。 */
(function () {
  'use strict';
  var API = 'https://api.github.com/repos/tkimurabusiness-debug/sendy-download/releases/latest';
  var FALLBACK = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest';

  /* この機械が何かを見分ける。
     userAgent の "Intel Mac OS X" は M シリーズでもそう名乗るので、Mac の中の機種判別には使えない。
     画面描画の部品の名前を見るのが、ブラウザから分かる一番確かな方法
     (M シリーズは "Apple M1" や "Apple GPU"、Intel 機は "Intel" や "AMD" と出る)。
     分からない時は null を返し、呼び出し側が M シリーズを既定にする。 */
  function isWindows() {
    return /Windows|Win32|Win64/i.test(navigator.userAgent || '');
  }

  function isAppleSilicon() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return null;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (!ext) return null;
      var r = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
      if (/apple/i.test(r)) return true;
      if (/intel|amd|radeon|nvidia|geforce/i.test(r)) return false;
      return null;
    } catch (e) {
      return null;
    }
  }

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

  /* 機種ちがいの行。**資産が無ければ行ごと消す** (押して 404 にしない)。 */
  function setAlt(id, asset, label) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!asset) { el.hidden = true; return; }
    el.setAttribute('href', asset.browser_download_url);
    el.textContent = label + '（約 ' + Math.round(asset.size / 1048576) + ' MB）';
    el.hidden = false;
  }

  setAll(FALLBACK);   // 取得に失敗しても、リリース一覧までは必ず飛べるようにしておく

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      var dmgs = rel.assets.filter(function (a) { return /\.dmg$/.test(a.name); });
      var arm = dmgs.filter(function (a) { return /arm64/.test(a.name); })[0];
      var intel = dmgs.filter(function (a) { return !/arm64/.test(a.name); })[0];
      var win = rel.assets.filter(function (a) { return /\.exe$/.test(a.name); })[0];

      /* 主のボタンは、その機械に合う物を渡す。 */
      var pick = null;
      var suffix = '';
      if (isWindows()) {
        pick = win; suffix = ' · Windows（試験中）';
      } else {
        pick = (isAppleSilicon() === false ? intel : arm) || dmgs[0];
      }
      if (pick) {
        setAll(pick.browser_download_url, Math.round(pick.size / 1048576), rel.tag_name + suffix);
      }

      /* 下の小さい行には「主のボタンで渡していない方」を出す。 */
      setAlt('dl-intel', pick === intel ? null : intel, 'Intel の Mac をお使いの方はこちら');
      setAlt('dl-win', pick === win ? null : win, 'Windows 版（試験中）');
      /* 署名が無いことの案内は、Windows 版が実際に配られている時だけ出す。 */
      var note = document.getElementById('dl-win-note');
      if (note) note.hidden = !win;
      if (isWindows()) {
        /* Windows の人には、Mac 版への入口も1本だけ出しておく。 */
        setAlt('dl-intel', arm, 'Mac（M シリーズ）をお使いの方はこちら');
      }
    })
    .catch(function () { /* 取得できなければ FALLBACK のまま */ });
})();
