import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './src/shared/config.js';
import { overlayNames, overlayDocumentPath } from './scripts/overlay-pages.js';

const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const overlays = overlayNames();
for (const name of overlays) validateConfig((await import(`./src/${name}/config.js`)).default);
// OVERLAY=<name> builds that overlay alone into dist/<name>/ (see scripts/build.mjs).
// Otherwise Vite serves every overlay from src/ for dev and preview.
const single = process.env.OVERLAY;
if (single && !overlays.includes(single)) throw new Error(`Unknown overlay "${single}". Available: ${overlays.join(', ')}`);

const mimeTypes = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.json': 'application/json' };

// Dev and preview: /<overlay> redirects to /<overlay>/ so relative asset URLs resolve inside the
// overlay's folder, and /<overlay>/assets/... is served from that overlay's own public/ folder.
function overlayRoutes() {
  const install = server => {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      const [name, ...rest] = url.pathname.slice(1).split('/');
      if (overlays.includes(name)) {
        if (!rest.length) { response.writeHead(302, { Location: `${url.pathname}/${url.search}` }); response.end(); return; }
        const file = path(`./src/${name}/public/${rest.join('/')}`);
        if (rest.length && !rest.includes('..') && existsSync(file) && statSync(file).isFile()) {
          response.setHeader('Content-Type', mimeTypes[extname(file)] || 'application/octet-stream');
          createReadStream(file).pipe(response);
          return;
        }
      }
      request.url = overlayDocumentPath(url.pathname, overlays) + url.search;
      next();
    });
  };
  return { name: 'overlay-html-routes', configureServer: install, configurePreviewServer: install };
}

const common = {
  appType: 'mpa',
  plugins: [overlayRoutes(), solid()],
  resolve: { alias: { '@overlay': path('./src/shared/index.js') } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
};

export default defineConfig(single ? {
  ...common,
  root: path(`./src/${single}`),
  base: './',
  publicDir: existsSync(path(`./src/${single}/public`)) ? path(`./src/${single}/public`) : false,
  build: { outDir: path(`./dist/${single}`), emptyOutDir: true },
} : {
  ...common,
  root: path('./src'),
  publicDir: false,
  build: { outDir: path('./dist'), emptyOutDir: true },
});
