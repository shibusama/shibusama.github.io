// generate.js - build the pop-art static site from extracted data
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, 'data');
const THEME = path.join(__dirname, 'theme');
const OUT = path.join(__dirname, '..', 'public');

const posts = JSON.parse(fs.readFileSync(path.join(DATA, 'posts.json'), 'utf8'));
const wiki = JSON.parse(fs.readFileSync(path.join(DATA, 'wiki.json'), 'utf8'));
const css = fs.readFileSync(path.join(THEME, 'style.css'), 'utf8');
const mainJs = fs.readFileSync(path.join(THEME, 'main.js'), 'utf8');

// ---- load new posts from build/posts/*.json (written via the in-site editor) ----
const newPostsDir = path.join(__dirname, 'posts');
const newPosts = [];
if (fs.existsSync(newPostsDir)) {
  for (const f of fs.readdirSync(newPostsDir)) {
    if (!f.endsWith('.json')) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(newPostsDir, f), 'utf8'));
      if (j && j.title && j.content) {
        j.slug = path.basename(f, '.json');
        j.category = j.category || '未分类';
        j.tags = Array.isArray(j.tags) ? j.tags : [];
        newPosts.push(j);
      }
    } catch (e) { console.warn('skip bad post file:', f, e.message); }
  }
}
posts.push(...newPosts);

/* ---------- helpers ---------- */
function slugOf(oldPath) {
  // oldPath like /2002/12/26/哲学基础/01作为爱智慧的哲学/
  const parts = oldPath.split('/').filter(Boolean);
  return parts[parts.length - 1];
}
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// url map: decoded old path -> new relative path (from site root)
const urlMap = {};
const postUrls = {};
for (const p of posts) {
  if (!p.slug) p.slug = slugOf(p.oldPath);
  p.url = 'post/' + encodeURIComponent(p.slug) + '.html';
  urlMap[p.oldPath] = p.url;
  postUrls[p.oldPath] = p;
}
for (const w of wiki) {
  const slug = slugOf(w.oldPath);
  w.url = 'wiki/' + w.wikiSection + '-' + encodeURIComponent(slug) + '.html';
  w.slug = slug;
  urlMap[w.oldPath] = w.url;
}

// sort all posts by date desc (new posts included)
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

// rewrite internal links in content: href="/old/path/" -> new url
function rewriteLinks(html) {
  return html.replace(/href="(\/[^"]+)"/g, (m, href) => {
    try {
      const dec = decodeURI(href);
      if (urlMap[dec]) return 'href="' + urlMap[dec] + '"';
    } catch (e) { /* ignore */ }
    return m;
  });
}
for (const p of posts) p.content = rewriteLinks(p.content);
for (const w of wiki) w.content = rewriteLinks(w.content);

// categories & tags aggregation
const catMap = {};
for (const p of posts) {
  (catMap[p.category] = catMap[p.category] || []).push(p);
}
const tagMap = {};
for (const p of posts) {
  for (const t of p.tags) (tagMap[t] = tagMap[t] || []).push(p);
}

