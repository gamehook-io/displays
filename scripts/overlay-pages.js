// Each overlay is a folder under src/ with its own index.html, served at /<folder>/.
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const sourceDirectory = fileURLToPath(new URL('../src', import.meta.url));

export function overlayNames(directory = sourceDirectory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(`${directory}/${entry.name}/index.html`))
    .map(entry => entry.name);
}

// Maps clean URLs to documents: / and /name and /name/ resolve to their index.html. Other paths pass through.
export function overlayDocumentPath(path, routes) {
  if (path === '/') return '/index.html';
  const clean = path.endsWith('/') ? path.slice(0, -1) : path;
  const name = clean.slice(1);
  const isRoute = routes ? routes.includes(name) : /^[\w-]+$/.test(name);
  return isRoute ? `${clean}/index.html` : path;
}
