// Builds each overlay into its own self-contained folder: dist/<overlay>/.
//   npm run build                        every overlay plus the landing page
//   npm run build -- dragon-warrior-1    just that overlay (deploy dist/dragon-warrior-1/ on its own)
import { spawnSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { overlayNames } from './overlay-pages.js';

const path = relative => fileURLToPath(new URL(relative, import.meta.url));
const available = overlayNames();
const requested = process.argv.slice(2);
const unknown = requested.filter(name => !available.includes(name));
if (unknown.length) {
  console.error(`Unknown overlay: ${unknown.join(', ')}. Available: ${available.join(', ')}`);
  process.exit(1);
}
const names = requested.length ? requested : available;
if (!requested.length) rmSync(path('../dist'), { recursive: true, force: true });
for (const name of names) {
  const result = spawnSync(process.execPath, [path('../node_modules/vite/bin/vite.js'), 'build'], { stdio: 'inherit', env: { ...process.env, OVERLAY: name } });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
if (!requested.length) cpSync(path('../src/index.html'), path('../dist/index.html'));
