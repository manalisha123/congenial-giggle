const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const routes = {
  '/reference/': 'reference.html',
  '/release/': 'release.html'
};
const port = Number(process.env.PORT || 4173);
const server = http.createServer((req, res) => {
  const route = new URL(req.url, 'http://localhost').pathname;
  const name = routes[route];
  res.setHeader('Cache-Control', 'no-store');
  if (!name) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Use /reference/ or /release/.');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(path.join(__dirname, 'builds', name)));
});
server.listen(port, '127.0.0.1', () => console.log(`Cedar: http://127.0.0.1:${port}/reference/ and /release/`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