/* ---------- layout ---------- */
function layout(opts) {
  const { title, body, current, pre } = opts;
  const prePath = pre ? '' : ''; // root-level pages only; post/wiki pages pass pre='../'
  const pre2 = pre || '';
  const nav = [
    ['index.html', '首页', 'home'],
    ['archive.html', '归档', 'archives'],
    ['categories.html', '分类', 'cats'],
    ['tags.html', '标签', 'tags'],
    ['wiki.html', 'Wiki', 'wiki'],
    ['search.html', '搜索', 'search'],
    ['write.html', '写文章', 'write'],
    ['about.html', '关于', 'about'],
  ].map(([href, label, key]) =>
    `<a class="${current === key ? 'on' : ''}" href="${pre2}${href}">${label}</a>`
  ).join('\n    ');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · GEIST</title>
<meta name="description" content="GEIST — shibusama 的波普艺术风格博客">
<link rel="stylesheet" href="${pre2}css/style.css">
</head>
<body>
<header class="site-header">
  <div class="halftone-strip halftone-red"></div>
  <div class="logo-row">
    <span class="starburst">★</span>
    <a href="${pre2}index.html"><h1 class="logo">GEIST</h1></a>
    <span class="logo-sub">POP BLOG</span>
    <span class="starburst cyan">!</span>
  </div>
  <nav class="main-nav">
    ${nav}
    <button class="theme-toggle" onclick="toggleTheme()" title="切换明暗主题">LIGHT/DARK</button>
  </nav>
  <div class="halftone-strip halftone-yellow"></div>
</header>
<div class="marquee"><span>★ POP ART BLOG ★ 哲学 ★ 文本分析 ★ 生活 ★ 诗 ★ WIKI ★ LOVE &amp; CAREER ★ 站内搜索在「关于」旁？不，搜索在首页顶部 ★ POP! ★</span></div>
<main class="container">
${body}
</main>
<footer class="site-footer">
  <div class="dots">● ● ●</div>
  <p>© ${new Date().getFullYear()} shibusama · Pop Art Blog · <a href="https://github.com/shibusama">GitHub</a></p>
</footer>
<script src="${pre2}js/main.js"></script>
</body>
</html>`;
}

function postCard(p, pre) {
  return `<a class="post-card" href="${pre}${p.url}">
  <span class="cat-badge">${esc(p.category)}</span>
  <h2>${esc(p.title)}</h2>
  <div class="excerpt">${esc(stripHtml(p.content).slice(0, 90))}…</div>
  <div class="meta"><span class="date-badge">${esc(p.date)}</span><span>${p.tags.slice(0, 2).map(t => '#' + esc(t)).join(' ')}</span></div>
</a>`;
}
function stripHtml(h) {
  return h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ---------- pages ---------- */
function genIndex() {
  const per = 10;
  const pages = Math.ceil(posts.length / per);
  for (let i = 0; i < pages; i++) {
    const chunk = posts.slice(i * per, i * per + per);
    const cards = chunk.map(p => postCard(p, '')).join('\n');
    const pag = [];
    for (let n = 1; n <= pages; n++) {
      if (n === i + 1) pag.push(`<span class="cur">${n}</span>`);
      else pag.push(`<a href="${n === 1 ? 'index.html' : 'page' + n + '.html'}">${n}</a>`);
    }
    const hero = i === 0 ? `<div class="hero">
  <img class="hero-bg" src="assets/banner/nebula.jpg" alt="">
  <div class="halftone-overlay"></div>
  <span class="hero-deco l"><img src="assets/pop/starburst.svg" alt=""></span>
  <span class="hero-deco r"><img src="assets/pop/tomato.svg" alt=""></span>
  <div class="hero-inner">
    <div class="logo2">GEIST</div>
    <span class="hero-tagline">POP ART BLOG · EST. 2002</span>
  </div>
</div>` : '';
    const body = `${hero}<h1 class="page-title"><span class="starburst">★</span>LATEST POSTS</h1>
<div class="page-desc">共 ${posts.length} 篇 · 第 ${i + 1}/${pages} 页 · 波普能量加载中…</div>
<div class="post-grid">
${cards}
</div>
<div class="pagination">
${pag.join('\n')}
</div>`;
    const file = i === 0 ? 'index.html' : `page${i + 1}.html`;
    fs.writeFileSync(path.join(OUT, file), layout({ title: i === 0 ? '首页' : `第 ${i + 1} 页`, body, current: 'home' }), 'utf8');
  }
}

function genArchive() {
  const years = {};
  for (const p of posts) {
    const y = (p.date || '????').slice(0, 4);
    (years[y] = years[y] || []).push(p);
  }
  const blocks = Object.keys(years).sort().reverse().map(y => {
    const items = years[y].map(p =>
      `<li><a href="${p.url}"><span class="d">${esc(p.date)}</span><span>${esc(p.title)}</span></a></li>`
    ).join('\n');
    return `<section class="archive-year"><h2>${y}</h2><ul class="archive-list">\n${items}\n</ul></section>`;
  }).join('\n');
  const body = `<h1 class="page-title"><span class="starburst">★</span>ARCHIVE</h1>
<div class="page-desc">全部 ${posts.length} 篇文章，按年份归档</div>
${blocks}`;
  fs.writeFileSync(path.join(OUT, 'archive.html'), layout({ title: '归档', body, current: 'archives' }), 'utf8');
}

function genCategories() {
  const blocks = Object.keys(catMap).map(c => {
    const items = catMap[c].map(p => `<li><a href="${p.url}">${esc(p.title)}</a></li>`).join('\n');
    return `<section class="term-block"><h3>${esc(c)} (${catMap[c].length})</h3><ul>\n${items}\n</ul></section>`;
  }).join('\n');
  const body = `<h1 class="page-title"><span class="starburst">★</span>CATEGORIES</h1>
<div class="page-desc">按分类浏览文章</div>
${blocks}`;
  fs.writeFileSync(path.join(OUT, 'categories.html'), layout({ title: '分类', body, current: 'cats' }), 'utf8');
}

function genTags() {
  const blocks = Object.keys(tagMap).sort().map(t => {
    const items = tagMap[t].map(p => `<li><a href="${p.url}">${esc(p.title)}</a></li>`).join('\n');
    return `<section class="term-block"><h3># ${esc(t)} (${tagMap[t].length})</h3><ul>\n${items}\n</ul></section>`;
  }).join('\n');
  const body = `<h1 class="page-title"><span class="starburst">★</span>TAGS</h1>
<div class="page-desc">按标签浏览文章</div>
${blocks}`;
  fs.writeFileSync(path.join(OUT, 'tags.html'), layout({ title: '标签', body, current: 'tags' }), 'utf8');
}

