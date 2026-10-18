// The Toolbox directory: search, filter, sort and export a static JSON file. No network except that one file.
(function () {
  'use strict';
  var PAGE = 48;
  var $ = function (id) { return document.getElementById(id); };
  var els = { q: $('q'), cats: $('cats'), lic: $('lic'), lang: $('lang'), stars: $('stars'), sort: $('sort'), cur: $('cur'), arc: $('arc'), list: $('list'), count: $('count'), empty: $('empty'), more: $('more'), csv: $('csv'), method: $('method'), reset: $('reset'), reset2: $('reset2') };
  var JS_FAMILY = ['JavaScript', 'TypeScript', 'Vue', 'Svelte', 'CSS', 'SCSS', 'HTML', 'Astro', 'MDX', 'CoffeeScript'];
  var items, osi, cats, state, shown = 0, filtered = [];
  var DEFAULTS = { q: '', c: '', osi: '', cur: '', lang: '', stars: '0', sort: 'stars', arc: '' };

  function fmtStars(n) { return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, '') + 'k' : String(n); }
  function monthsAgo(ym) { var p = ym.split('-'); var d = new Date(); return (d.getFullYear() - +p[0]) * 12 + (d.getMonth() + 1 - +p[1]); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  // ---- state <-> URL hash
  function readHash() {
    var s = Object.assign({}, DEFAULTS);
    location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      if (i < 0) return;
      var k = decodeURIComponent(kv.slice(0, i)), v = decodeURIComponent(kv.slice(i + 1));
      if (Object.prototype.hasOwnProperty.call(s, k)) s[k] = v;
    });
    return s;
  }
  function writeHash() {
    var parts = [];
    Object.keys(DEFAULTS).forEach(function (k) { if (state[k] !== DEFAULTS[k]) parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(state[k])); });
    var h = parts.length ? '#' + parts.join('&') : '';
    if (h !== location.hash) history.replaceState(null, '', location.pathname + location.search + h);
  }

  // ---- filtering
  function matches(it, s, ignoreCat) {
    var n = it[0], stars = it[1], lic = it[2], lang = it[4], arch = it[5], cat = it[6], cur = it[7], desc = it[8];
    if (!s.arc && arch) return false;
    if (!ignoreCat && s.c && cat !== s.c) return false;
    if (s.osi && !osi.has(lic)) return false;
    if (s.cur && !cur) return false;
    if (+s.stars && stars < +s.stars) return false;
    if (s.lang) {
      if (s.lang === '__js') { if (JS_FAMILY.indexOf(lang) < 0) return false; } else if (lang !== s.lang) return false;
    }
    if (s.q) {
      var hay = (n + ' ' + desc).toLowerCase();
      var terms = s.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) < 0) return false;
    }
    return true;
  }
  function sortFn(s) {
    if (s.sort === 'name') return function (a, b) { return a[0].toLowerCase() < b[0].toLowerCase() ? -1 : 1; };
    if (s.sort === 'pushed') return function (a, b) { return a[3] < b[3] ? 1 : a[3] > b[3] ? -1 : b[1] - a[1]; };
    return function (a, b) { return b[7] - a[7] || b[1] - a[1]; }; // hand-picked first, then stars
  }

  // ---- rendering
  function card(it) {
    var n = it[0], parts = n.split('/'), art = el('article', 'tool');
    var top = el('div', 'top');
    var a = el('a', 'name'); a.href = 'https://github.com/' + n; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.appendChild(el('small', null, parts[0] + ' / ')); a.appendChild(document.createTextNode(parts[1]));
    top.appendChild(a); top.appendChild(el('span', 'stars', '★ ' + fmtStars(it[1])));
    art.appendChild(top);
    art.appendChild(el('p', 'd', it[8] || 'No description.'));
    var meta = el('div', 'meta');
    var isOsi = osi.has(it[2]);
    meta.appendChild(el('span', 'tag ' + (isOsi ? 'osi' : 'chk'), isOsi ? it[2].toUpperCase() : 'check licence'));
    if (it[4]) meta.appendChild(el('span', 'tag', it[4]));
    if (it[7]) meta.appendChild(el('span', 'tag cur', 'hand-picked'));
    if (it[5]) meta.appendChild(el('span', 'tag arc', 'archived'));
    else if (it[3] && monthsAgo(it[3]) > 18) meta.appendChild(el('span', 'tag arc', 'quiet since ' + it[3]));
    else if (it[3]) meta.appendChild(el('span', 'tag', 'pushed ' + it[3]));
    var cb = el('button', 'copy-btn', 'copy'); cb.type = 'button'; cb.setAttribute('aria-label', 'Copy ' + n);
    cb.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText(n).then(function () { cb.textContent = 'copied'; setTimeout(function () { cb.textContent = 'copy'; }, 1200); }, function () {});
    });
    meta.appendChild(cb);
    art.appendChild(meta);
    return art;
  }
  function renderMore() {
    var end = Math.min(filtered.length, shown + PAGE), frag = document.createDocumentFragment();
    for (var i = shown; i < end; i++) frag.appendChild(card(filtered[i]));
    els.list.appendChild(frag); shown = end;
    els.more.hidden = shown >= filtered.length;
  }
  function renderCats() {
    els.cats.textContent = '';
    var counts = {}, total = 0;
    items.forEach(function (it) { if (matches(it, state, true)) { counts[it[6]] = (counts[it[6]] || 0) + 1; total++; } });
    function btn(id, title, n) {
      var b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', String(state.c === id)); b.dataset.c = id;
      b.appendChild(el('span', null, title)); b.appendChild(el('span', 'n', String(n))); els.cats.appendChild(b);
    }
    btn('', 'All categories', total);
    cats.forEach(function (c) { btn(c.id, c.title, counts[c.id] || 0); });
  }
  function apply(keepHash) {
    filtered = items.filter(function (it) { return matches(it, state, false); }).sort(sortFn(state));
    els.list.textContent = ''; shown = 0; renderMore(); renderCats();
    var curN = filtered.filter(function (r) { return r[7]; }).length;
    els.count.textContent = '';
    els.count.appendChild(el('b', null, filtered.length.toLocaleString('en-US')));
    els.count.appendChild(document.createTextNode(' of ' + items.length.toLocaleString('en-US') + ' tools' + (curN ? ' · ' + curN + ' hand-picked' : '')));
    els.empty.hidden = filtered.length > 0; els.csv.hidden = filtered.length === 0;
    if (!keepHash) writeHash();
  }
  function syncControls() {
    els.q.value = state.q; els.lang.value = state.lang; els.stars.value = state.stars; els.sort.value = state.sort;
    els.cur.checked = !!state.cur; els.arc.checked = !!state.arc;
    els.lic.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === state.osi)); });
  }

  // ---- CSV export of the current results
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function exportCsv() {
    var rows = [['repository', 'url', 'stars', 'licence', 'osi_approved', 'last_push', 'language', 'archived', 'hand_picked', 'category', 'description']];
    filtered.forEach(function (r) { rows.push([r[0], 'https://github.com/' + r[0], r[1], r[2], osi.has(r[2]) ? 'yes' : 'no', r[3], r[4], r[5] ? 'yes' : 'no', r[7] ? 'yes' : 'no', r[6], r[8]]); });
    var blob = new Blob([rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'pelorus-toolbox.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  // ---- boot
  fetch('../assets/data/toolbox.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (j) {
    items = j.items; osi = new Set(j.osi); cats = j.categories;
    els.method.textContent = j.meta.method + ' Data generated ' + j.meta.generated + '.';
    var langs = {};
    items.forEach(function (r) { if (r[4]) langs[r[4]] = (langs[r[4]] || 0) + 1; });
    els.lang.appendChild(new Option('Any language', ''));
    els.lang.appendChild(new Option('JavaScript family (JS, TS, Vue, Svelte, CSS, HTML…)', '__js'));
    Object.keys(langs).sort(function (a, b) { return langs[b] - langs[a]; }).slice(0, 24).forEach(function (l) { els.lang.appendChild(new Option(l + ' (' + langs[l] + ')', l)); });
    state = readHash(); syncControls(); apply(true);

    var t = 0;
    els.q.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { state.q = els.q.value.trim(); apply(); }, 120); });
    els.cats.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.c = b.dataset.c; apply(); });
    els.lic.addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; state.osi = b.dataset.v; syncControls(); apply(); });
    els.lang.addEventListener('change', function () { state.lang = els.lang.value; apply(); });
    els.stars.addEventListener('change', function () { state.stars = els.stars.value; apply(); });
    els.sort.addEventListener('change', function () { state.sort = els.sort.value; apply(); });
    els.cur.addEventListener('change', function () { state.cur = els.cur.checked ? '1' : ''; apply(); });
    els.arc.addEventListener('change', function () { state.arc = els.arc.checked ? '1' : ''; apply(); });
    function reset() { state = Object.assign({}, DEFAULTS); syncControls(); apply(); }
    els.reset.addEventListener('click', reset); els.reset2.addEventListener('click', reset);
    els.more.addEventListener('click', renderMore); els.csv.addEventListener('click', exportCsv);
    $('filters').addEventListener('submit', function (e) { e.preventDefault(); });
    addEventListener('hashchange', function () { state = readHash(); syncControls(); apply(true); });
  }).catch(function () { els.count.textContent = 'The tool list could not be loaded. Try reloading, or read assets/data/toolbox.json directly.'; });
})();
