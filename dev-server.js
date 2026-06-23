// Live-reload dev server for the standalone ENCY Inspector.
// Serves inspector.src.html at "/" with assets resolved from ./assets,
// and auto-reloads the browser whenever the src or any asset changes.
// Run:  node dev-server.js   →   open http://localhost:5579
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = __dirname, PORT = 5579, SRC = 'inspector.src.html';
const TYPES = {'.html':'text/html','.svg':'image/svg+xml','.js':'text/javascript',
  '.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.json':'application/json'};
const RELOAD = '<script>(function(){try{var s=new EventSource("/__reload");' +
  's.onmessage=function(){location.reload();};}catch(e){}})();</script>';
var clients = [];

http.createServer(function(req, res){
  var url = req.url.split('?')[0];
  if (url === '/__reload') {
    res.writeHead(200, {'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});
    res.write('retry: 500\n\n');
    clients.push(res);
    req.on('close', function(){ var i = clients.indexOf(res); if (i >= 0) clients.splice(i, 1); });
    return;
  }
  var p = decodeURIComponent(url);
  if (p === '/') p = '/' + SRC;
  var fp = path.join(ROOT, p);
  fs.readFile(fp, function(err, buf){
    if (err) { res.writeHead(404); res.end('not found: ' + p); return; }
    var ext = path.extname(fp), body = buf;
    if (ext === '.html') body = buf.toString('utf8').replace('</body>', RELOAD + '</body>');
    res.writeHead(200, {'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(body);
  });
}).listen(PORT, function(){ console.log('ENCY Inspector dev server: http://localhost:' + PORT + '  (live reload on)'); });

// Watch src + assets; debounce; push reload. Ignore the built deliverable.
var timer = null;
fs.watch(ROOT, {recursive: true}, function(ev, file){
  if (!file) return;
  file = file.replace(/\\/g, '/');
  if (!/\.(html|svg|css|js)$/.test(file)) return;
  if (/(^|\/)inspector\.html$/.test(file)) return; // built output, not a source
  if (/(^|\/)dev-server\.js$/.test(file)) return;
  clearTimeout(timer);
  timer = setTimeout(function(){ clients.forEach(function(c){ c.write('data: reload\n\n'); }); }, 120);
});
