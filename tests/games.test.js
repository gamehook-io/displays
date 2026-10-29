import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { registry, identifyGame, resolvePokemonValue } from '../src/shared/pokemon/games/index.js';
import { createDemo } from '../src/shared/pokemon/demo.js';
import { speciesTypes } from '../src/shared/pokemon/types.js';
import { moveType } from '../src/shared/pokemon/moves.js';
import { routeEncounters } from '../src/shared/pokemon/encounters.js';
const read = data => path => path.split('.').reduce((node, key) => node?.[key], data);

test('all installed mainline mapper families expose the same player view', () => {
  assert.equal(Object.keys(registry).length, 14);
  for (const game of Object.values(registry)) {
    assert.equal(identifyGame(game), game);
    const data = createDemo(new URLSearchParams(`game=${game.key}`));
    const value = path => resolvePokemonValue(path, read(data), game);
    assert.ok(value('player.active_pokemon.dex_number') > 0, game.key);
    assert.ok(value('player.active_pokemon.stats.hp_max') > 0, game.key);
    assert.equal(value('player.active_pokemon.moves.0.pp'), 25, game.key);
    assert.equal(value('battle.mode'), 'Trainer', game.key);
    data.meta.state = 'Overworld';
    assert.equal(value('battle.mode'), 'None', game.key);
  }
});
test('shared mapper UUIDs require an identifying name or native processor', () => {
  assert.equal(identifyGame({ id: registry.black.id }), null);
  assert.equal(identifyGame({ id: registry.black.id, nativeProcessor: registry.black_2.nativeProcessor }), registry.black_2);
});
test('historical species and moves respect generation', () => {
  assert.deepEqual(speciesTypes(81, 1), ['electric']);
  assert.deepEqual(speciesTypes(81, 2), ['electric', 'steel']);
  assert.deepEqual(speciesTypes(35, 5), ['normal']);
  assert.deepEqual(speciesTypes(35, 6), ['fairy']);
  assert.equal(moveType('Bite', null, 1), 'normal');
  assert.equal(moveType('Bite', null, 2), 'dark');
  assert.equal(moveType('Curse', null, 5), 'ghost');
});
test('paired stock encounter tables never guess a ROM version', () => {
  const game = registry.ruby_sapphire;
  const data = { meta: { state: 'Overworld' }, overworld: { map_name: 'Route 101' } };
  const value = version => (path, fallback) => resolvePokemonValue(path, read(data), game, version) ?? fallback;
  assert.deepEqual(routeEncounters(value(null)), []);
  const encounters = routeEncounters(value('ruby'));
  assert.ok(encounters.length > 0);
  assert.equal(encounters.reduce((sum, entry) => sum + entry.chance, 0), 100);
});
test('shared artwork exists for every national species', async () => {
  await Promise.all(Array.from({ length: 1025 }, (_, index) => access(new URL(`../src/shared/assets/pokemon/shared/${index + 1}.png`, import.meta.url))));
});
test('ambiguous unmarked swarm tables cannot leak species into stock routes', () => {
  const data = { overworld: { map_name: 'Route 32' }, time: { current: { time_of_day: 'Day' } } };
  const value = (path, fallback) => resolvePokemonValue(path, read(data), registry.gold_silver, 'silver') ?? fallback;
  const encounters = routeEncounters(value);
  assert.ok(encounters.length > 0);
  assert.ok(encounters.every(entry => !entry.methods.includes('Super Rod')));
  assert.ok(encounters.some(entry => entry.methods.includes('Old Rod')));
});
test('battle party position selects the active Gen 5 member and preserves zero HP/PP', () => {
  const data = { meta: { state: 'Battle' }, battle: { player: { party_position: 2 } }, player: { team: { 0: { species: 'Oshawott', stats: { hp: 20 } }, 2: { dex_number: 504, species: 'Patrat', stats: { hp: 0 }, moves: { 0: { pp_1: 0 } } } } } };
  const value = path => resolvePokemonValue(path, read(data), registry.black);
  assert.equal(value('player.active_pokemon.dex_number'), 504);
  assert.equal(value('player.active_pokemon.stats.hp'), 0);
  assert.equal(value('player.active_pokemon.moves.0.pp'), 0);
});
test('uninitialized battle classification never invents a wild encounter', () => {
  const data = { meta: { state: 'To Battle' }, battle: { opponent: { trainer: null } } };
  const value = path => resolvePokemonValue(path, read(data), registry.black);
  assert.equal(value('battle.mode'), null);
  data.battle.opponent.trainer = '--';
  assert.equal(value('battle.mode'), 'Wild');
  data.battle.opponent.trainer = 'Scientist';
  assert.equal(value('battle.mode'), 'Trainer');
});
test('every family preserves the intro boundary and empty-party fixture', () => {
  for (const game of Object.values(registry)) {
    const intro = createDemo(new URLSearchParams(`game=${game.key}&battle=intro`));
    const value = path => resolvePokemonValue(path, read(intro), game);
    assert.equal(value('battle.player.active_pokemon.stats.hp'), null, game.key);
    assert.ok(value('player.active_pokemon.stats.hp_max') > 0, game.key);
    assert.equal(value('battle.mode'), 'Wild', game.key);
    const empty = createDemo(new URLSearchParams(`game=${game.key}&pokemon=none`));
    assert.equal(empty.player.team_count, 0, game.key);
    assert.equal(resolvePokemonValue('player.active_pokemon.dex_number', read(empty), game) ?? null, null, game.key);
  }
});
test('DS battle types and consumed held items use initialized combat data', () => {
  const data = { meta: { state: 'Battle' }, player: { team: { 0: { dex_number: 132, species: 'Ditto', held_item: 'Sitrus Berry' } } }, battle: { player: { party_position: 0, active_pokemon: { type_1: 'Fire', type_2: 'Flying', held_item: 0, stats: { hp_max: 80 } } } } };
  const value = path => resolvePokemonValue(path, read(data), registry.black);
  assert.equal(value('player.active_pokemon.type_1'), 'Fire');
  assert.equal(value('player.active_pokemon.type_2'), 'Flying');
  assert.equal(value('player.active_pokemon.held_item'), 0);
  data.meta.state = 'To Battle';
  assert.equal(value('player.active_pokemon.type_1') ?? null, null);
  assert.equal(value('player.active_pokemon.held_item'), 'Sitrus Berry');
});
test('packed ownership adapts national dex flags, preserving false and unknown', () => {
  for (const game of [registry.red_blue, registry.yellow, registry.gold_silver]) {
    const maximum = game.generation === 1 ? 151 : 251;
    const bits = Array(game.generation === 1 ? 152 : 256).fill(false);
    bits[0] = true; bits[maximum - 1] = true; bits[maximum] = true;
    const data = { player: { pokedex_caught: bits } };
    const value = path => resolvePokemonValue(path, read(data), game);
    assert.equal(value('pokedex.caught.1'), true);
    assert.equal(value('pokedex.caught.2'), false);
    assert.equal(value(`pokedex.caught.${maximum}`), true);
    assert.equal(value(`pokedex.caught.${maximum + 1}`), null);
    data.player.pokedex_caught = null;
    assert.equal(value('pokedex.caught.1'), null);
    data.player.pokedex_caught = [1];
    assert.equal(value('pokedex.caught.1'), null);
  }
});
