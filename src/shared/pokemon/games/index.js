import registry from './registry.json' with { type: 'json' };
import pokemon from '../pokemon-types.json' with { type: 'json' };

export { registry };
const games = Object.values(registry);
const normalize = value => String(value || '').toLowerCase().replace(/♀/g, 'f').replace(/♂/g, 'm').replace(/[^a-z0-9]/g, '');
const species = new Map(Object.entries(pokemon).map(([dex, entry]) => [normalize(entry.name), Number(dex)]));
for (const [alias, dex] of [['deoxys', 386], ['wormadam', 413], ['giratina', 487], ['shaymin', 492], ['basculin', 550], ['darmanitan', 555], ['tornadus', 641], ['thundurus', 642], ['landorus', 645], ['keldeo', 647], ['meloetta', 648]]) species.set(alias, dex);
export function identifyGame(mapper) {
  if (!mapper) return null;
  const processor = games.find(game => game.nativeProcessor && game.nativeProcessor === mapper.nativeProcessor);
  if (processor) return processor;
  const named = games.find(game => normalize(game.name) === normalize(mapper.name));
  if (named) return named;
  const matches = games.filter(game => game.id === mapper.id);
  return matches.length === 1 ? matches[0] : null;
}
export const dexForSpecies = name => species.get(normalize(name)) || null;

// Adapt mapper paths at the read boundary. The transport keeps the original schema.
export function resolvePokemonValue(path, read, mapper, version = null) {
  const game = identifyGame(mapper);
  if (!game) return read(path);
  if (path === 'meta.game_key') return game.key;
  if (path === 'meta.generation') return game.generation;
  if (path === 'meta.game_version') return game.versions.includes(version) ? version : game.versions.length === 1 ? game.versions[0] : null;
  if (['red_blue', 'yellow'].includes(game.key) && /^pokedex\.seen\.\d+$/.test(path)) {
    const dex = Number(path.split('.').at(-1));
    if (dex < 1 || dex > 151) return null;
    const seen = read('player.pokedex_seen');
    return Array.isArray(seen) && typeof seen[dex - 1] === 'boolean' ? seen[dex - 1] : null;
  }
  if (['red_blue', 'yellow', 'gold_silver'].includes(game.key) && /^pokedex\.caught\.\d+$/.test(path)) {
    const dex = Number(path.split('.').at(-1));
    if (dex < 1 || dex > (game.generation === 1 ? 151 : 251)) return null;
    // Gamehook decodes bitArray in byte order, least significant bit first.
    // Owned flags use national dex minus one, not Gen 1's internal species IDs.
    const caught = read('player.pokedex_caught');
    return Array.isArray(caught) && typeof caught[dex - 1] === 'boolean' ? caught[dex - 1] : null;
  }
  if (path === 'battle.mode') {
    if (!['Battle', 'To Battle', 'ToBattle', 'From Battle', 'FromBattle'].includes(read('meta.state'))) return 'None';
    const mode = read(path);
    if (['Wild', 'Trainer'].includes(mode)) return mode;
    if (mode === 1) return 'Wild';
    if (mode === 2) return 'Trainer';
    const trainer = game.trainerFlag ? read(game.trainerFlag) : null;
    if (trainer === true || trainer === 1) return 'Trainer';
    if (trainer === false || trainer === 0) return 'Wild';
    const name = read('battle.opponent.trainer');
    if (name === 0 || ['0', '--', 'None'].includes(name)) return 'Wild';
    return typeof name === 'string' && name !== '' ? 'Trainer' : null;
  }
  let resolved = path;
  if (game.generation >= 4 && path.startsWith('battle.opponent.active_pokemon.')) {
    const wild = resolvePokemonValue('battle.mode', read, mapper, version) === 'Wild';
    const initialized = read('meta.state') === 'Battle' && read('battle.opponent.active_pokemon.stats.hp_max') > 0;
    const wildDex = read('battle.wild.0.dex_number');
    if (wild && !initialized && Number.isInteger(wildDex) && wildDex > 0) {
      resolved = path.replace('battle.opponent.active_pokemon.', 'battle.wild.0.');
    }
  }
  if (game.activeSource === 'party' && path.startsWith('player.active_pokemon.')) {
    const inBattle = ['Battle', 'FromBattle', 'From Battle'].includes(read('meta.state'));
    let position = read('player.party_position');
    if (inBattle && game.generation === 5) position = read('battle.player.party_position') ?? read('battle.TESTING.player_indirect_1') ?? position;
    if (!Number.isInteger(position) || position < 0 || position > 5) {
      position = 0;
      for (let slot = 0; slot < 6; slot++) {
        if (read(`player.team.${slot}.stats.hp`) > 0) { position = slot; break; }
      }
    }
    resolved = path.replace('player.active_pokemon.', `player.team.${position}.`);
    const field = path.slice('player.active_pokemon.'.length);
    if (inBattle && read('meta.state') === 'Battle' && ['type_1', 'type_2', 'held_item'].includes(field)) {
      const maximum = read('battle.player.active_pokemon.stats.hp_max');
      const current = read(`battle.player.active_pokemon.${field}`);
      if (Number.isFinite(maximum) && maximum > 0 && current != null) return current;
    }
  }
  const value = read(resolved);
  if (value != null) return value;
  if (resolved.endsWith('.dex_number')) return dexForSpecies(read(resolved.replace(/dex_number$/, 'species')));
  if (game.generation === 5 && /\.moves\.\d+\.pp$/.test(resolved)) return read(resolved + '_1');
  return value;
}
