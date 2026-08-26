// extract.js - extract content from old Hexo site into posts.json + wiki.json
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..'); // site root (parent of build/)
const OUT = path.join(__dirname, 'data');

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function extractArticle(htmlPath) {
  const html = readText(htmlPath);
  // title
  let title = '';
  const tm = html.match(/<title>(.*?)<\/title>/);
  if (tm) title = tm[1].replace(/ - Geist$/, '').trim();
  // date
  let date = '';
  const dtm = html.match(/<time datetime="([^"]+)"/);
  if (dtm) date = dtm[1].replace('T', ' ').replace(/\.\d+Z$/, '').slice(0, 10);
  // content
  let content = '';
  const cm = html.match(/<article class="md-text content">([\s\S]*?)<\/article>/);
  if (cm) content = cm[1].trim();
  // old path for link rewrite
  const oldPath = '/' + htmlPath.replace(/\\/g, '/').replace(/^\.?\//, '').replace(/index\.html$/, '');
  return { title, date, content, oldPath, htmlPath };
}

// ---- collect posts ----
const posts = [];
const postDirs = [
  '2002', '2012'
];
for (const yr of postDirs) {
  const base = path.join(ROOT, yr);
  if (!fs.existsSync(base)) continue;
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name === 'index.html') {
        const a = extractArticle(full);
        if (a.content) posts.push(a);
      }
    }
  };
  walk(base);
}

// ---- collect wiki ----
const wiki = [];
for (const sub of ['career', 'love']) {
  const base = path.join(ROOT, 'wiki', sub);
  if (!fs.existsSync(base)) continue;
  for (const d of fs.readdirSync(base, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const idx = path.join(base, d.name, 'index.html');
    if (fs.existsSync(idx)) {
      const a = extractArticle(idx);
      if (a.content) {
        a.wikiSection = sub;
        a.title = a.title.replace(/^(?:career|love|stellar|Love|Stellar)：/, '').trim();
        wiki.push(a);
      }
    }
  }
}

// ---- categorize + tag heuristics ----
function categorize(p) {
  const p2 = p.oldPath;
  if (p2.includes('/哲学基础/')) return '哲学';
  if (p2.includes('/文本分析/')) return '文本分析';
  if (p2.includes('/强迫症福音/')) return '生活';
  if (p2.includes('/诗/')) return '诗';
  return '未分类';
}
function tagify(p) {
  const tags = new Set([categorize(p)]);
  const t = p.title + ' ' + p.content;
  const map = [
    ['哲学', '哲学'], ['爱智慧', '哲学'],
    ['修辞', '修辞'], ['朋友圈', '社交'], ['昵称', '社交'], ['官宣', '恋爱'],
    ['dating', '恋爱'], ['约会', '恋爱'], ['恋爱', '恋爱'], ['爱情', '恋爱'], ['浪漫', '恋爱'],
    ['梦境', '梦境'], ['电影', '电影'], ['美学', '美学'],
    ['上海', '上海'], ['旅行', '旅行'], ['旅游', '旅行'], ['景点', '旅行'],
    ['吃', '美食'], ['美食', '美食'], ['菜', '美食'],
    ['穿搭', '穿搭'], ['生理', '生理'], ['心理', '心理'], ['聊天', '沟通'], ['行为', '恋爱'],
    ['诗', '诗'], ['革命', '诗']
  ];
  for (const [kw, tag] of map) { if (t.includes(kw)) tags.add(tag); }
  return [...tags];
}

for (const p of posts) { p.category = categorize(p); p.tags = tagify(p); }
for (const w of wiki) {
  w.category = w.wikiSection === 'career' ? '自由职业' : '恋爱';
  w.tags = w.wikiSection === 'career' ? ['职业', '自由职业'] : ['恋爱', '恋爱建设'];
}

// ---- sort posts by date desc, keep original date ----
posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
// keep a stable order id (per original path year-month) for grouping
posts.forEach((p, i) => { p.id = i; });

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'posts.json'), JSON.stringify(posts, null, 1), 'utf8');
fs.writeFileSync(path.join(OUT, 'wiki.json'), JSON.stringify(wiki, null, 1), 'utf8');

console.log('posts:', posts.length, 'wiki:', wiki.length);
posts.slice(0, 5).forEach(p => console.log('  ', p.date, '|', p.category, '|', p.title, '|', p.tags.join(',')));
wiki.slice(0, 3).forEach(p => console.log('  WIKI', p.wikiSection, '|', p.title));