function genPosts() {
  fs.mkdirSync(path.join(OUT, 'post'), { recursive: true });
  posts.forEach((p, idx) => {
    const prev = posts[idx - 1]; // newer
    const next = posts[idx + 1]; // older
    const pn = [];
    if (prev) pn.push(`<a href="../${prev.url}"><span class="dir">← 较新</span>${esc(prev.title)}</a>`);
    if (next) pn.push(`<a href="../${next.url}"><span class="dir">较旧 →</span>${esc(next.title)}</a>`);
    const tags = p.tags.map(t => `<a class="tag-chip" href="../tags.html">#${esc(t)}</a>`).join(' ');
    const body = `<article class="article">
  <div class="article-head">
    <span class="cat-badge" style="border:2px solid #111;padding:2px 10px;font-family:var(--font-mono);font-weight:bold">${esc(p.category)}</span>
    <h1>${esc(p.title)}</h1>
    <div class="meta-line">
      <span class="date-badge" style="border:2px solid #111;padding:0 8px;background:var(--pop-yellow)">${esc(p.date)}</span>
      ${tags}
    </div>
  </div>
  <div class="md">
${p.content}
  </div>
</article>
<div class="prevnext">
${pn.join('\n')}
</div>
<div class="page-desc"><a href="../archive.html">← 返回归档</a></div>`;
    fs.writeFileSync(path.join(OUT, decodeURIComponent(p.url)), layout({ title: p.title, body, current: 'home', pre: '../' }), 'utf8');
  });
}

function genWiki() {
  fs.mkdirSync(path.join(OUT, 'wiki'), { recursive: true });
  // wiki index
  const sections = {};
  for (const w of wiki) (sections[w.wikiSection] = sections[w.wikiSection] || []).push(w);
  const secNames = { career: 'CAREER · 职业', love: 'LOVE · 恋爱建设' };
  const blocks = Object.keys(sections).map(s => {
    const cards = sections[s].map(w =>
      `<a class="wiki-card" href="${w.url}"><div class="num">${esc(w.wikiSection)}</div><h3>${esc(w.title)}</h3></a>`
    ).join('\n');
    return `<div><h2 class="wiki-section-title">${secNames[s] || s}</h2><div class="wiki-grid">\n${cards}\n</div></div>`;
  }).join('\n');
  const body = `<h1 class="page-title"><span class="starburst">★</span>WIKI</h1>
<div class="page-desc">知识库 · 持续更新中</div>
${blocks}`;
  fs.writeFileSync(path.join(OUT, 'wiki.html'), layout({ title: 'Wiki', body, current: 'wiki' }), 'utf8');
  // wiki pages
  for (const w of wiki) {
    const body = `<article class="article">
  <div class="article-head">
    <span class="cat-badge" style="border:2px solid #111;padding:2px 10px;font-family:var(--font-mono);font-weight:bold">WIKI · ${esc(w.wikiSection)}</span>
    <h1>${esc(w.title)}</h1>
  </div>
  <div class="md">
${w.content}
  </div>
</article>
<div class="page-desc"><a href="../wiki.html">← 返回 Wiki</a></div>`;
    fs.writeFileSync(path.join(OUT, decodeURIComponent(w.url)), layout({ title: w.title, body, current: 'wiki', pre: '../' }), 'utf8');
  }
}

