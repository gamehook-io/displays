import moves from './move-types.json' with { type: 'json' };
import { palettes } from './types.js';

const byName = new Map(Object.values(moves).map(move => [move.name, move]));
export function moveType(value, hiddenPowerType, generation = 2) {
  const move = typeof value === 'number' ? moves[value] : byName.get(String(value).replace(/[^a-z0-9]/gi, '').toLowerCase());
  if (move?.name === 'hiddenpower') {
    const type = typeof hiddenPowerType === 'string' ? hiddenPowerType.toLowerCase() : null;
    return type && Object.hasOwn(palettes, type) ? type : null;
  }
  if (move?.name === 'curse' && generation < 5) return 'curse';
  return move?.past?.find(([changed]) => changed > generation)?.[1] || move?.type || null;
}
