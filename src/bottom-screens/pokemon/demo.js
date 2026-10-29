// Explicit design fixtures for ?demo=1. Live connections never read these values.
import { createDemo as createBaseDemo } from '../../shared/pokemon/demo.js';

const mon = (species, dex, level, hp, hpMax, moves, extra = {}) => ({
  species, dex_number: dex, nickname: species.toUpperCase(), level, held_item: 'None', status_condition: 0,
  ivs: { attack: 10 }, internals: { personality_value: 0x5a3c9e80 },
  stats: { hp, hp_max: hpMax, attack: 20 + level, defense: 18 + level, speed: 16 + level, special_attack: 19 + level, special_defense: 17 + level },
  moves: Object.fromEntries(moves.map(([move, pp], slot) => [slot, { move, pp }])),
  ...extra,
});

export default function createDemo(params = new URLSearchParams()) {
  const demo = createBaseDemo(params);
  if (!demo.player.team) return demo;
  // A full party, with fainted and afflicted members.
  Object.assign(demo.player.team, {
    4: mon('Furret', 162, 20, 55, 55, [['Tackle', 35], ['Defense Curl', 40]], { held_item: 'Berry' }),
    5: mon('Sentret', 161, 4, 14, 20, [['Scratch', 35]]),
  });
  demo.player.team_count = params.get('party') === '2' ? 2 : 6;
  if (params.get('party') === '2') for (const slot of [2, 3, 4, 5]) delete demo.player.team[slot];
  demo.bag = {
    money: 12480,
    items: Object.fromEntries([['Potion', 5], ['Super Potion', 2], ['Antidote', 3], ['Escape Rope', 1], ['Repel', 4], ['Revive', 1]].map(([item, quantity], slot) => [slot, { item, quantity }]).concat([[6, { item: 0, quantity: 0 }]])),
    balls: { 0: { item: 'Poké Ball', quantity: 12 }, 1: { item: 'Great Ball', quantity: 3 } },
    key_items: { 0: 'Bicycle', 1: 'Old Rod', 2: 'Coin Case', 3: 0 },
    tms: { 'TM01-DynamicPunch': 0, 'TM02-Headbutt': 1, 'TM03-Curse': 1 },
  };
  if (params.get('bag') === 'none') delete demo.bag;
  if (demo.pokedex) demo.pokedex.seen = Object.fromEntries([...Array(60).keys()].map(index => [index + 1, true]));
  if (demo.pokedex) Object.assign(demo.pokedex.caught, Object.fromEntries([1, 4, 7, 16, 17, 19, 25, 74, 156, 158, 161, 162, 163, 179, 187].map(dex => [dex, true])));
  return demo;
}