function genSearch() {
  const body = `<h1 class="page-title"><span class="starburst">★</span>SEARCH</h1>
<div class="page-desc">站内搜索 · 输入关键词回车</div>
<div class="search-box">
  <input id="q" type="text" placeholder="搜点什么… 比如：哲学 / 恋爱 / 修辞" autofocus>
  <button class="go" onclick="doSearch()">POP!</button>
</div>
<div id="results"></div>`;
  fs.writeFileSync(path.join(OUT, 'search.html'), layout({ title: '搜索', body, current: 'search' }), 'utf8');
}

function genWrite() {
  const editorJs = fs.readFileSync(path.join(THEME, 'editor.js'), 'utf8');
  fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'js', 'editor.js'), editorJs, 'utf8');
  const cats = Object.keys(catMap);
  const catOpts = cats.map(c => `<option>${esc(c)}</option>`).join('\n') + '\n<option value="__custom">自定义…</option>';
  const body = `<h1 class="page-title"><span class="starburst">★</span>WRITE</h1>
<div class="page-desc">在浏览器里写文章 → 发布到 GitHub → Actions 自动构建部署（约 1-2 分钟）</div>
<div class="editor-box">
  <div class="editor-field"><label>标题</label><input id="e-title" placeholder="文章标题"></div>
  <div class="editor-row">
    <div class="editor-field"><label>日期</label><input id="e-date" type="date"></div>
    <div class="editor-field"><label>分类</label>
      <select id="e-cat">
${catOpts}
      </select>
      <input id="e-cat-custom" placeholder="自定义分类（选了自定义时生效）" style="margin-top:8px">
    </div>
    <div class="editor-field"><label>标签（逗号分隔）</label><input id="e-tags" placeholder="哲学, 恋爱, 生活"></div>
  </div>
  <div class="editor-field"><label>正文（支持 HTML）</label><textarea id="e-content" rows="16" placeholder="<p>在这里写正文…</p>"></textarea></div>
  <div class="editor-actions">
    <button class="go" onclick="previewArticle()">👁 预览</button>
    <button class="go" onclick="saveDraft()">💾 存草稿</button>
    <button class="go" onclick="loadDraft()">📂 读草稿</button>
    <button class="go publish" onclick="publishArticle()">🚀 发布到 GitHub</button>
  </div>
  <div id="e-status"></div>
</div>
<div id="e-preview" class="article" style="display:none"></div>
<div class="editor-config">
  <h3>⚙ GitHub 配置</h3>
  <input id="e-owner" placeholder="owner"><input id="e-repo" placeholder="repo">
  <input id="e-token" type="password" placeholder="Personal Access Token" style="min-width:280px">
  <button class="go" onclick="saveConfig()">保存配置</button>
  <div class="hint">Token 只需一次：GitHub → Settings → Developer settings → Personal access tokens → 新建（勾选 repo 或 contents:write 权限）。仅保存在本浏览器 localStorage，发布时直接调用 api.github.com。仓库默认 shibusama / shibusama.github.io。</div>
</div>`;
  const html = layout({ title: '写文章', body, current: 'write' });
  fs.writeFileSync(path.join(OUT, 'write.html'), html.replace('</body>', '<script src="js/editor.js"></script>\n</body>'), 'utf8');
}

function genData() {
  const idx = [...posts, ...wiki].map(p => ({
    t: p.title, u: p.url, d: p.date || '', c: p.category || (p.wikiSection || ''),
    tags: p.tags || [], body: stripHtml(p.content).slice(0, 600)
  }));
  const js = 'window.SEARCH_INDEX = ' + JSON.stringify(idx) + ';';
  fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'js', 'search-index.js'), js, 'utf8');
  fs.writeFileSync(path.join(OUT, 'js', 'main.js'), mainJs, 'utf8');
  fs.mkdirSync(path.join(OUT, 'css'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'css', 'style.css'), css, 'utf8');
}

