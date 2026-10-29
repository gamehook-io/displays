import { connectionDefaults } from '../../shared/config.js';
import { validateOverlayConfig } from './validateConfig.js';

export default validateOverlayConfig({
  // Identifies this display's saved settings in Gamehook (GET/POST /kv/<id>). Never change it once published.
  id: 'fff8cfa6-cd2d-4cfa-b4b1-44650ac7ecd8',
  ...connectionDefaults,
  // Optional exact version for paired mappers that cannot distinguish ROM versions.
  version: null,
  // The scene fills the browser window. height: design units mapped to the window height.
  // width: minimum layout width; narrower windows scale down so the side columns never overlap.
  width: 1200,
  height: 1080,
  // Optional display values; unavailable counters are hidden.
  resets: null,
  blackouts: null,
  // Place artwork in src/stream-overlays/pokemon/public/assets; leave empty to use the bundled species picture.
  sprite: '',
  // true: official artwork (src/shared/assets/pokemon/art), falling back to game sprites. false: game sprites only.
  artwork: true,
  // Optional user-supplied decorative background image.
  background: '',
  // true: the themed background also fills the game opening. Put the game capture ABOVE this
  // overlay in OBS. false: the opening stays transparent for an overlay layered above the game.
  fillOpening: true,
});
