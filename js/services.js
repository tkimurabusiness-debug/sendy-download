// S6「対応サービス」— サービスのアイコンが Sendy のアイコンへ吸い込まれ、1つ取り込むたびに
// Sendy のアイコンが跳ねる。
//
// 竹蔵 2026-07-24 の指示で、段ボール箱の 3D 演出は取りやめ:
//  「箱じゃなくてももういいかも。sendy のアプリのアイコンに向かって集まってくみたいな。
//   1つ取り込むごとに sendy のアイコンがポップ?というかアニメーションをつけるみたいな」
//
// 下敷き: /tmp/sendy-anim-refs/gsap-flip-cart/cart.js
//   addToCart() の「対象へ飛ばす → 着弾したら受け側を跳ねさせる」流れと、
//   cartBtnAnimation() の「受け側が跳ねて戻る」演出をそのまま踏襲する。
//   元はクリック発火なので、1本の scrub タイムラインに乗せ替えてスクロール量に連動させた。
//
// 画質について (竹蔵「アイコンの画質がクソ悪い」の対策):
//   元実装は Flip の scale:true で 64px のアイコンを引き伸ばしていた。ブラウザは元の大きさで
//   一度描いてから拡大するので、拡大した分だけぼやける。ここでは拡大を一切しない。
//   アイコンは最初から最大の大きさで置き、動くのは位置と、着弾時の縮小だけにする。

import { createGrid } from './canvasui/grid.js';
import { createClouds } from './canvasui/clouds.js';

gsap.registerPlugin(ScrollTrigger);

// 背景の層。竹蔵 2026-07-24 の選択で Canvas UI の grid (格子が波打つ) に確定。
// tint は [r,g,b] の数値で渡す (文字列を渡すと緑に化ける)。青 #3b6dff と紫 #8b5cf6 の
// 中間 #6364fa を指定して、カーソルの跡がブランドの色になるようにしている。
//
// 案出しページ (sendy-page-options) から設定を差し替えられるように、
// window.SVC_BG_CONFIG があればそちらを使う。無ければ確定仕様 (下の既定値)。
const SVC_BG_DEFAULT = {
  type: 'grid',
  // idleRipples はマウスが止まっている間に自動で波を出す間隔(秒)。既定の 0 は「出さない」で、
  // カーソルを動かさない限り背景が完全に静止していた (竹蔵 2026-07-25「ここの背景が変わってない」)。
  // 濃さも 0.26 まで落としていて、動いていても見えなかった。両方を上げて常に動く背景にする。
  // 竹蔵 2026-07-25「もっと広範囲で結構早く発生する感じで」→ waveWidth 0.05→0.55 /
  // frequency 12→1.4 / fadeTime 0.2→2.6 まで広げたところ、今度は「波の範囲がデカすぎる」
  // (2026-07-25 後半)。出る間隔(idleRipples)の速さは維持したまま、1つの波の届く範囲だけ
  // 中間へ戻す。waveWidth は輪の太さ (シェーダーの exp(-(relDist/waveWidth)^2) の窓)、
  // frequency は輪の中の縞の細かさ、fadeTime は何秒その場に残るか
  // (=残り続ける秒数が長いほど、idleRipples で次々出る波と重なって「範囲が広い」ように見える)。
  // 単純に既定値へ戻すのではなく、既定値と直前値のちょうど中間を狙う。
  //   waveWidth  0.05(既定) …[中間 0.2]… 0.55(直前)
  //   frequency 12(既定)   …[中間 5  ]… 1.4(直前)
  //   fadeTime   0.2(既定) …[中間 1.2]… 2.6(直前)
  // maxLift はシェーダー既定と同値の 1.0 のままで変更なし (この値は輪の高さ=濃さの上限で、
  // 届く範囲には効かないため)。idleRipples も 0.45 のまま変更なし (間隔の速さを保つ指示)。
  options: { tileSize: 26, gap: 3, waveSpeed: 0.9, amplitude: 0.95,
    waveWidth: 0.2, frequency: 5, fadeTime: 1.2, maxLift: 1.0,
    tint: [0.388, 0.394, 0.982], tintStrength: 0.95, shading: 0.7, idleRipples: 0.45 },
  outOpacity: 0.62,
};
(() => {
  const wrap = document.querySelector('.svc-bg');
  if (!wrap) return;
  const cfg = window.SVC_BG_CONFIG || SVC_BG_DEFAULT;
  const factory = cfg.type === 'clouds' ? createClouds : createGrid;
  const out = wrap.querySelector('.svc-bg__out');
  if (cfg.outOpacity != null) out.style.opacity = String(cfg.outOpacity);
  const inst = factory(
    {
      source: wrap.querySelector('.svc-bg__src'),
      content: wrap.querySelector('.svc-bg__content'),
      output: out,
    },
    cfg.options || {},
  );
  if (!inst) wrap.remove();          // WebGL2 が無い環境では背景ごと消す
  else window.addEventListener('resize', () => inst.resize());
})();

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const stage = document.getElementById('svcStage');