function genManual() {
  const pagesDir = path.join(__dirname, 'pages');
  const readPage = (name) => {
    try { return fs.readFileSync(path.join(pagesDir, name), 'utf8'); } catch (e) { return ''; }
  };
  // about: extract plain paragraphs from migrated content
  const aboutRaw = readPage('about.html');
  const paras = [];
  const pm = aboutRaw.match(/<p>([\s\S]*?)<\/p>/g) || [];
  for (const p of pm) {
    const txt = p.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (txt) paras.push(txt);
  }
  const aboutText = paras.map(t => `<p>${esc(t)}</p>`).join('\n');
  const aboutBody = `<div class="about-hero">
  <img class="about-bg" src="assets/banner/nebula.jpg" alt="">
  <div class="halftone-overlay"></div>
  <div class="hero-inner"><h1>ABOUT ME</h1></div>
</div>
<div class="avatar-row">
  <div class="avatar-box"><img src="assets/icon.svg" alt="avatar"><span class="avatar-sticker">HELLO!</span></div>
  <div class="avatar-name">
    <div class="who">shibusama</div>
    <div class="role">POP BLOG · EST. 2002 · 哲学 / 文本 / 生活 / 诗</div>
  </div>
</div>
<div class="about-facts">
  <div class="fact-card"><span class="ico">📛</span><div><span class="k">站名</span><span class="v">GEIST</span></div></div>
  <div class="fact-card"><span class="ico">👤</span><div><span class="k">作者</span><span class="v">shibusama</span></div></div>
  <div class="fact-card"><span class="ico">📅</span><div><span class="k">建站</span><span class="v">2002</span></div></div>
  <div class="fact-card"><span class="ico">🎨</span><div><span class="k">风格</span><span class="v">美式波普</span></div></div>
  <div class="fact-card"><span class="ico">📝</span><div><span class="k">文章</span><span class="v">${posts.length} 篇</span></div></div>
  <div class="fact-card"><span class="ico">📚</span><div><span class="k">Wiki</span><span class="v">${wiki.length} 篇</span></div></div>
</div>
<article class="article">
  <div class="article-head"><h1 style="margin:0">关于本站</h1></div>
  <div class="md">
${aboutText}
  </div>
</article>
<div class="pop-deco-row">
  <img src="assets/pop/tomato.svg" alt="tomato"><img src="assets/pop/bubble.svg" alt="bubble"><img src="assets/pop/bolt.svg" alt="bolt"><img src="assets/pop/lips.svg" alt="lips"><img src="assets/pop/dots.svg" alt="dots">
</div>`;
  fs.writeFileSync(path.join(OUT, 'about.html'), layout({ title: '关于', body: aboutBody, current: 'about' }), 'utf8');
  // remove friends page if stale
  const friendsPath = path.join(OUT, 'friends.html');
  if (fs.existsSync(friendsPath)) fs.unlinkSync(friendsPath);
  // 404
  const errBody = `<div class="err-wrap">
  <div class="starburst" style="width:70px;height:70px;font-size:30px">!</div>
  <div class="err-code">404</div>
  <div class="err-msg">POP! 页面走丢了</div>
  <div class="page-desc">这个地址不存在——可能被波普能量蒸发了。</div>
  <div class="pagination"><a href="index.html">← 回首页</a><a href="archive.html">看归档</a><a href="search.html">搜索</a></div>
</div>`;
  fs.writeFileSync(path.join(OUT, '404.html'), layout({ title: '404', body: errBody, current: '' }), 'utf8');
}

/* ---------- run ---------- */
fs.mkdirSync(OUT, { recursive: true });
// clean old generated subdirs (file names change between encodings)
for (const sub of ['post', 'wiki']) {
  const d = path.join(OUT, sub);
  if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
}
genIndex();
genArchive();
genCategories();
genTags();
genPosts();
genWiki();
genSearch();
genWrite();
genManual();
genData();
console.log('Generated into public/');
console.log('posts:', posts.length, '| wiki:', wiki.length);
console.log('categories:', Object.keys(catMap).join(', '));
console.log('tags:', Object.keys(tagMap).join(', '));
