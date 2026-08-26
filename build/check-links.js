// check-links.js - verify internal links in generated public/ site
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');

const files = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) files.push(full);
  }
}
walk(ROOT);

let checked = 0;
const broken = [];
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const base = path.dirname(path.relative(ROOT, f));
  const re = /(?:href|src)="([^"#]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const u = m[1];
    if (/^(https?:|mailto:|#|data:)/.test(u)) continue;
    if (u.startsWith('/')) continue; // absolute, skip (not used in this build)
    checked++;
    let decoded;
    try { decoded = decodeURIComponent(u); } catch (e) { decoded = u; }
    const resolved = path.normalize(path.join(ROOT, base, decoded));
    if (!fs.existsSync(resolved)) {
      broken.push(path.relative(ROOT, f) + ' -> ' + u);
    }
  }
}
console.log('internal links checked:', checked);
if (broken.length === 0) console.log('ALL LINKS OK ✓');
else { console.log('broken:', broken.length); broken.forEach(b => console.log('  ', b)); }
