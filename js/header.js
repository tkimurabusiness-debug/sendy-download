/* Sendy LP — ヘッダーの動き (liquid-glass の作法)。
   ・一番上に居る間は全幅の四角 (クラス無し)
   ・48px より下へ行ったら .shrunk を付けて、丸いピルに縮んで浮く
   ・**上へスクロールした時に姿を変える動きは入れない** (竹蔵の指示)。
     そのため向きは一切見ず、位置 (scrollY) だけで決める。
   見た目の指定は css/00-base.css の .lg-header / .lg-inner / .lg-header.shrunk にある。 */
(function () {
  'use strict';
  var header = document.getElementById('lgHeader');
  if (!header) return;

  var THRESHOLD = 48;
  var ticking = false;

  function apply() {
    ticking = false;
    var shrunk = (window.scrollY || window.pageYOffset || 0) > THRESHOLD;
    header.classList.toggle('shrunk', shrunk);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }

  apply();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();
