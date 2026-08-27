/* GEIST pop-art site main.js */
(function () {
  'use strict';

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('geist-theme', t); } catch (e) { /* ignore */ }
  }
  window.toggleTheme = function () {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  };
  (function initTheme() {
    let t = 'light';
    try { t = localStorage.getItem('geist-theme') || 'light'; } catch (e) { /* ignore */ }
    applyTheme(t);
  })();

  /* ---------- search ---------- */
  window.doSearch = function () {
    const qEl = document.getElementById('q');
    const resEl = document.getElementById('results');
    if (!qEl || !resEl) return;
    const q = qEl.value.trim().toLowerCase();
    if (!q) { resEl.innerHTML = ''; return; }
    if (!window.SEARCH_INDEX) {
      // load index lazily
      var s = document.createElement('script');
      s.src = 'js/search-index.js';
      s.onload = function () { doSearch(); };
      document.head.appendChild(s);
      return;
    }
    const hits = window.SEARCH_INDEX.filter(it =>
      it.t.toLowerCase().includes(q) ||
      (it.c || '').toLowerCase().includes(q) ||
      (it.body || '').toLowerCase().includes(q) ||
      (it.tags || []).some(t => t.toLowerCase().includes(q))
    );
    if (hits.length === 0) {
      resEl.innerHTML = '<div class="search-empty">没有找到匹配的内容！POP!</div>';
      return;
    }
    resEl.innerHTML = hits.slice(0, 30).map(it => {
      const i = (it.body || '').toLowerCase().indexOf(q);
      let snip = it.body || '';
      if (i > 0) snip = '…' + snip.slice(Math.max(0, i - 20), i + 80) + '…';
      return '<div class="search-result-item"><h3><a href="' + it.u + '">' + escHtml(it.t) + '</a></h3>' +
        '<div class="meta-line" style="font-family:var(--font-mono);font-size:12px;margin-top:4px">' +
        (it.d ? '<span class="date-badge" style="border:2px solid #111;padding:0 6px;background:var(--pop-yellow)">' + it.d + '</span>' : '') +
        ' <span class="cat-badge" style="border:2px solid #111;padding:0 6px">' + escHtml(it.c) + '</span></div>' +
        '<div class="snip">' + escHtml(snip) + '</div></div>';
    }).join('');
  };
  function escHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  document.addEventListener('DOMContentLoaded', function () {
    const qEl = document.getElementById('q');
    if (qEl) qEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(); });
    // prefill from ?q=
    const m = location.search.match(/[?&]q=([^&]+)/);
    if (m && qEl) { qEl.value = decodeURIComponent(m[1]); doSearch(); }
  });
})();
