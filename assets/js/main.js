// Site-wide behaviour: theme toggle, copy buttons, reveal-on-scroll. No dependencies, no network.
(function () {
  'use strict';
  var root = document.documentElement;

  // Theme toggle (dark / light / follow system on first visit)
  var btn = document.getElementById('theme');
  function effective() { var t = root.getAttribute('data-theme'); return t || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }
  if (btn) btn.addEventListener('click', function () {
    var next = effective() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('pelorus-theme', next); } catch (e) { /* ignore */ }
  });

  // Copy buttons
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy'), done = function () { var o = b.textContent; b.textContent = 'copied'; setTimeout(function () { b.textContent = o; }, 1400); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(function (e) { io.observe(e); });
})();
