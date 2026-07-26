// フッターの巨大ワードマークの迫り上がり (design.md §5: 0.8s・1回だけ)。
// 仕組みは移植元 /tmp/sendy-dl/index.html の .reveal + IntersectionObserver と同じで、
// transition は CSS 側 (css/30-footer.css .wordmark-line) が持つ。
(function () {
  'use strict';
  var wm = document.getElementById('wordmark');
  if (!wm) return;
  var show = function () { wm.classList.add('in'); };
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return show();
  if (!('IntersectionObserver' in window)) return show();
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(); io.disconnect(); }
    });
  }, { threshold: 0.3 });
  io.observe(wm.parentElement || wm);
})();
