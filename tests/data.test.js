import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { routeEncounters } from '../src/shared/pokemon/encounters.js';
import { activeTypes, palettes, themeStyle } from '../src/shared/pokemon/types.js';
import tables from '../src/shared/pokemon/crystal-encounters.json' with { type: 'json' };
import { moveType } from '../src/shared/pokemon/moves.js';
import { createDemo } from '../src/shared/pokemon/demo.js';
import { statusDetails } from '../src/shared/pokemon/status.js';
const read = data => (path, fallback) => path.split('.').reduce((node, key) => node?.[key], data) ?? fallback;
const route = (period = 'Day', movement = 'Walk', group = 'New Bark', index = 3) => read({ overworld: { map_group: group, map_index: index, movement_state: movement }, time: { current: { time_of_day: period } } });
test('Route 29 changes species with the period and grass probabilities total 100', () => {
  const day = routeEncounters(route()); const night = routeEncounters(route('Night'));
  assert.deepEqual(day.map(entry => entry.dex).sort((a,b) => a-b), [16,19,161,187]);
  assert.deepEqual(night.map(entry => entry.dex).sort((a,b) => a-b), [19,163]);
  assert.equal(day.reduce((sum, entry) => sum + entry.chance, 0), 100);
  assert.equal(routeEncounters(route('Day', 'Walking', 'New Bark', 13)).length, 0);
});

test('Crystal moves use historical types and Hidden Power requires its calculated type', () => {
  assert.equal(moveType('Flame Wheel'), 'fire');
  assert.equal(moveType('ThunderPunch'), 'electric');
  assert.equal(moveType('Thunder Punch'), 'electric');
  assert.equal(moveType(10), 'normal');
  assert.equal(moveType('Curse'), 'curse');
  assert.equal(moveType('Hidden Power'), null);
  assert.equal(moveType('Hidden Power', 'Water'), 'water');
  assert.equal(moveType('Unknown Move'), null);
});

test('preview fixtures are independent and Totodile has starter moves', () => {
  const first = createDemo(new URLSearchParams('pokemon=totodile'));
  assert.equal(first.player.active_pokemon.level, 5);
  assert.equal(first.player.active_pokemon.moves[0].move, 'Scratch');
  assert.equal(first.player.active_pokemon.moves[1].move, 'Leer');
  first.player.active_pokemon.stats.hp = 0;
  assert.equal(createDemo(new URLSearchParams('pokemon=totodile')).player.active_pokemon.stats.hp, 20);
  assert.equal(first.battle.player.active_pokemon.stats.hp, 20);
});

test('status labels decode Crystal codes and omit unknown data', () => {
  assert.equal(statusDetails('PSN').label, 'Poisoned');
  assert.equal(statusDetails(64).label, 'Paralyzed');
  assert.equal(statusDetails(7).label, 'Asleep');
  assert.equal(statusDetails(0).key, 'healthy');
  assert.equal(statusDetails(null), null);
  assert.equal(statusDetails('constructor'), null);
  assert.equal(statusDetails(255), null);
});

test('grass swarms replace only their map grass table', () => {
  const normal = routeEncounters(route('Day', 'Walking', 'Violet', 2));
  const swarming = routeEncounters(read({ overworld: { map_group: 'Violet', map_index: 2, movement_state: 'Walking' }, time: { current: { time_of_day: 'Day' } }, flags: { swarm_flags: { yanma_swarm: true } } }));
  const rate = entries => entries.find(entry => entry.dex === 193).details.find(method => method.name === 'Grass').chance;
  assert.equal(rate(normal), 1);
  assert.equal(rate(swarming), 30);
});
test('method-specific levels and rates are not merged across grass, surf, and fishing', () => {
  // Exercise the full table set rather than relying on one species occurring in every method.
  let matched = 0;
  for (const key of Object.keys(tables)) {
    const [group, index] = key.split(':').map(Number);
    const entries = routeEncounters(route('Day', 'Surf', group, index));
    for (const entry of entries) {
      const surf = entry.details.find(method => method.name === 'Surf');
      if (!surf) continue;
      matched++; assert.equal(entry.primaryMethod, 'Surf'); assert.equal(entry.chance, surf.chance); assert.equal(entry.min, surf.min); assert.equal(entry.max, surf.max);
    }
  }
  assert.ok(matched > 0);
});
test('all encounter slots refer to bundled Crystal artwork and valid weights', async () => {
  const ids = new Set();
  for (const table of Object.values(tables)) {
    for (const period of ['Morning', 'Day', 'Night', 'Surf']) {
      if (!table[period]) continue;
      assert.equal(table[period].reduce((sum, row) => sum + row[2], 0), 100);
      for (const [dex, level] of table[period]) { assert.ok(dex >= 1 && dex <= 251); assert.ok(level >= 1 && level <= 100); ids.add(dex); }
    }
    for (const slots of Object.values(table.Fishing || {})) for (const row of slots) { if (row.dex) ids.add(row.dex); else { ids.add(row.day[0]); ids.add(row.night[0]); } }
  }
  await Promise.all([...ids].map(dex => access(new URL(`../src/shared/assets/pokemon/${dex}.png`, import.meta.url))));
});
test('primary type is historical for Crystal, explicit mapper types take priority, absence is neutral', () => {
  assert.deepEqual(activeTypes(read({ player: { active_pokemon: { dex_number: 158, species: 'Totodile' } } }), 'player.active_pokemon'), ['water']);
  assert.deepEqual(activeTypes(read({ player: { active_pokemon: { dex_number: 35, species: 'Clefairy' } } }), 'player.active_pokemon'), ['normal']);
  assert.deepEqual(activeTypes(read({ player: { active_pokemon: { dex_number: 158, species: 'Totodile', type_1: 'Fire' } } }), 'player.active_pokemon'), ['fire']);
  assert.deepEqual(activeTypes(read({ player: { team_count: 0, active_pokemon: { dex_number: 158 } } }), 'player.active_pokemon'), []);
  for (const type of Object.keys(palettes)) for (const color of Object.values(themeStyle(type))) assert.match(color, /^#[0-9a-f]{6}([0-9a-f]{2})?$/i);
});
