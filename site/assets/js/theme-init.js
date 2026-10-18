// Runs before first paint: applies the saved theme and marks that JavaScript is available.
(function () {
  var d = document.documentElement;
  d.classList.remove('no-js'); d.classList.add('js');
  try { var t = localStorage.getItem('pelorus-theme'); if (t === 'light' || t === 'dark') d.setAttribute('data-theme', t); } catch (e) { /* storage unavailable: follow the system theme */ }
})();
