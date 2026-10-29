import { connectionDefaults } from '../../shared/config.js';

export default {
  // Identifies this screen's saved settings in Gamehook (GET/POST /kv/<id>). Never change it once published.
  id: '641e8aa4-9680-4fcd-98c3-9c50135d0ea1',
  ...connectionDefaults,
  // Optional exact version for paired mappers that cannot distinguish ROM versions.
  version: null,
  // Design stage, 4:3 like a DS screen. It is scaled to fit the browser window.
  width: 1024,
  height: 768,
};
