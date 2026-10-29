// Builds each entry into its own self-contained folder: dist/<kind>/<name>/.
//   npm run build                                      every entry plus the landing page
//   npm run build -- stream-overlays/dragon-warrior-1  just that entry (deploy its dist folder on its own)
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { displayRoutes } from './display-pages.js';

const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const available = displayRoutes();
const requested = process.argv.slice(2);
const unknown = requested.filter(route => !available.includes(route));
if (unknown.length) {
  console.error(`Unknown entry: ${unknown.join(', ')}. Available: ${available.join(', ')}`);
  process.exit(1);
}
const routes = requested.length ? requested : available;
if (!requested.length) rmSync(path('../dist'), { recursive: true, force: true });
for (const route of routes) {
  const result = spawnSync(process.execPath, [path('../node_modules/vite/bin/vite.js'), 'build'], { stdio: 'inherit', env: { ...process.env, DISPLAY_ROUTE: route } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!requested.length) cpSync(path('../src/index.html'), path('../dist/index.html'));
