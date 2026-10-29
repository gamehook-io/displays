import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../src/bottom-screens/pokemon/config.js';
import createDemo from '../src/bottom-screens/pokemon/demo.js';
import { readPocket, bagContents, hasBag } from '../src/bottom-screens/pokemon/bag.js';
import { neighbor } from '../src/shared/navigation.js';
import { validateConfig } from '../src/shared/config.js';
import { displayEntries, displayDocumentPath } from '../scripts/display-pages.js';

const read = (data, path, fallback = null) => path.split('.').reduce((node, key) => node?.[key], data) ?? fallback;

test('bottom screen config is valid', () => {
  assert.equal(validateConfig(config), config);
});

test('entries are discovered under both kinds and served at their folder paths', () => {
  const routes = displayEntries().map(entry => entry.route);
  for (const route of ['stream-overlays/pokemon', 'stream-overlays/dragon-warrior-1', 'bottom-screens/pokemon']) assert.ok(routes.includes(route), route);
  assert.equal(displayDocumentPath('/bottom-screens/pokemon/'), '/bottom-screens/pokemon/index.html');
  assert.equal(displayDocumentPath('/pokemon'), '/pokemon');
});

test('bag pockets cope with each mapper shape and drop empty slots', () => {
  assert.deepEqual(readPocket({ 0: { item: 'Potion', quantity: 5 }, 1: { item: 0, quantity: 0 }, 2: { item: 'Antidote', quantity: 0 } }), [{ name: 'Potion', quantity: 5 }]);
  assert.deepEqual(readPocket({ 0: 'Bicycle', 1: 0 }), [{ name: 'Bicycle', quantity: null }]);
  assert.deepEqual(readPocket({ 'TM01-DynamicPunch': 0, 'TM02-Headbutt': 1 }), [{ name: 'TM02 Headbutt', quantity: 1 }]);
  // An undecodable quantity is unknown, not zero.
  assert.deepEqual(readPocket({ 0: { item: 'Potion', quantity: 'x' } }), [{ name: 'Potion', quantity: null }]);
  assert.deepEqual(readPocket(null), []);
});

test('demo bag and party feed the screens', () => {
  const demo = createDemo(new URLSearchParams());
  const value = (path, fallback) => read(demo, path, fallback);
  assert.equal(hasBag(value), true);
  assert.deepEqual(bagContents(value).map(pocket => pocket.key), ['items', 'balls', 'key_items', 'tms']);
  assert.equal(demo.player.team_count, 6);
  assert.equal(createDemo(new URLSearchParams('party=2')).player.team_count, 2);
  assert.equal(hasBag(path => read(createDemo(new URLSearchParams('bag=none')), path)), false);
});

test('arrow navigation picks the nearest control in that direction', () => {
  const box = (x, y) => ({ getBoundingClientRect: () => ({ left: x, top: y, width: 10, height: 10 }) });
  const [center, right, below, farRight] = [box(0, 0), box(50, 2), box(1, 40), box(200, 0)];
  assert.equal(neighbor(center, [center, right, below, farRight], [1, 0]), right);
  assert.equal(neighbor(center, [center, right, below, farRight], [0, 1]), below);
  assert.equal(neighbor(center, [center, right, below], [-1, 0]), null);
});

test('gamepad reads d-pad, stick, and face buttons through the chosen layout', async () => {
  const { padInputs, buttons } = await import('../src/shared/gamepad.js');
  const pressed = (...indexes) => ({ buttons: Array.from({ length: 17 }, (_, index) => indexes.includes(index)), axes: [0, 0] });
  assert.equal(padInputs(pressed(buttons.up)).up, true);
  assert.equal(padInputs({ ...pressed(), axes: [0.2, 0.9] }).down, true);
  assert.equal(padInputs({ ...pressed(), axes: [-0.3, 0.2] }).left, false);
  // Xbox: south confirms, east cancels. Nintendo swaps them so the right-hand button confirms.
  assert.deepEqual([padInputs(pressed(buttons.south)).activate, padInputs(pressed(buttons.south)).back], [true, false]);
  assert.deepEqual([padInputs(pressed(buttons.south), 'nintendo').activate, padInputs(pressed(buttons.south), 'nintendo').back], [false, true]);
  assert.equal(padInputs(pressed(buttons.r1)).next, true);
});

test('held directions repeat after a delay; buttons fire once', async () => {
  const { createInputTracker } = await import('../src/shared/gamepad.js');
  const poll = createInputTracker();
  const inputs = { right: true, activate: true };
  assert.deepEqual(poll(inputs, 0), ['right', 'activate']);
  assert.deepEqual(poll(inputs, 200), []);
  assert.deepEqual(poll(inputs, 450), ['right']);
  assert.deepEqual(poll(inputs, 500), []);
  assert.deepEqual(poll(inputs, 590), ['right']);
  assert.deepEqual(poll({}, 600), []);
  assert.deepEqual(poll(inputs, 610), ['right', 'activate']);
});

test('shared party rules clamp the count and ignore blank slots', async () => {
  const { partyCount, slotOccupied, occupiedSlots, areaName, isBlank } = await import('../src/shared/pokemon/party.js');
  const { groupEncounters } = await import('../src/shared/pokemon/encounters.js');
  const value = data => (path, fallback = null) => read(data, path, fallback);
  const data = { player: { team_count: 9, team: { 0: { dex_number: 156 }, 1: { species: 'Pidgey' }, 2: { dex_number: 0, species: 0 } } }, overworld: { map_name: 'Route 29' } };
  assert.equal(partyCount(value(data)), 6);
  assert.deepEqual(occupiedSlots(value(data)), [0, 1]);
  assert.equal(slotOccupied(value({ player: { team_count: 1, team: { 0: { dex_number: 1 }, 1: { dex_number: 4 } } } }), 1), false);
  assert.equal(areaName(value(data)), 'Route 29');
  assert.equal(areaName(value({ overworld: { map_name: '0' } })), null);
  assert.equal(isBlank('0') && isBlank(null) && !isBlank('Potion'), true);
  assert.deepEqual(groupEncounters([{ primaryMethod: 'Grass', n: 1 }, { primaryMethod: 'Surf', n: 2 }, { primaryMethod: 'Grass', n: 3 }, { n: 4 }]).map(group => [group.method, group.entries.length]), [['Grass', 2], ['Surf', 1], ['Other', 1]]);
});
