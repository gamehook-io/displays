import { speciesName } from '../names.js';
import { dexForSpecies } from './index.js';
import pokemon from '../pokemon-types.json' with { type: 'json' };
import stock from './stock-encounters.json' with { type: 'json' };

// Mapper tables reflect the loaded ROM. Rates remain unknown unless slot weights
// are proven for that table; map-wide encounter frequency is not species rarity.
export function liveEncounters(value) {
  const key = value('meta.game_key');
  const rows = new Map();
  const add = (dex, method, low, high = low) => {
    if (!Number.isInteger(dex) || !pokemon[dex]) return;
    if (!rows.has(dex)) rows.set(dex, { dex, name: speciesName(dex), details: [] });
    const entry = rows.get(dex);
    let detail = entry.details.find(item => item.name === method);
    if (!detail) { detail = { name: method, min: null, max: null, chance: null }; entry.details.push(detail); }
    if (Number.isFinite(low) && low > 0 && low <= 100) {
      detail.min = detail.min === null ? low : Math.min(detail.min, low);
      detail.max = Math.max(detail.max || 0, Number.isFinite(high) && high >= low && high <= 100 ? high : low);
    }
  };
  const slots = (path, method, count) => {
    for (let slot = 0; slot < count; slot++) {
      const prefix = `${path}.${slot}`;
      const dex = value(`${prefix}.dex_number`, null) ?? dexForSpecies(value(`${prefix}.species`));
      add(dex, method, value(`${prefix}.level_low`, null) ?? value(`${prefix}.level`, null), value(`${prefix}.level_high`, null) ?? value(`${prefix}.level_copy`, null) ?? value(`${prefix}.level`, null));
    }
  };
  if (['red_blue', 'yellow'].includes(key)) {
    for (const [group, count] of [['common', 4], ['uncommon', 4], ['rare', 2]]) slots(`overworld.encounter_table.${group}`, 'Grass', count);
  } else if (['diamond_pearl', 'platinum'].includes(key)) {
    for (const [method, label] of [['walking', 'Grass'], ['surfing', 'Surf'], ['old_rod', 'Old Rod'], ['good_rod', 'Good Rod'], ['super_rod', 'Super Rod']]) slots(`overworld.encounter_table.${method}`, label, 32);
  } else if (key === 'heartgold_soulsilver') {
    for (let slot = 0; slot < 24; slot++) {
      const species = value(`overworld.encounters.${slot}`, null);
      add(typeof species === 'number' ? species : dexForSpecies(species), 'Grass', null);
    }
  } else if (['black', 'white', 'black_2', 'white_2'].includes(key)) {
    if (value('overworld.encounters_enabled', true) === false) return [];
    for (const [method, label] of [['regular_grass', 'Grass'], ['dark_grass', 'Dark Grass'], ['shaking_grass', 'Shaking Grass'], ['surfing', 'Surf'], ['bubbles', 'Rippling Water'], ['fishing', 'Fishing'], ['fishing_bubble', 'Fishing Ripples']]) {
      if (value(`overworld.encounters_enabled_${method}`, true) !== false) slots(`overworld.encounter_tables.${method}`, label, 12);
    }
  }
  const version = value('meta.game_version', null);
  const route = String(value('overworld.map_name', '')).match(/\broute\s*(\d+)\b/i)?.[1];
  const period = value('time.current.time_of_day', null);
  const selected = (stock[version]?.[`route${route}`] || []).filter(row => row[5] === 'Any' || row[5] === period);
  const stockTotals = new Map();
  for (const row of selected) stockTotals.set(row[3], (stockTotals.get(row[3]) || 0) + row[4]);
  for (const [dex, low, high, method, chance] of selected) {
    // Some source fishing rows combine ordinary and unmarked swarm tables.
    // Such a method cannot establish either the species set or probabilities.
    if (stockTotals.get(method) !== 100) continue;
    add(dex, method, low, high);
    const detail = rows.get(dex)?.details.find(item => item.name === method);
    if (detail) detail.chance = (detail.chance || 0) + chance;
  }
  const totals = new Map();
  for (const entry of rows.values()) for (const detail of entry.details) {
    if (detail.chance !== null) totals.set(detail.name, (totals.get(detail.name) || 0) + detail.chance);
  }
  for (const entry of rows.values()) for (const detail of entry.details) {
    if (totals.get(detail.name) !== 100) detail.chance = null;
  }
  return [...rows.values()].map(entry => ({ ...entry, methods: entry.details.map(detail => detail.name), primaryMethod: entry.details[0].name, min: entry.details[0].min, max: entry.details[0].max, chance: entry.details[0].chance }));
}
