import { connectionDefaults } from '../../shared/config.js';

export default {
  // Identifies this screen's saved settings in Gamehook (GET/POST /kv/<id>). Never change it once published.
  id: '641e8aa4-9680-4fcd-98c3-9c50135d0ea1',
  ...connectionDefaults,
  // Optional exact version for paired mappers that cannot distinguish ROM versions.
  version: null,
  // Design stage reference. `height` maps to the window height; the layout width follows the window,
  // and `width` is the minimum layout width before the stage scales down by width instead.
  width: 768,
  height: 768,
};
