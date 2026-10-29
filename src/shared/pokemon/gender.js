import rates from './gender.json' with { type: 'json' };

// Pokémon gender is derived, not stored, before Gen 5. Species ratios are in eighths female.
// Gen 2: female when the Attack DV is below rate × 2. Gen 3–5: female when the personality
// value's low byte is below the species threshold.
const thresholds = { 1: 31, 2: 63, 4: 127, 6: 191 };
export function pokemonGender(value, path) {
  const generation = Number(value('meta.generation', 2));
  const rate = rates[Number(value(`${path}.dex_number`, 0))];
  if (generation < 2 || rate == null || rate < 0) return null;
  if (rate === 0) return 'male';
  if (rate === 8) return 'female';
  if (generation === 2) {
    const attack = value(`${path}.ivs.attack`, null);
    return Number.isInteger(attack) ? (attack < rate * 2 ? 'female' : 'male') : null;
  }
  const personality = value(`${path}.internals.personality_value`, null);
  return Number.isInteger(personality) ? ((personality & 0xff) < thresholds[rate] ? 'female' : 'male') : null;
}
