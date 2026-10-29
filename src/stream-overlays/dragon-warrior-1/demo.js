import { spells } from './data.js';

export function createDragonWarriorDemo(params = new URLSearchParams()) {
  const sample = params.get('sample');
  const data = {
    map: { name: 'Charlock Castle B7' },
    player: {
      position: { x: 10, y: 24, standing_on: 'Brick', light_radius: 'Fully Lit' },
      stats: { level: 24, current_hp: 112, maximum_hp: 158, current_mp: 36, maximum_mp: 84, attack_power: 132, defense_power: 108, gold: 12640, experience: 34012 },
      inventory: { magic_keys_quantity: 3, herbs_quantity: 6, items: ['Torch', "Erdrick's Token", "Gwaelin's Love", 'Rainbow Drop', null, null, null, null] },
      spells: Object.fromEntries(spells.map(key => [key, true])),
    },
    battle: { enemy: { enemy_name: 'Red Dragon', current_hp: 76, maximum_hp: 100, strength: 120, agility: 90, abilities: 'Attack | 50% Fire Breath', xp_reward: 100, gold_reward: 100 } },
  };
  if (sample === 'early') {
    data.map.name = 'Tantegel Castle';
    Object.assign(data.player.stats, { level: 1, current_hp: 15, maximum_hp: 15, current_mp: 0, maximum_mp: 0, attack_power: 5, defense_power: 3, gold: 0, experience: 0 });
    data.player.spells = Object.fromEntries(spells.map(key => [key, false]));
    data.player.inventory = { magic_keys_quantity: 0, herbs_quantity: 0, items: Array(8).fill(null) };
    data.battle = {};
  }
  if (sample === 'critical') { data.player.stats.current_hp = 0; data.player.stats.current_mp = 0; data.battle.enemy.current_hp = 1; }
  if (sample === 'full') data.player.inventory.items = [12, 13, 14, 7, 8, 11, 10, 6];
  if (sample === 'missing') return { map: {}, player: { stats: { level: 5, current_hp: 0 }, inventory: {}, spells: {}, position: {} }, battle: { enemy: { enemy_name: 'Slime', current_hp: 1 } } };
  return data;
}
