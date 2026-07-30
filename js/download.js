/* ダウンロードボタンの行き先を、GitHub の「最新のリリース」から毎回引き直す。
   固定で書いていると版が上がるたびに 404 になる (2026-07-25 に実際に起きた)。
   同じ id のボタンがページに2つあるので querySelectorAll で全部に入れる
   (getElementById は1つしか返さず、2つ目が死んだままになる)。

   **v0.2.45 から Intel の Mac 向けも配っている。** 資産は2つ:
     Sendy-x.y.z-arm64.dmg … Apple の M シリーズ用
     Sendy-x.y.z.dmg       … Intel 用
   前は「最初に見つかった .dmg」を渡していたので、Intel の Mac の人にも
   M シリーズ用が渡り、開いても起動しなかった。ここで機種を見分けて渡し分ける。 */
(function () {
  'use strict';
  var API = 'https://api.github.com/repos/tkimurabusiness-debug/sendy-download/releases/latest';
  var FALLBACK = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest';

  /* この Mac が Apple の M シリーズかどうか。
     userAgent は M シリーズでも "Intel Mac OS X" と名乗るので使えない。
     画面描画の部品の名前を見るのが、ブラウザから分かる一番確かな方法
     (M シリーズは "Apple M1" や "Apple GPU"、Intel 機は "Intel" や "AMD" と出る)。
     分からない時は null を返し、呼び出し側が M シリーズを既定にする。 */
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

  /* もう一方の機種向けのリンクを、ボタンの下に小さく出す。
     見分けを間違えても、利用者が自分で選べるようにしておく (詰まる人を作らない)。 */
  function showOther(asset, label) {
    if (!asset) return;
    var meta = document.querySelector('.dl-meta');
    if (!meta || document.getElementById('dl-other')) return;
    var p = document.createElement('div');
    p.id = 'dl-other';
    p.className = 'dl-meta';
    p.style.marginTop = '6px';
    p.style.opacity = '0.72';
    var a = document.createElement('a');
    a.href = asset.browser_download_url;
    a.rel = 'noopener';
    a.textContent = label;
    a.style.color = 'inherit';
    a.style.textDecoration = 'underline';
    p.appendChild(a);
    meta.parentNode.insertBefore(p, meta.nextSibling);
  }

  setAll(FALLBACK);   // 取得に失敗しても、リリース一覧までは必ず飛べるようにしておく

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      var dmgs = rel.assets.filter(function (a) { return /\.dmg$/.test(a.name); });
      if (!dmgs.length) return;
      var arm = dmgs.filter(function (a) { return /arm64/.test(a.name); })[0];
      var intel = dmgs.filter(function (a) { return !/arm64/.test(a.name); })[0];
      var silicon = isAppleSilicon();
      /* 分からない時は M シリーズを既定にする (2020年以降の Mac はすべてこちら)。 */
      var pick = (silicon === false ? intel : arm) || dmgs[0];
      setAll(pick.browser_download_url, Math.round(pick.size / 1048576), rel.tag_name);
      if (pick === arm && intel) showOther(intel, 'Intel の Mac をお使いの方はこちら');
      else if (pick === intel && arm) showOther(arm, 'M シリーズの Mac をお使いの方はこちら');
    })
    .catch(function () { /* 取得できなければ FALLBACK のまま */ });
})();