if (reduceMotion) {
  document.body.classList.add('svc-static');
} else {
  const pin = document.querySelector('.svc-stage__pin');
  const hub = document.getElementById('svcHub');
  const ring = document.getElementById('svcRing');
  const counter = null; // 竹蔵 2026-07-24「6/10 みたいな表記いらない」
  const icons = gsap.utils.toArray('.svc-icon');

  // 受け側 (Sendy のアイコン) が跳ねる。元 cart.js の cartBtnAnimation と同じ役割。
  // CustomWiggle は使わず、GSAP 本体だけで済む elastic で同じ「跳ねて戻る」を出す。
  let absorbed = 0;
  const setCount = (n) => { absorbed = n; if (counter) counter.textContent = String(n); };
  const pop = () => {
    setCount(Math.min(icons.length, absorbed + 1));
    gsap.timeline()
      .to(hub, { duration: 0.12, scale: 1.14, ease: 'power2.out' })
      .to(hub, { duration: 0.9, scale: 1, ease: 'elastic.out(1, 0.34)' })
      .fromTo(ring, { opacity: 0.9, scale: 0.7 },
        { opacity: 0, scale: 1.6, duration: 0.75, ease: 'power2.out' }, 0);
  };

  const master = gsap.timeline({
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      pin,
      anticipatePin: 1,
    },
  });

  // 1個ずつ順番に吸い込む。位置だけ動かし、着弾の瞬間に縮めて消す (拡大はしない)。
  const step = 1;
  icons.forEach((icon, i) => {
    const at = i * step;
    master.to(icon, { x: 0, y: 0, rotate: 0, duration: step * 0.78, ease: 'power2.in' }, at);
    master.to(icon, {
      scale: 0.32, opacity: 0, duration: step * 0.22, ease: 'power2.in',
      onComplete: pop,
      onReverseComplete: () => setCount(Math.max(0, absorbed - 1)),
    }, at + step * 0.78);
  });

  // COMPLETE の表示は竹蔵の指示で撤去 (文字がかぶる・不要)。

  // 散らばりの初期位置は CSS 変数 (--x/--y) で置き、そこから中央までの差分を x/y に入れる。
  // こうすると Flip を使わずに「散らばり → 中央」を1本のタイムラインで扱える。
  const layout = () => {
    const pinBox = pin.getBoundingClientRect();
    const hubBox = hub.getBoundingClientRect();
    const cx = hubBox.left + hubBox.width / 2 - pinBox.left;
    const cy = hubBox.top + hubBox.height / 2 - pinBox.top;
    icons.forEach((icon) => {
      const sx = parseFloat(getComputedStyle(icon).getPropertyValue('--x')) / 100 * pinBox.width;
      const sy = parseFloat(getComputedStyle(icon).getPropertyValue('--y')) / 100 * pinBox.height;
      gsap.set(icon, { x: sx - cx, y: sy - cy });
    });
    // 動きの設計図(master)は作られた時点の「開始位置」を覚えている。散らばり位置を後から
    // 入れても、設計図は開始を 0 のまま握っているので、スクロールすると即座に中央へ戻されて
    // 全部が1箇所に重なる (竹蔵 2026-07-25「またなんか一箇所に集まるバグ」の原因)。
    // invalidate() で開始位置を測り直させてから、位置合わせを更新する。
    master.invalidate();
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', layout);
  window.addEventListener('resize', layout);
  layout();
}

// 一覧の reveal-on-scroll (移植元: /tmp/sendy-dl/index.html の IntersectionObserver)。
if (!reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
}
