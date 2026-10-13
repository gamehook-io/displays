import test from 'node:test';
import assert from 'node:assert/strict';
import references from '../src/dragon-warrior-1/references.json' with { type: 'json' };
import { activeEnemyName, acceptsMapper, mapper, referenceValue, inventoryItems, knownSpells, numericEntries } from '../src/dragon-warrior-1/data.js';
import { createDragonWarriorDemo } from '../src/dragon-warrior-1/demo.js';

const read = data => (path, fallback) => path.split('.').reduce((node, key) => node?.[key], data) ?? fallback;
test('Dragon Warrior selection rejects other games and ID collisions', () => {
  assert.equal(acceptsMapper({ ...mapper }), true);
  assert.equal(acceptsMapper({ ...mapper, id: mapper.id.toUpperCase() }), true);
  assert.equal(acceptsMapper(null), false);
  assert.equal(acceptsMapper({ ...mapper, id: 13 }), false);
  assert.equal(acceptsMapper({ ...mapper, name: 'Dragon Warrior II' }), false);
  assert.equal(acceptsMapper({ ...mapper, platform: 'GBC' }), false);
});
test('inventory handles both mapper integers and decoded references without inventing items', () => {
  assert.equal(referenceValue('items', 14), 'Rainbow Drop');
  assert.equal(referenceValue('items', 'Rainbow Drop'), 'Rainbow Drop');
  for (const value of [0, null, '', 99, 'Unknown', 'constructor', 1.5]) assert.equal(referenceValue('items', value), null);
  const entries = inventoryItems(read({ player: { inventory: { items: [0, 12, 'Torch', null, 13, 99, 14] } } }));
  assert.deepEqual(entries, [{ index: 1, name: 'Stones of Sunlight' }, { index: 2, name: 'Torch' }, { index: 4, name: 'Staff of Rain' }, { index: 6, name: 'Rainbow Drop' }]);
});
test('spellbook requires learned boolean flags; unavailable values stay unavailable', () => {
  assert.deepEqual(knownSpells(read({ player: { spells: { heal: true, hurt: false, radiant: 'false', repel: 1 } } })), ['heal']);
  assert.deepEqual(numericEntries(read({ player: { stats: { gold: 0 } } }), 'player.stats', [['gold', 'Gold'], ['experience', 'Experience']]), [
    { key: 'gold', label: 'Gold', value: 0 }, { key: 'experience', label: 'Experience', value: null },
  ]);
});
test('preview covers zero values, all slots, missing maxima, and independent snapshots', () => {
  const early = createDragonWarriorDemo(new URLSearchParams('sample=early'));
  assert.equal(early.player.stats.gold, 0);
  assert.equal(early.player.stats.maximum_mp, 0);
  assert.deepEqual(knownSpells(read(early)), []);
  assert.equal(inventoryItems(read(createDragonWarriorDemo(new URLSearchParams('sample=full')))).length, 8);
  const missing = createDragonWarriorDemo(new URLSearchParams('sample=missing'));
  assert.equal(missing.player.stats.maximum_hp, undefined);
  assert.equal(missing.player.stats.current_hp, 0);
  const first = createDragonWarriorDemo();
  first.player.stats.current_hp = 0;
  assert.equal(createDragonWarriorDemo().player.stats.current_hp, 112);
});
test('bundled mapper references cover all item and enemy codes', () => {
  assert.equal(Object.keys(references.items).length, 16);
  assert.equal(Object.keys(references.enemies).length, 40);
  assert.equal(referenceValue('enemies', 0), 'Slime');
  assert.equal(referenceValue('enemies', 39), 'Dragonlord 2');
  assert.equal(referenceValue('enemies', 40), null);
});
test('enemy shows only while a known enemy has HP left', () => {
  const enemy = fields => key => ({ enemy_name: 'Slime', current_hp: 3, maximum_hp: 3, ...fields })[key.split('.').at(-1)];
  assert.equal(activeEnemyName(enemy({})), 'Slime');
  assert.equal(activeEnemyName(enemy({ current_hp: 0 })), null);
  assert.equal(activeEnemyName(enemy({ current_hp: 9 })), null);
  assert.equal(activeEnemyName(enemy({ enemy_name: 200 })), null);
  assert.equal(activeEnemyName(enemy({ current_hp: undefined })), null);
  assert.equal(activeEnemyName(enemy({ maximum_hp: undefined })), 'Slime');
});
