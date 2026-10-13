import registry from './games/registry.json' with { type: 'json' };

const versions = new Set(Object.values(registry).flatMap(game => game.versions));

// These options belong to this scene. Other overlays define their own options.
export function validateOverlayConfig(config) {
  if (config.version != null && !versions.has(config.version)) throw new Error('version must be a supported ROM version or null');
  for (const key of ['sprite', 'background']) {
    if (config[key] != null && typeof config[key] !== 'string') throw new Error(`${key} must be an asset URL string or empty`);
  }
  if (config.artwork != null && typeof config.artwork !== 'boolean') throw new Error('artwork must be true or false');
  if (config.fillOpening != null && typeof config.fillOpening !== 'boolean') throw new Error('fillOpening must be true or false');
  for (const key of ['resets', 'blackouts']) {
    if (config[key] != null && (!Number.isInteger(config[key]) || config[key] < 0)) throw new Error(`${key} must be null or a nonnegative integer`);
  }
  return config;
}
