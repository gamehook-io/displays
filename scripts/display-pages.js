// Entries are folders under src/<kind>/<name>/ with their own index.html, served at the same path: /<kind>/<name>/.
//   src/stream-overlays/<name>/  Display-only overlays for streaming software.
//   src/bottom-screens/<name>/   Interactive touch-style screens.
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sourceDirectory = fileURLToPath(new URL('../src', import.meta.url));

export const kinds = [
  { folder: 'stream-overlays', title: 'Stream Overlays' },
  { folder: 'bottom-screens', title: 'Bottom Screens' },
];

// Shared artwork lives in src/shared/assets/<group>/ and is served at assets/<group>/... by every entry that
// lists the group here. Each entry's build copies only the groups it uses, so it stays self-contained.
export const sharedAssets = {
  'stream-overlays/pokemon': ['pokemon'],
  'bottom-screens/pokemon': ['pokemon'],
};

export function displayEntries(directory = sourceDirectory) {
  return kinds.flatMap(kind => {
    const folder = `${directory}/${kind.folder}`;
    if (!existsSync(folder)) return [];
    return readdirSync(folder, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && existsSync(`${folder}/${entry.name}/index.html`))
      .map(entry => ({ kind: kind.folder, name: entry.name, route: `${kind.folder}/${entry.name}` }));
  });
}

export const displayRoutes = directory => displayEntries(directory).map(entry => entry.route);

const routePattern = new RegExp(`^(${kinds.map(kind => kind.folder).join('|')})/[\\w-]+$`);

// Maps clean URLs to documents: / and /route and /route/ resolve to their index.html. Other paths pass through.
export function displayDocumentPath(path, routes) {
  if (path === '/') return '/index.html';
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  const route = clean.slice(1);
  const isRoute = routes ? routes.includes(route) : routePattern.test(route);
  return isRoute ? `${clean}/index.html` : path;
}
