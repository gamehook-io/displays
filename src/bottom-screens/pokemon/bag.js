import { bagPockets } from './paths.js';

const blank = value => [null, undefined, 0, '0', '', 'None', '--'].includes(value);
const tidy = key => key.replace(/-/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');

// Entries of one mapper pocket. Mappers differ: { item, quantity } rows (most games), bare item names
// (Gen 2 key items), or quantities keyed by name (Gen 2 TMs). Empty slots and unknown values are dropped;
// a quantity the mapper cannot decode stays null rather than becoming zero.
export function readPocket(node) {
  if (!node || typeof node !== 'object') return [];
  const entries = [];
  for (const [key, entry] of Object.entries(node)) {
    if (entry && typeof entry === 'object') {
      if (blank(entry.item)) continue;
      const quantity = Number.isFinite(entry.quantity) ? entry.quantity : null;
      if (quantity === 0) continue;
      entries.push({ name: String(entry.item), quantity });
    } else if (typeof entry === 'string') {
      if (!blank(entry)) entries.push({ name: entry, quantity: null });
    } else if (Number.isFinite(entry) && entry > 0 && !/^\d+$/.test(key)) {
      entries.push({ name: tidy(key), quantity: entry });
    }
  }
  return entries;
}

// Pockets the loaded mapper exposes, in display order. `read(path)` is gamehook.value.
export function bagContents(read) {
  return bagPockets
    .map(pocket => ({ ...pocket, entries: readPocket(read(`bag.${pocket.key}`, null)) }))
    .filter(pocket => pocket.entries.length);
}

// Whether the mapper has any bag at all, even an empty one.
export const hasBag = read => bagPockets.some(pocket => read(`bag.${pocket.key}`, null) && typeof read(`bag.${pocket.key}`, null) === 'object');
