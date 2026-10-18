// Home page: the pelorus dial in the hero, the screenshot tilt, and the Toolbox teaser numbers.
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  // ---- dial ticks (one every 5 degrees, a longer one every 30, labels at 0/90/180/270)
  var ticks = document.getElementById('ticks');
  if (ticks) {
    for (var a = 0; a < 360; a += 5) {
      var major = a % 30 === 0, rad = (a - 90) * Math.PI / 180, r1 = 228, r2 = major ? 206 : 217;
      var l = document.createElementNS(NS, 'line');
      l.setAttribute('class', 'tick' + (major ? ' major' : ''));
      l.setAttribute('x1', (Math.cos(rad) * r1).toFixed(2)); l.setAttribute('y1', (Math.sin(rad) * r1).toFixed(2));
      l.setAttribute('x2', (Math.cos(rad) * r2).toFixed(2)); l.setAttribute('y2', (Math.sin(rad) * r2).toFixed(2));
      l.setAttribute('stroke-width', major ? '1.8' : '1');
      ticks.appendChild(l);
      if (a % 90 === 0) {
        var t = document.createElementNS(NS, 'text'); var rt = 190;
        t.setAttribute('x', (Math.cos(rad) * rt).toFixed(2)); t.setAttribute('y', (Math.sin(rad) * rt + 4).toFixed(2));
        t.setAttribute('text-anchor', 'middle'); t.textContent = String(a).padStart(3, '0');
        ticks.appendChild(t);
      }
    }
  }

  // ---- vane follows the pointer; sweeps slowly when idle
  var wrap = document.getElementById('dial-wrap'), vane = document.getElementById('vane'), out = document.getElementById('bearing');
  var angle = 47, target = 47, lastMove = 0, raf = 0;
  function show(a) { var n = ((Math.round(a) % 360) + 360) % 360; if (vane) vane.setAttribute('transform', 'rotate(' + a.toFixed(2) + ')'); if (out) out.textContent = String(n).padStart(3, '0') + '°'; }
  show(angle);
  if (wrap && !reduced) {
    var hero = document.getElementById('top');
    function onMove(e) {
      var rc = wrap.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
      target = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
      lastMove = performance.now();
    }
    (hero || document).addEventListener('pointermove', onMove, { passive: true });
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(wrap);
    (function tick(now) {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (now - lastMove > 3500) target = angle + 0.35;        // idle: slow sweep
      var d = ((target - angle + 540) % 360) - 180;             // shortest way round
      angle += d * 0.09; show(angle);
    })(performance.now());
  }

  // ---- screenshot gently flattens as it scrolls into view
  var sc = document.getElementById('showcase');
  if (sc && !reduced) {
    var ticking = false;
    function tilt() { var r = sc.getBoundingClientRect(), p = Math.min(1, Math.max(0, r.top / (innerHeight * 0.9))); sc.style.setProperty('--tilt', (p * 7).toFixed(2) + 'deg'); ticking = false; }
    addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(tilt); } }, { passive: true });
    tilt();
  }

  // ---- Toolbox teaser (reads the same data file the Toolbox page uses; falls back silently)
  var stats = document.getElementById('stats'), chips = document.getElementById('cat-chips');
  if (stats && window.fetch) {
    fetch('assets/data/toolbox.json').then(function (r) { return r.json(); }).then(function (j) {
      var set = function (k, v) { var el = stats.querySelector('[data-k="' + k + '"]'); if (el) el.textContent = v.toLocaleString('en-US'); };
      set('total', j.meta.total); set('curated', j.meta.curatedVerified); set('cats', j.categories.length);
      if (chips) j.categories.slice(0, 10).forEach(function (c) { var a = document.createElement('a'); a.href = 'toolbox/#c=' + c.id; a.textContent = c.title; chips.appendChild(a); });
    }).catch(function () { stats.hidden = true; });
  }
})();
