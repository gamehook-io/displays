// Explicit design fixtures. Live connections never read these values.
import { registry } from './games/index.js';
import { experienceThresholds } from './experience.js';
const pokemon = (species, dex, level, stats, moves, heldItem = 'None') => ({
  species, dex_number: dex, nickname: species.toUpperCase(), level, held_item: heldItem, status_condition: 0,
  // Gender sources: Gen 2 Attack DV, Gen 3+ personality value low byte. These values read as male.
  ivs: { attack: 10 }, internals: { personality_value: 0x5a3c9e80 },
  stats,
  moves: Object.fromEntries(moves.map(([move, pp], slot) => [slot, { move, pp }])),
});

export function createDemo(params = new URLSearchParams()) {
  const totodile = params.get('pokemon') === 'totodile';
  const active = totodile
    ? pokemon('Totodile', 158, 5, { hp: 20, hp_max: 20, attack: 12, defense: 12, speed: 10, special_attack: 10, special_defense: 10 }, [['Scratch', 35], ['Leer', 30]], 'Berry')
    : pokemon('Quilava', 156, 33, { hp: 96, hp_max: 96, attack: 64, defense: 61, speed: 75, special_attack: 79, special_defense: 65 }, [['Flame Wheel', 25], ['Quick Attack', 30], ['Ember', 25], ['Smokescreen', 20]], 'Charcoal');
  const enemy = pokemon('Magnemite', 81, 20, { hp: 43, hp_max: 43, attack: 24, defense: 39, speed: 27, special_attack: 46, special_defense: 29 }, [['Tackle', 35], ['ThunderShock', 30], ['Supersonic', 20], ['SonicBoom', 20]]);
  const demo = {
    meta: { state: 'Battle' },
    overlay: { resets: 12, blackouts: 14 },
    game_time: { hours: 0, minutes: 42, seconds: 30, frames: 9 },
    player: { team_count: 1, active_pokemon: active, badges: { 0: true, 1: true, 2: true, 3: true, 4: true } },
    battle: {
      mode: 'Trainer',
      player: { active_pokemon: { stats: structuredClone(active.stats), moves: structuredClone(active.moves) } },
      opponent: { trainer: 'Scientist', name: 'ROSS', team_count: params.get('team') === '6' ? 6 : 3, active_pokemon: enemy, team: Object.fromEntries(Array.from({ length: 6 }, (_, slot) => [slot, structuredClone(enemy)])) },
    },
    overworld: { map_name: 'New Bark Town', map_group: 'New Bark', map_index: 4, movement_state: 'Walk' },
    time: { current: { time_of_day: params.get('time') === 'night' ? 'Night' : params.get('time') === 'morning' ? 'Morning' : 'Day' } },
    pokedex: { caught: { 16: true, 19: false, 161: false, 163: true, 187: false } },
  };
  // Show hurt and fainted trainer Pokémon.
  demo.battle.opponent.team[1].stats.hp = 18;
  demo.battle.opponent.team[2].stats.hp = 0;
  // Two known moves; the other slots render empty.
  demo.battle.opponent.team[1].moves = { 0: { move: 'Tackle', pp: 35 }, 1: { move: 'ThunderShock', pp: 30 }, 2: { move: 0, pp: 0 }, 3: { move: 0, pp: 0 } };
  // Crystal reads the active Pokémon directly; the party fixture drives the Poké Ball strip.
  demo.player.team = {
    0: active,
    1: pokemon('Pidgeotto', 17, 22, { hp: 41, hp_max: 63, attack: 40, defense: 38, speed: 49, special_attack: 33, special_defense: 33 }, [['Gust', 35]]),
    2: pokemon('Geodude', 74, 18, { hp: 0, hp_max: 45, attack: 44, defense: 50, speed: 18, special_attack: 22, special_defense: 22 }, [['Tackle', 35]]),
    3: { ...pokemon('Mareep', 179, 15, { hp: 30, hp_max: 44, attack: 22, defense: 21, speed: 21, special_attack: 30, special_defense: 23 }, [['Thundershock', 30]]), status_condition: 'PSN' },
  };
  demo.player.team_count = 4;
  demo.player.party_position = 0;
  // Female preview: Gen 2 Attack DV 1, Gen 3+ low byte 0x10.
  if (params.get('gender') === 'female' || totodile) Object.assign(active, { ivs: { attack: 1 }, internals: { personality_value: 0x5a3c9e10 } });
  if (params.get('type')) active.type_1 = params.get('type');
  if (params.get('status')) active.status_condition = params.get('status');
  if (params.get('counters') === 'none') demo.overlay = {};
  const battle = params.get('battle');
  if (battle === 'wild' || battle === 'intro') {
    // Stale trainer fields deliberately remain, to exercise the wild display boundary.
    demo.battle.mode = 'Wild';
    demo.battle.opponent.trainer = 0;
    Object.assign(enemy, { type_1: 'Electric', type_2: 'Steel', status_condition: 'Healthy' });
  }
  if (battle === 'intro') {
    demo.meta.state = 'To Battle';
    demo.battle.player.active_pokemon = {
      stats: Object.fromEntries(Object.keys(active.stats).map(key => [key, null])),
      moves: Object.fromEntries([0, 1, 2, 3].map(slot => [slot, { move: null, pp: null }])),
    };
  } else if (battle === 'none') {
    demo.meta.state = 'Overworld';
    demo.battle.mode = 0;
  }
  if (params.get('location') === 'route') Object.assign(demo.overworld, { map_name: 'Route 29', map_index: 3 });
  if (params.get('route') === '35') Object.assign(demo.overworld, { map_name: 'Route 35', map_group: 'Violet', map_index: 2 });
  if (params.get('movement') === 'surf') demo.overworld.movement_state = 'Surf';
  // Largest Crystal table (12 species), and an explicit map override for previews.
  if (params.get('map')) { const [group, index] = params.get('map').split(':').map(Number); Object.assign(demo.overworld, { map_name: 'Route 1 (preview)', map_group: group, map_index: index }); }
  if (params.get('pokemon') === 'none') {
    demo.meta.state = 'No Pokemon';
    demo.player.team_count = 0;
    demo.player.active_pokemon = {};
    demo.battle.mode = 0;
  }
  const game = registry[params.get('game')] || registry.crystal;
  if (game.key !== 'crystal') {
    delete demo.pokedex;
    if (game.generation !== 2) delete demo.time;
    demo.overworld = { map_name: game.generation === 2 || game.key === 'heartgold_soulsilver' ? 'Route 29' : game.generation === 3 && game.key !== 'firered_leafgreen' ? 'Route 101' : game.generation === 4 ? 'Route 201' : 'Route 1' };
    if (game.key === 'gold_silver') demo.player.pokedex_caught = Array.from({ length: 256 }, (_, bit) => bit === 15 || bit === 157);
    if (game.generation === 1) {
      demo.player.pokedex_caught = Array.from({ length: 152 }, (_, bit) => bit === 15 || bit === 24);
      for (const creature of [active, enemy, ...Object.values(demo.battle.opponent.team)]) {
        creature.species = 'Pikachu'; creature.dex_number = 25;
        creature.stats.special = creature.stats.special_attack;
        delete creature.stats.special_attack; delete creature.stats.special_defense;
        delete creature.held_item;
        delete creature.type_1; delete creature.type_2;
        creature.moves = { 0: { move: 'ThunderShock', pp: 25 }, 1: { move: 'Growl', pp: 30 }, 2: { move: 'Tail Whip', pp: 25 }, 3: { move: 'Quick Attack', pp: 20 } };
      }
      const stats = demo.battle.player.active_pokemon.stats;
      stats.special = stats.special_attack;
      delete stats.special_attack; delete stats.special_defense;
      if (battle !== 'intro') demo.battle.player.active_pokemon.moves = structuredClone(active.moves);
      demo.overworld.encounter_table = { common: { 0: { dex_number: 16, species: 'Pidgey', level: 3 }, 1: { dex_number: 19, species: 'Rattata', level: 4 } } };
    }
    if (game.activeSource === 'party') {
      active.species = game.generation === 5 ? 'Oshawott' : 'Piplup';
      active.dex_number = game.generation === 5 ? 501 : 393;
      active.nickname = active.species.toUpperCase();
      active.moves = game.generation === 5
        ? { 0: { move: 'Water Gun', pp: 25 }, 1: { move: 'Tackle', pp: 30 }, 2: { move: 'Focus Energy', pp: 25 }, 3: { move: 'Razor Shell', pp: 10 } }
        : { 0: { move: 'Bubble', pp: 25 }, 1: { move: 'Peck', pp: 30 }, 2: { move: 'Water Sport', pp: 15 }, 3: { move: 'Growl', pp: 20 } };
      if (battle !== 'intro') demo.battle.player.active_pokemon.moves = structuredClone(active.moves);
      delete demo.game_time.frames;
      delete demo.player.active_pokemon;
      demo.player.team = params.get('pokemon') === 'none' ? {} : { 0: active };
      demo.player.team_count = params.get('pokemon') === 'none' ? 0 : 1;
      demo.player.party_position = 0;
      if (game.generation === 5) {
        demo.battle.TESTING = { player_indirect_1: 0 };
        for (const moves of [active.moves, demo.battle.player.active_pokemon.moves]) {
          for (const move of Object.values(moves)) { move.pp_1 = move.pp; delete move.pp; }
        }
        demo.overworld.encounter_tables = { regular_grass: { 0: { species: 'Patrat', dex_number: 504, level: 3, level_copy: 4 } } };
      } else if (game.key === 'heartgold_soulsilver') demo.overworld.encounters = { 0: 'Pidgey', 1: 'Sentret' };
      else if (game.key === 'platinum') {
        demo.overworld.map_name = 'Route 218';
        demo.overworld.encounter_table = { surfing: { 0: { species: 'Tentacool', level_low: 20, level_high: 30 } } };
      }
      else demo.overworld.encounter_table = { walking: { 0: { species: 'Starly', level: 3 } } };
      if (params.get('encounters') === 'many' && ['diamond_pearl', 'platinum'].includes(game.key)) {
        const species = ['Starly', 'Bidoof', 'Kricketot', 'Shinx', 'Budew', 'Zubat', 'Geodude', 'Machop', 'Psyduck', 'Ponyta', 'Abra', 'Buneary', 'Pachirisu', 'Buizel', 'Shellos', 'Chingling', 'Wurmple', 'Combee'];
        demo.overworld.map_name = 'Route 205';
        demo.overworld.encounter_table = { walking: Object.fromEntries(species.map((name, slot) => [slot, { species: name, level: 10 + (slot % 6) }])) };
      }
    }
    if (game.trainerFlag) {
      const keys = game.trainerFlag.split('.');
      demo.battle[keys[1]] ||= {};
      demo.battle[keys[1]][keys[2]] = demo.battle.mode === 'Trainer';
      delete demo.battle.mode;
    }
  }
  const addExperience = entry => {
    const thresholds = experienceThresholds(entry?.dex_number, entry?.level);
    if (thresholds) entry.exp = thresholds.current + Math.floor((thresholds.next - thresholds.current) / 3);
  };
  addExperience(demo.player.active_pokemon);
  Object.values(demo.player.team || {}).forEach(addExperience);
  return demo;
}

export default createDemo(new URLSearchParams(globalThis.location?.search || ''));
