import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { createReadStream, cpSync, existsSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from './src/shared/config.js';
import { displayEntries, displayDocumentPath, sharedAssets } from './scripts/display-pages.js';

const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const entries = displayEntries();
const routes = entries.map(entry => entry.route);
for (const entry of entries) validateConfig((await import(`./src/${entry.route}/config.js`)).default);
// DISPLAY_ROUTE=<route> (for example stream-overlays/pokemon) builds that entry alone into dist/<route>/ (see scripts/build.mjs).
// Otherwise Vite serves every entry from src/ for dev and preview.
const single = process.env.DISPLAY_ROUTE;
if (single && !routes.includes(single)) throw new Error(`Unknown display "${single}". Available: ${routes.join(', ')}`);
// Static files for an entry: its own public/ folder, plus each shared asset group it lists in sharedAssets
// (src/shared/assets/<group>/ appears at assets/<group>/). Returns [url prefix, folder] pairs, most specific first.
const assetFolders = route => [
  ['', path(`./src/${route}/public`)],
  ...(sharedAssets[route] || []).map(group => [`assets/${group}/`, path(`./src/shared/assets/${group}`)]),
];
const staticFile = (route, relative) => {
  for (const [prefix, folder] of assetFolders(route)) {
    if (!relative.startsWith(prefix)) continue;
    const file = `${folder}/${relative.slice(prefix.length)}`;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  return null;
};

const mimeTypes = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.json': 'application/json' };

// Dev and preview: /<kind>/<name> redirects to /<kind>/<name>/ so relative asset URLs resolve inside the
// entry's folder, and /<kind>/<name>/assets/... is served from its public/ folder or its shared asset groups.
function displayRoutes() {
  const install = server => {
    server.middlewares.use((request, response, next) => {
      const url = new URL(request.url, 'http://localhost');
      const [kind, name, ...rest] = url.pathname.slice(1).split('/');
      const route = `${kind}/${name}`;
      if (routes.includes(route)) {
        if (!rest.length) { response.writeHead(302, { Location: `${url.pathname}/${url.search}` }); response.end(); return; }
        const file = rest.includes('..') ? null : staticFile(route, rest.join('/'));
        if (file) {
          response.setHeader('Content-Type', mimeTypes[extname(file)] || 'application/octet-stream');
          createReadStream(file).pipe(response);
          return;
        }
      }
      request.url = displayDocumentPath(url.pathname, routes) + url.search;
      next();
    });
  };
  return { name: 'display-html-routes', configureServer: install, configurePreviewServer: install };
}

// Production builds copy an entry's static files into its own dist folder.
function copyEntryAssets(route) {
  return { name: 'copy-entry-assets', apply: 'build', closeBundle() {
    for (const [prefix, folder] of assetFolders(route)) if (existsSync(folder)) cpSync(folder, path(`./dist/${route}/${prefix}`), { recursive: true });
  } };
}

const common = {
  appType: 'mpa',
  plugins: [displayRoutes(), solid()],
  resolve: { alias: { '@display': path('./src/shared/index.js') } },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
};

export default defineConfig(single ? {
  ...common,
  root: path(`./src/${single}`),
  base: './',
  publicDir: false,
  plugins: [displayRoutes(), solid(), copyEntryAssets(single)],
  build: { outDir: path(`./dist/${single}`), emptyOutDir: true },
} : {
  ...common,
  root: path('./src'),
  publicDir: false,
  build: { outDir: path('./dist'), emptyOutDir: true },
});
