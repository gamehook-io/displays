// Seen/caught totals for the Pokédex. `seen` is null when the game's mapper does not expose it; the whole result is null when caught is unknown.
export const dexSize = { 1: 151, 2: 251, 3: 386, 4: 493, 5: 649 };

export function dexTotal(value) {
  return dexSize[value('meta.generation', 2)] || 251;
}

export function dexCounts(value) {
  const total = dexTotal(value);
  let caught = 0, seen = 0, knownCaught = false, knownSeen = false;
  for (let dex = 1; dex <= total; dex++) {
    const c = value(`pokedex.caught.${dex}`, null), s = value(`pokedex.seen.${dex}`, null);
    if (typeof c === 'boolean') { knownCaught = true; if (c) caught++; }
    if (typeof s === 'boolean') { knownSeen = true; if (s) seen++; }
  }
  // A caught Pokémon has always been seen.
  return knownCaught ? { caught, seen: knownSeen ? Math.max(seen, caught) : null, total } : null;
}
