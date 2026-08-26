/* GEIST in-site editor — write & publish via GitHub API */
(function () {
  'use strict';

  const API = 'https://api.github.com';
  const LS = {
    token: 'geist_gh_token',
    draft: 'geist_draft',
    owner: 'geist_owner',
    repo: 'geist_repo'
  };

  function $(id) { return document.getElementById(id); }
  function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function slugify(title) {
    return String(title).trim().replace(/[\\/:*?"<>|\s]+/g, '_') || ('post_' + Date.now());
  }
  function b64(s) {
    return btoa(unescape(encodeURIComponent(s)));
  }
  function setStatus(msg, ok) {
    const el = $('e-status');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    el.style.background = ok === false ? 'var(--pop-red)' : (ok ? 'var(--pop-green)' : 'var(--pop-yellow)');
    el.style.color = ok === false || ok ? '#fff' : '#111';
  }

  function saveConfig() {
    localStorage.setItem(LS.token, ($('e-token') || {}).value || '');
    localStorage.setItem(LS.owner, ($('e-owner') || {}).value || 'shibusama');
    localStorage.setItem(LS.repo, ($('e-repo') || {}).value || 'shibusama.github.io');
    setStatus('配置已保存到本浏览器', true);
  }
  function loadConfig() {
    if ($('e-token')) $('e-token').value = localStorage.getItem(LS.token) || '';
    if ($('e-owner')) $('e-owner').value = localStorage.getItem(LS.owner) || 'shibusama';
    if ($('e-repo')) $('e-repo').value = localStorage.getItem(LS.repo) || 'shibusama.github.io';
  }

  function collect() {
    const title = ($('e-title') || {}).value || '';
    const date = ($('e-date') || {}).value || today();
    let category = ($('e-cat') || {}).value || '未分类';
    if (category === '__custom') category = (($('e-cat-custom') || {}).value || '未分类').trim();
    const tags = (($('e-tags') || {}).value || '').split(/[,，]/).map(t => t.trim()).filter(Boolean);
    const content = ($('e-content') || {}).value || '';
    return { title, date, category, tags, content };
  }

  window.saveDraft = function () {
    localStorage.setItem(LS.draft, JSON.stringify(collect()));
    setStatus('草稿已保存到本浏览器', true);
  };
  window.loadDraft = function () {
    try {
      const d = JSON.parse(localStorage.getItem(LS.draft) || 'null');
      if (!d) { setStatus('没有草稿', false); return; }
      if ($('e-title')) $('e-title').value = d.title || '';
      if ($('e-date')) $('e-date').value = d.date || today();
      if ($('e-cat')) $('e-cat').value = ['哲学', '文本分析', '生活', '诗'].includes(d.category) ? d.category : '__custom';
      if ($('e-cat-custom')) $('e-cat-custom').value = ['哲学', '文本分析', '生活', '诗'].includes(d.category) ? '' : (d.category || '');
      if ($('e-tags')) $('e-tags').value = (d.tags || []).join(', ');
      if ($('e-content')) $('e-content').value = d.content || '';
      setStatus('草稿已载入', true);
    } catch (e) { setStatus('草稿读取失败', false); }
  };

  window.previewArticle = function () {
    const d = collect();
    const box = $('e-preview');
    if (!box) return;
    if (!d.content) { setStatus('正文为空，无法预览', false); return; }
    box.style.display = 'block';
    box.innerHTML = '<div class="article-head"><span class="cat-badge" style="border:2px solid #111;padding:2px 10px;font-family:var(--font-mono);font-weight:bold">' + esc(d.category) + '</span><h1>' + esc(d.title) + '</h1><div class="meta-line"><span class="date-badge" style="border:2px solid #111;padding:0 8px;background:var(--pop-yellow)">' + esc(d.date) + '</span></div></div><div class="md">' + d.content + '</div>';
    box.scrollIntoView({ behavior: 'smooth' });
  };

  window.publishArticle = function () {
    const d = collect();
    if (!d.title) { setStatus('请填写标题', false); return; }
    if (!d.content) { setStatus('请填写正文', false); return; }
    const token = localStorage.getItem(LS.token);
    const owner = (($('e-owner') || {}).value || 'shibusama').trim();
    const repo = (($('e-repo') || {}).value || 'shibusama.github.io').trim();
    if (!token) { setStatus('请先在下方填写并保存 GitHub Token', false); return; }

    const slug = slugify(d.title);
    const filePath = 'build/posts/' + slug + '.json';
    const body = JSON.stringify({ title: d.title, date: d.date, category: d.category, tags: d.tags, content: d.content });

    setStatus('正在提交到 GitHub…');

    // 1. check if file exists (need sha to update)
    fetch(API + '/repos/' + owner + '/' + repo + '/contents/' + encodeURIComponent(filePath), {
      headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' }
    }).then(r => r.json()).then(existing => {
      const payload = {
        message: 'post: ' + d.title,
        content: b64(body),
        branch: 'main'
      };
      if (existing && existing.sha) payload.sha = existing.sha;
      // 2. create/update file
      return fetch(API + '/repos/' + owner + '/' + repo + '/contents/' + encodeURIComponent(filePath), {
        method: 'PUT',
        headers: { Authorization: 'token ' + token, Accept: 'application/vnd.github+json' },
        body: JSON.stringify(payload)
      });
    }).then(r => {
      if (!r.ok) {
        return r.json().then(e => { throw new Error((e && e.message) || r.status); });
      }
      return r.json();
    }).then(data => {
      setStatus('✅ 发布成功！文件已提交，GitHub Actions 正在自动构建部署（约 1-2 分钟）。' + (data.commit ? ' commit: ' + data.commit.sha.slice(0, 7) : ''), true);
      localStorage.removeItem(LS.draft);
    }).catch(err => {
      setStatus('❌ 发布失败：' + err.message, false);
    });
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!$('e-date')) $('e-date').value = today();
    loadConfig();
  });
})();
