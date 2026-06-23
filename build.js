// Build deliverable: inline all assets/*.svg from the source into a self-contained HTML.
// Usage: node build.js
const fs = require('fs');
const path = require('path');
const SRC = 'inspector.src.html';
const OUT = 'inspector.html';
let html = fs.readFileSync(SRC, 'utf8');
const cache = {};
html = html.replace(/src="assets\/([^"]+\.svg)"/g, (m, name) => {
  if (!cache[name]) {
    const svg = fs.readFileSync(path.join('assets', name), 'utf8');
    cache[name] = 'data:image/svg+xml;base64,' + Buffer.from(svg, 'utf8').toString('base64');
  }
  return 'src="' + cache[name] + '"';
});
fs.writeFileSync(OUT, html);
console.log('built ' + OUT + ' — inlined ' + Object.keys(cache).length + ' svgs, ' + html.length + ' bytes');
