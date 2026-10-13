import tables from './crystal-encounters.json' with { type: 'json' };
import pokemon from './pokemon-types.json' with { type: 'json' };
import { liveEncounters } from './games/encounters.js';

const groups = ['Olivine', 'Mahogany', 'Dungeons', 'Ecruteak', 'Blackthorn', 'Cinnabar', 'Cerulean', 'Azalea', 'Lake of Rage', 'Violet', 'Goldenrod', 'Vermilion', 'Pallet', 'Pewter', 'Fast Ship', 'Indigo', 'Fuchsia', 'Lavender', 'Silver', 'Cable Club', 'Celadon', 'Cianwood', 'Viridian', 'New Bark', 'Saffron', 'Cherrygrove'];
export function routeEncounters(value) {
  if (value('meta.game_key', 'crystal') !== 'crystal') return liveEncounters(value);
  const rawGroup = value('overworld.map_group', null);
  const group = typeof rawGroup === 'number' ? rawGroup : groups.indexOf(rawGroup) + 1;
  const table = tables[`${group}:${value('overworld.map_index', null)}`];
  const period = value('time.current.time_of_day', null);
  if (!table || !['Morning', 'Day', 'Night'].includes(period)) return [];
  const rows = new Map();
  function add(dex, level, method, chance = null) {
    if (!rows.has(dex)) rows.set(dex, { dex, name: pokemon[dex]?.name.replace(/-/g, ' '), methods: new Map() });
    const entry = rows.get(dex);
    if (!entry.methods.has(method)) entry.methods.set(method, { name: method, levels: [], chance: null });
    const detail = entry.methods.get(method);
    detail.levels.push(level);
    if (chance !== null) detail.chance = (detail.chance || 0) + chance;
  }
  const swarm = table.Swarm && value(`flags.swarm_flags.${table.Swarm.flag}`, false) === true;
  for (const [dex, level, chance] of (swarm ? table.Swarm[period] : table[period]) || []) add(dex, level, 'Grass', chance);
  for (const [dex, level, chance] of table.Surf || []) add(dex, level, 'Surf', chance);
  for (const [rod, slots] of Object.entries(table.Fishing || {})) {
    for (const slot of slots) {
      const [dex, level] = slot.dex ? [slot.dex, slot.level] : slot[period === 'Night' ? 'night' : 'day'];
      add(dex, level, rod);
    }
  }
  const surfing = ['Surf', 'Surf-Pikachu', 'Surfing', 3, 4].includes(value('overworld.movement_state', null));
  const entries = [...rows.values()].map(entry => {
    const details = [...entry.methods.values()].map(method => ({ name: method.name, chance: method.chance, min: Math.min(...method.levels), max: Math.max(...method.levels) }));
    const primary = details.find(method => method.name === (surfing ? 'Surf' : 'Grass')) || details[0];
    return { ...entry, methods: details.map(method => method.name), details, primaryMethod: primary.name, chance: primary.chance, min: primary.min, max: primary.max };
  });
  // Keep all methods available, but surface the current water encounters first.
  return surfing ? entries.sort((left, right) => Number(right.primaryMethod === 'Surf') - Number(left.primaryMethod === 'Surf')) : entries;
}
