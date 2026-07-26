/* Sendy LP — 強みの節 (S1〜S5) の動き。竹蔵採用 案 A-2「5つまとめて1本のロック」(2026-07-25)。
   下敷き (実在コードの移植。ゼロから書いていない):
   - 連番画像→canvas = GSAP公式 imageSequence() ヘルパー
     (/tmp/sendy-anim-refs/gsap-scroll-image-sequence/script.js — Apple の AirPods Pro
      ページの実装を GreenSock 公式が再現したもの) をほぼそのまま。
     5節分の連番 (30枚×5=150枚) を1本の再生ヘッドで通しただけ。
   - ロック = /tmp/sendy-anim-refs/folding-cardboard-box/js/main.js (Codrops, MIT) の
     gsap.timeline({ scrollTrigger: { scrub, pin } }) 構成。
   - ページ各所の .reveal (出現の動き) は旧実装の IntersectionObserver を続用。 */
(function () {
  'use strict';

  // ============ 連番画像の設定 (本物の動画が来たらここだけ差し替える) ============
  // 1) 縦動画を連番PNG/JPGへ書き出す 2) assets/frames/<id>/ の中身を差し替える
  // 3) count を実際の枚数に変える。ファイル名の形式は変えなくてよい。
  // 形式は webp。同じ絵で PNG の約6分の1になる (実測: 1枚 307KB -> 47KB / 全体 29MB -> 4.2MB)。
  var CFG = { basePath: 'assets/frames', count: 30, pad: 4, ext: 'webp',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    // 連番画像がまだ無い間に映像枠へ出しておく静止画。
    // 何も描かないと**ただの黒い四角**になり、壊れて見える (竹蔵 2026-07-26「まだ潰れている」)。
    fallback: 'assets/shot-inbox.png' };

  function urlsAll() {
    var urls = [];
    CFG.sections.forEach(function (id) {
      for (var i = 1; i <= CFG.count; i++) {
        urls.push(CFG.basePath + '/' + id + '/' + String(i).padStart(CFG.pad, '0') + '.' + CFG.ext);
      }
    });
    return urls;
  }

  /** 画像が使える状態か (読み込み済みで、幅がある = 壊れていない)。 */
  function usable(img) {
    return !!img && img.complete && img.naturalWidth > 0;
  }

  /** 枠の中に収まるよう、縦横比を保って中央に置く (切り取らない)。
   *  映像枠は縦長 (9:16) で、差し込む静止画は横長なので、切り取ると中身が読めない。
   *  余白は枠の背景色のまま残す。 */
  function drawContain(ctx, img, cw, ch) {
    var s = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    var w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
  }

  // GSAP公式デモの imageSequence() (原型のまま。scrollTrigger は使わずタイムラインに載せる)
  function imageSequenceTween(canvas, urls, gsapAvailable) {
    var playhead = { frame: 0 };
    var ctx = canvas.getContext('2d');
    var curFrame = -1;
    var images;
    var anyLoaded = false;
    // **ここで例外を外へ出してはいけない。**
    // この関数は GSAP のタイムラインの onUpdate として呼ばれる。連番画像がまだ無い時に
    // drawImage が InvalidStateError を投げると、その例外がタイムラインの描画を丸ごと
    // 中断し、**後ろに並んでいる文章の表示も、画面を固定する処理も全部止まる**。
    // 2026-07-26 の「動画の節が真っ黒で文字も出ない・画面ロックもない」の真因がこれ。
    var updateImage = function () {
      var frame = Math.round(playhead.frame);
      if (frame === curFrame) return;
      var img = images[frame];
      if (!usable(img)) return;          // まだ来ていない / 404 で壊れている → 何もしない
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        curFrame = frame;
        anyLoaded = true;
      } catch (e) {
        /* 描けない画像は黙って飛ばす。演出全体を止めない。 */
      }
    };
    images = urls.map(function (url, i) {
      var img = new Image();
      img.src = url;
      if (i === 0) img.onload = updateImage;
      return img;
    });

    // 連番画像が1枚も無い時は、静止画を1枚だけ敷いておく (黒い四角のままにしない)。
    if (CFG.fallback) {
      var still = new Image();
      still.onload = function () {
        if (anyLoaded) return;           // 本物の連番が来ていれば静止画は出さない
        try { drawContain(ctx, still, canvas.width, canvas.height); } catch (e) { /* 無視 */ }
      };
      still.src = CFG.fallback;
    }
    if (!gsapAvailable) return null;
    return gsap.to(playhead, {
      frame: images.length - 1,
      ease: 'none',
      onUpdate: updateImage,
      duration: 5   // タイムライン上で 5 (=強み1つにつき1) の長さを占める
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var gsapAvailable = !!(window.gsap && window.ScrollTrigger) && !reduceMotion;

    var stage = document.getElementById('features');
    if (stage) {
      var pin = stage.querySelector('.fx2-pin');
      var grid = stage.querySelector('.fx2-grid');
      var media = stage.querySelector('.fx2-media');
      var canvas = stage.querySelector('canvas');
      var texts = Array.prototype.slice.call(stage.querySelectorAll('.fx2-text'));

      var seq = imageSequenceTween(canvas, urlsAll(), gsapAvailable);

      if (!gsapAvailable) {
        document.body.classList.add('fx2-static');
      } else {
        gsap.registerPlugin(ScrollTrigger);

        // 映像の幅を実測して、文章の置き場所 (CSS 変数) に渡す
        var layout = function () { grid.style.setProperty('--fx2-mw', media.offsetWidth + 'px'); };
        layout();
        ScrollTrigger.addEventListener('refreshInit', layout);

        var tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            pin: pin,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });

        tl.add(seq, 0);

        var isNarrow = function () { return innerWidth <= 900; };
        var mediaX = function (i) {
          // 狭い画面では左右の行き来をしない。CSS の translate -50% (中央固定) は GSAP が
          // 自分の transform に取り込むため、目標 0 だと中央固定が外れて右へずれる。
          // 中央のまま留めるには -幅/2 を目標にする (2026-07-25 実測で発見した案A-2の修正)。
          if (isNarrow()) return -media.offsetWidth / 2;
          return i % 2 ? grid.clientWidth - 48 - media.offsetWidth : 0;
        };

        texts.forEach(function (t, i) {
          var inner = t.querySelector('.fx2-text-inner');
          if (i > 0) {
            tl.to(media, {
              x: (function (idx) { return function () { return mediaX(idx); }; })(i),
              duration: 0.35, ease: 'power2.inOut'
            }, i);
          }
          // 前の見出しが消え切った時刻 ((i-1)+1.0 = i) に次を出し始める。
          // 以前は i+0.18 から出していたので、**見出しが1つも出ていない区間**が
          // 節の 3.6% (画面にして200px 以上) できていた。そこで止まると
          // 「見出しが消えている」ように見える (竹蔵 2026-07-26)。
          // 少しだけ重ねる (i-0.08 から出し始め、前の見出しは i+1.0 で消え切る)。
          // ぴったり突き合わせにすると、境目のちょうど1点で**どの見出しも出ていない瞬間**が
          // できてしまう (2026-07-26 実測: 節の 20% の地点で全部 opacity 0 だった)。
          tl.fromTo(inner, { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.16, ease: 'none' },
            i === 0 ? 0.02 : i - 0.08);
          if (i < texts.length - 1) {
            tl.to(inner, { autoAlpha: 0, y: -16, duration: 0.14, ease: 'none' }, i + 0.86);
          }
        });
      }
    }

    // ---- ページ各所の .reveal: 下から16px上がりながら現れる (design.md §7) ----
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('in');
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
      );
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }
  });
})();
