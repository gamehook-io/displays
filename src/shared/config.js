// Connection settings every overlay starts from. The dev proxy and production server use these too.
export const connectionDefaults = {
  gamehookUrl: 'http://127.0.0.1:61358',
  instance: 0,
  // Leave null to select the mapper automatically from Gamehook.
  mapperId: null,
};

// Overlay ids are the file names Gamehook saves settings under, so only the canonical GUID form is accepted.
const overlayId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('config must be an object');
  let target;
  try { target = new URL(config.gamehookUrl); } catch { throw new Error('gamehookUrl must be a valid HTTP URL'); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('gamehookUrl must be an HTTP origin, for example http://127.0.0.1:61358');
  if (typeof config.id !== 'string' || !overlayId.test(config.id)) throw new Error('id must be a lowercase GUID such as 215a7b0c-593a-4a62-9f76-e776e7992d68');
  if (!Number.isInteger(config.instance) || config.instance < 0) throw new Error('instance must be a nonnegative integer');
  if (config.mapperId != null && (typeof config.mapperId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.mapperId))) throw new Error('mapperId must be a mapper UUID or null');
  for (const key of ['width', 'height']) {
    if (!Number.isFinite(config[key]) || config[key] <= 0) throw new Error(`${key} must be a positive number`);
  }
  return config;
}
