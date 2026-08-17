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
  var ARM_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-arm64.dmg';
  var INTEL_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-intel.dmg';

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

  /* 機種ごとのボタン。**3つとも同じ大きさ** (竹蔵 2026-08-01
   *   「ちっちゃくしないで apple シリコン版とちゃんと同じ感じのボタンにして欲しいかな
   *     intel 版も、あとちゃんとそれぞれ分かりやすくしてね」)。
   * **資産が無ければ丸ごと消す** (押して 404 にしない)。
   * `mine` が真の1つだけ色を付ける — どれを押せばよいかを迷わせない。 */
  function setPick(id, href, asset, mine) {
    var el = document.getElementById(id);
    if (!el) return;
    if (!asset) { el.hidden = true; return; }
    el.setAttribute('href', href);
    el.classList.toggle('is-mine', !!mine);
    var sub = el.querySelector('.dl-pick-sub');
    if (sub) {
      var mb = Math.round(asset.size / 1048576);
      sub.textContent = sub.textContent.replace(/\s*·\s*約 \d+ MB$/, '') + ' · 約 ' + mb + ' MB';
    }
    el.hidden = false;
  }

  setAll(isAppleSilicon() === false ? INTEL_DMG : ARM_DMG);

  fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      var arm = rel.assets.filter(function (a) { return a.name === 'Sendy-arm64.dmg'; })[0];
      var intel = rel.assets.filter(function (a) { return a.name === 'Sendy-intel.dmg'; })[0];
      var win = rel.assets.filter(function (a) { return /\.exe$/.test(a.name); })[0];

      /* 主のボタンは、その機械に合う固定名DMGを渡す。 */
      var pick = null;
      var pickHref = '';
      var suffix = '';
      if (isWindows()) {
        pick = win;
        pickHref = win ? win.browser_download_url : '';
        suffix = ' · Windows（試験中）';
      } else if (isAppleSilicon() === false) {
        pick = intel;
        pickHref = INTEL_DMG;
      } else {
        pick = arm;
        pickHref = ARM_DMG;
      }
      if (pick && pickHref) {
        setAll(pickHref, Math.round(pick.size / 1048576), rel.tag_name + suffix);
      }

      /* 3つとも同じ大きさで出す。合う物だけ色を付ける。 */
      // **主のボタンが渡す物は、下に出さない** (同じ物が2つ並ぶと迷う)。
      // 下に出るのは「自分の機械ではない方」だけ。ただし**大きさは主のボタンと同じ**にする
      // (竹蔵「ちっちゃくしないで apple シリコン版とちゃんと同じ感じのボタンに」)。
      setPick('dl-arm', ARM_DMG, pick === arm ? null : arm, false);
      setPick('dl-intel', INTEL_DMG, pick === intel ? null : intel, false);
      setPick('dl-win', win ? win.browser_download_url : '', pick === win ? null : win, false);
      // 並ぶ物が1つも無い時は、見出しも消す (「こちら」と言って何も無いのを防ぐ)。
      var lead = document.querySelector('.dl-picks-lead');
      var shown = document.querySelectorAll('.dl-pick:not([hidden])').length;
      if (lead) lead.hidden = shown === 0;
      /* 署名が無いことの案内は、Windows 版が実際に配られている時だけ出す。 */
      var note = document.getElementById('dl-win-note');
      if (note) note.hidden = !win;
    })
    .catch(function () { /* 初期状態のDMG直リンクを保つ。 */ });
})();
