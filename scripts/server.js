import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { overlayDocumentPath } from './overlay-pages.js';

const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon' };
export function createOverlayServer({ directory = fileURLToPath(new URL('../dist', import.meta.url)) } = {}) {
  const root = resolve(directory);
  const sockets = new Set();
  function send(response, status, message) { response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }); response.end(message); }
  const server = http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { send(response, 405, 'Overlay server is read-only'); return; }
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (path.includes('\0') || path.includes('\\')) { send(response, 400, 'Invalid path'); return; }
      const document = overlayDocumentPath(path);
      // Relative asset URLs resolve inside the overlay's folder only with a trailing slash.
      if (document !== path && !path.endsWith('/') && document.endsWith('/index.html')) {
        response.writeHead(302, { Location: `${path}/${new URL(request.url, 'http://localhost').search}`, 'Cache-Control': 'no-store' });
        response.end();
        return;
      }
      const file = resolve(root, '.' + document);
      if (!file.startsWith(root + sep)) { send(response, 403, 'Invalid path'); return; }
      const info = await stat(file);
      if (!info.isFile()) { send(response, 404, 'Not found'); return; }
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
        'Content-Length': info.size,
        'Cache-Control': /\/assets\/[^/]+-[\w-]+\.(js|css)$/.test(path) ? 'public, max-age=31536000, immutable' : 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') response.end();
      else {
        const stream = createReadStream(file);
        stream.on('error', () => response.destroy());
        response.on('close', () => stream.destroy());
        stream.pipe(response);
      }
    } catch (error) { send(response, error instanceof URIError ? 400 : 404, 'Not found'); }
  });
  server.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  server.stop = () => { for (const socket of sockets) socket.destroy(); return new Promise(resolve => server.close(resolve)); };
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directory = fileURLToPath(new URL('../dist', import.meta.url));
    await stat(resolve(directory, 'index.html'));
    const port = Number(process.env.OVERLAY_PORT || 5173);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('OVERLAY_PORT must be 1–65535');
    const server = createOverlayServer({ directory });
    server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Stop the other overlay server or set OVERLAY_PORT.` : error.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`Overlay ready: http://127.0.0.1:${port}/`));
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.stop().then(() => process.exit(0)));
  } catch (error) { console.error(error.code === 'ENOENT' ? 'Build missing. Run npm run build first.' : error.message); process.exitCode = 1; }
}
