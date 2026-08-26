// extract-manual.js - extract about/friends page content into build/pages/
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

function extractContent(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  let title = '';
  const tm = html.match(/<title>(.*?)<\/title>/);
  if (tm) title = tm[1].replace(/ - Geist$/, '').trim();
  let content = '';
  const cm = html.match(/<article class="md-text content">([\s\S]*?)<\/article>/);
  if (cm) content = cm[1].trim();
  return { title, content };
}

const about = extractContent(path.join(ROOT, 'about', 'index.html'));
const friends = extractContent(path.join(ROOT, 'friends', 'index.html'));
const frss = extractContent(path.join(ROOT, 'friends', 'rss', 'index.html'));

fs.mkdirSync(path.join(__dirname, 'pages'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'pages', 'about.html'), about.content, 'utf8');
fs.writeFileSync(path.join(__dirname, 'pages', 'friends.html'), friends.content, 'utf8');
fs.writeFileSync(path.join(__dirname, 'pages', 'friends-rss.html'), frss.content, 'utf8');

console.log('about title:', about.title, '| content len:', about.content.length);
console.log('friends title:', friends.title, '| content len:', friends.content.length);
