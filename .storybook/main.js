// Storybook for the display widgets and scenes. Stories live beside each entry in stories/ folders.
export default {
  framework: { name: 'storybook-solidjs-vite', options: { builder: { viteConfigPath: '.storybook/vite.config.js' } } },
  stories: ['../src/**/stories/*.stories.jsx'],
  // Stories use the same relative asset URLs as the pages (assets/pokemon/<dex>.png, assets/crystal-frame.svg).
  staticDirs: [
    { from: '../src/shared/assets/pokemon', to: '/assets/pokemon' },
    { from: '../src/stream-overlays/pokemon/public/assets', to: '/assets' },
  ],
};
