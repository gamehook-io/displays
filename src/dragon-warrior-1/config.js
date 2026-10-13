import { connectionDefaults } from '../shared/config.js';

export default {
  // Identifies this overlay's saved settings in Gamehook (GET/POST /kv/<id>). Never change it once published.
  id: 'dcfc7afa-fe10-462b-b11c-6fb42f2f9a7c',
  ...connectionDefaults,
  // The scene fills the browser window; see the Pokémon config for how width and height scale.
  width: 1200,
  height: 1080,
  // true: the themed background also fills the game opening. Put the game capture ABOVE this
  // overlay in OBS. false: the opening stays transparent for an overlay layered above the game.
  fillOpening: true,
};
