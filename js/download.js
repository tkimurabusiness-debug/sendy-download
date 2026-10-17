/* Mシリーズは実機確認済み0.2.199へ固定する。Intel/Windowsは既存stable経路を維持する。 */
(function () {
  'use strict';
  function start() {
  var API = 'https://api.github.com/repos/tkimurabusiness-debug/sendy-download/releases/latest';
  var ARM_VERSION = 'v0.2.199';
  var ARM_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/download/v0.2.199/Sendy-0.2.199-arm64.dmg';
  var ARM_ASSET = { name: 'Sendy-0.2.199-arm64.dmg', size: 306663097, browser_download_url: ARM_DMG };
  var INTEL_DMG = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/latest/download/Sendy-intel.dmg';
  // Apple Siliconだけを更新した版では、他の機種は最後に配布した版を使う。
  var LEGACY_API = 'https://api.github.com/repos/tkimurabusiness-debug/sendy-download/releases/tags/v0.2.106';
  var LEGACY_INTEL = INTEL_DMG.replace('/latest/download/', '/download/v0.2.106/');
  var LEGACY_WIN = 'https://github.com/tkimurabusiness-debug/sendy-download/releases/download/v0.2.106/Sendy-Setup-0.2.106.exe';
  var lastDownload;
  var lastPicks = {};

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

  function setAll(href, size, ver, platform) {
    lastDownload = [href, size, ver, platform];
    var btns = document.querySelectorAll('[data-sendy-download="auto"], .c-bMjifB, .footer-dl-btn');
    Array.prototype.forEach.call(btns, function (b) { b.setAttribute('href', href); });
    if (size) {
      var s = document.getElementById('dl-size');
      if (s) s.textContent = '約 ' + size + ' MB';
    }
    if (ver) {
      var v = document.getElementById('dl-ver');
      if (v) v.textContent = ver;
    }
    if (platform) {
      var label = document.querySelector('.dl-sub');
      if (label) label.textContent = platform;
      var kind = document.getElementById('dl-kind');
      if (kind) kind.textContent = isWindows() ? '.exe' : '.dmg';
    }
  }

  /* 機種ごとのボタン。**3つとも同じ大きさ** (竹蔵 2026-08-01
   *   「ちっちゃくしないで apple シリコン版とちゃんと同じ感じのボタンにして欲しいかな
   *     intel 版も、あとちゃんとそれぞれ分かりやすくしてね」)。
   * **資産が無ければ丸ごと消す** (押して 404 にしない)。
   * `mine` が真の1つだけ色を付ける — どれを押せばよいかを迷わせない。 */
  function setPick(id, href, asset, mine, version) {
    lastPicks[id] = [id, href, asset, mine, version];
    var el = document.getElementById(id);
    if (!el) return;
    if (!asset) { el.hidden = true; return; }
    el.setAttribute('href', href);
    el.classList.toggle('is-mine', !!mine);
    var sub = el.querySelector('.dl-pick-sub');
    if (sub) {
      var mb = Math.round(asset.size / 1048576);
      sub.textContent = sub.textContent.replace(/\s*·\s*(?:v[\d.]+\s*·\s*)?約 \d+ MB$/, '') + ' · ' + version + ' · 約 ' + mb + ' MB';
    }
    el.hidden = false;
  }

  setAll(isWindows() ? LEGACY_WIN : isAppleSilicon() === false ? LEGACY_INTEL : ARM_DMG,
    isWindows() || isAppleSilicon() === false ? null : Math.round(ARM_ASSET.size / 1048576),
    isWindows() || isAppleSilicon() === false ? 'v0.2.106' : ARM_VERSION,
    isWindows() ? 'Windows 版（試験中）' : isAppleSilicon() === false ? 'macOS 版（Intel）' : 'macOS 版（Apple Silicon）');

  setPick('dl-arm', ARM_DMG, !isWindows() && isAppleSilicon() !== false ? null : ARM_ASSET, false, ARM_VERSION);

  function fetchRelease(url) {
    return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { return r.ok ? r.json() : null; });
  }

  function asset(rel, pattern) {
    return rel && Array.isArray(rel.assets) ? rel.assets.filter(function (a) { return pattern.test(a.name); })[0] : null;
  }

  fetchRelease(API)
    .then(function (rel) {
      if (!rel || !rel.assets) return;
      if (asset(rel, /^Sendy-intel\.dmg$/) && asset(rel, /\.exe$/)) return { current: rel, legacy: null };
      return fetchRelease(LEGACY_API).catch(function () { return null; })
        .then(function (legacy) { return { current: rel, legacy: legacy }; });
    })
    .then(function (releases) {
      if (!releases) return;
      var rel = releases.current;
      var arm = ARM_ASSET;
      var intel = asset(rel, /^Sendy-intel\.dmg$/) || asset(releases.legacy, /^Sendy-intel\.dmg$/);
      var win = asset(rel, /\.exe$/) || asset(releases.legacy, /\.exe$/);
      var intelVer = asset(rel, /^Sendy-intel\.dmg$/) ? rel.tag_name : 'v0.2.106';
      var winVer = asset(rel, /\.exe$/) ? rel.tag_name : 'v0.2.106';

      /* 主のボタンは、その機械に合う固定名DMGを渡す。 */
      var pick = null;
      var pickHref = '';
      var suffix = '';
      var version = ARM_VERSION;
      var platform = 'macOS 版（Apple Silicon）';
      if (isWindows()) {
        pick = win;
        pickHref = win ? win.browser_download_url : '';
        suffix = ' · Windows（試験中）';
        version = winVer;
        platform = 'Windows 版（試験中）';
      } else if (isAppleSilicon() === false) {
        pick = intel;
        pickHref = intel ? intel.browser_download_url : '';
        version = intelVer;
        platform = 'macOS 版（Intel）';
      } else {
        pick = arm;
        pickHref = ARM_DMG;
      }
      if (pick && pickHref) {
        setAll(pickHref, Math.round(pick.size / 1048576), version + suffix, platform);
      }

      /* 3つとも同じ大きさで出す。合う物だけ色を付ける。 */
      // **主のボタンが渡す物は、下に出さない** (同じ物が2つ並ぶと迷う)。
      // 下に出るのは「自分の機械ではない方」だけ。ただし**大きさは主のボタンと同じ**にする
      // (竹蔵「ちっちゃくしないで apple シリコン版とちゃんと同じ感じのボタンに」)。
      setPick('dl-arm', ARM_DMG, pick === arm ? null : arm, false, ARM_VERSION);
      // legacy取得の失敗を「配布物なし」と扱わず、確認済みの初期リンクを保つ。
      if (releases.legacy || asset(rel, /^Sendy-intel\.dmg$/)) {
        setPick('dl-intel', intel ? intel.browser_download_url : '', intel, false, intelVer);
      }
      if (releases.legacy || asset(rel, /\.exe$/)) {
        setPick('dl-win', win ? win.browser_download_url : '', pick === win ? null : win, false, winVer);
      }
      // 並ぶ物が1つも無い時は、見出しも消す (「こちら」と言って何も無いのを防ぐ)。
      var lead = document.querySelector('.dl-picks-lead');
      var shown = document.querySelectorAll('.dl-pick:not([hidden])').length;
      if (lead) lead.hidden = shown === 0;
      /* 署名が無いことの案内は、Windows 版が実際に配られている時だけ出す。 */
      var note = document.getElementById('dl-win-note');
      if (note) note.hidden = !win;
    })
    .catch(function () { /* 初期状態のDMG直リンクを保つ。 */ });
  // 原版runtimeが追従CTAを後から描画しても、同じ配布先を反映する。
  new MutationObserver(function (records) {
    var addedCTA = records.some(function (record) {
      return Array.prototype.some.call(record.addedNodes, function (node) {
        return node.nodeType === 1 && (node.matches('[data-sendy-download], .c-bMjifB') || node.querySelector('[data-sendy-download], .c-bMjifB'));
      });
    });
    if (!addedCTA) return;
    if (lastDownload) setAll.apply(null, lastDownload);
    Object.keys(lastPicks).forEach(function (key) { setPick.apply(null, lastPicks[key]); });
  }).observe(document.getElementById('__next') || document.body, { childList: true, subtree: true });
  }
  if (window.__NEXT_DATA__) {
    var ready = setInterval(function () {
      if (window.next && window.next.router && window.next.router.isReady) {
        clearInterval(ready);
        start();
      }
    }, 50);
  } else start();
})();
