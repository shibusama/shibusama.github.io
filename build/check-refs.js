// check-refs.js - inspect local references in extracted content
const fs = require('fs');
const posts = require('../build/data/posts.json');
const wiki = require('../build/data/wiki.json');
const all = [...posts, ...wiki];
const paths = new Set();
let extImg = 0;
for (const p of all) {
  const re = /(?:src|href)="([^"]+)"/g;
  let m;
  while ((m = re.exec(p.content)) !== null) {
    const u = m[1];
    if (u.startsWith('/')) paths.add(u);
    else if (u.startsWith('http') && /\.(png|jpe?g|gif|webp|svg)/.test(u)) extImg++;
  }
}
console.log('local path refs:', paths.size);
console.log('external image refs:', extImg);
console.log('--- sample local paths ---');
[...paths].slice(0, 25).forEach(p => console.log(' ', p));
