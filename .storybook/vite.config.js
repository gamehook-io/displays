// Storybook's own Vite config, kept apart from the page build (which maps URLs to entry folders).
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [solid()],
  resolve: { alias: { '@display': fileURLToPath(new URL('../src/shared/index.js', import.meta.url)) } },
});
