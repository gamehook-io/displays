import test from 'node:test';
import assert from 'node:assert/strict';
import { validateConfig } from '../src/shared/config.js';
import config from '../src/pokemon/config.js';
import dragonWarrior from '../src/dragon-warrior-1/config.js';
import { validateOverlayConfig } from '../src/pokemon/validateConfig.js';
test('default configuration is valid', () => assert.equal(validateConfig(config), config));
test('bad origins, instance indices, and dimensions have actionable errors', () => {
  for (const [key, value] of [['gamehookUrl', 'ftp://localhost'], ['gamehookUrl', 'http://localhost/api'], ['instance', -1], ['width', 0]]) {
    assert.throws(() => validateConfig({ ...config, [key]: value }), new RegExp(key));
  }
});
test('framework permits author-defined options for any game', () => {
  const custom = { ...config, version: 'another-release', resets: 'custom', sprite: { atlas: true } };
  assert.equal(validateConfig(custom), custom);
  for (const invalid of [null, [], 'config']) assert.throws(() => validateConfig(invalid), /config must be an object/);
});
test('included scene validates its own version, artwork, and counters', () => {
  assert.equal(validateOverlayConfig(config), config);
  for (const [key, value] of [['version', 'unknown'], ['blackouts', '4'], ['resets', -1], ['sprite', {}], ['background', 5]]) {
    assert.throws(() => validateOverlayConfig({ ...config, [key]: value }), new RegExp(key));
  }
});
test('dragon warrior config is valid', () => assert.equal(validateConfig(dragonWarrior), dragonWarrior));
test('every overlay has its own valid GUID', async () => {
  const { overlayNames } = await import('../scripts/overlay-pages.js');
  const ids = await Promise.all(overlayNames().map(async name => (await import(`../src/${name}/config.js`)).default.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['', 'pokemon', '215A7B0C-593A-4A62-9F76-E776E7992D68', '215a7b0c593a4a629f76e776e7992d68', '../215a7b0c-593a-4a62-9f76-e776e7992d6']) {
    assert.throws(() => validateConfig({ ...config, id }), /id must be a lowercase GUID/);
  }
});
