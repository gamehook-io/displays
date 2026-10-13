import references from './references.json' with { type: 'json' };

export const mapper = { id: '13e970bd-263f-4a0d-886f-190222dc2040', name: 'Dragon Warrior', platform: 'NES' };
export const acceptsMapper = candidate => typeof candidate?.id === 'string' && candidate.id.toLowerCase() === mapper.id && candidate?.platform === mapper.platform && candidate?.name === mapper.name;
export const spells = ['heal', 'hurt', 'sleep', 'radiant', 'stopspell', 'outside', 'return', 'repel', 'healmore', 'hurtmore'];
export const spellLabel = key => key.charAt(0).toUpperCase() + key.slice(1);

export function referenceValue(table, value) {
  const entries = references[table];
  if (!entries) return null;
  if (typeof value === 'number' && Number.isInteger(value)) return Object.hasOwn(entries, value) ? entries[value] : null;
  return typeof value === 'string' && Object.values(entries).includes(value) ? value : null;
}
// The mapper has no battle flag, and the enemy block shares memory with overworld tile data. A fight is
// treated as active only while a known enemy has HP left, so defeated or never-seen enemies stay hidden.
export function activeEnemyName(read) {
  const name = referenceValue('enemies', read('battle.enemy.enemy_name'));
  const hp = read('battle.enemy.current_hp'), max = read('battle.enemy.maximum_hp');
  if (!name || !Number.isFinite(hp) || hp <= 0) return null;
  return Number.isFinite(max) && hp > max ? null : name;
}
export function inventoryItems(read) {
  return Array.from({ length: 8 }, (_, index) => ({ index, name: referenceValue('items', read(`player.inventory.items.${index}`)) }))
    .filter(item => item.name);
}
export function knownSpells(read) {
  return spells.filter(key => read(`player.spells.${key}`) === true);
}
export function numericEntries(read, path, definitions) {
  return definitions.map(([key, label]) => ({ key, label, value: read(`${path}.${key}`, null) }));
}
