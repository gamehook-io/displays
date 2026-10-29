import pokemon from './pokemon-types.json' with { type: 'json' };
import { isBlank } from './party.js';

export const palettes = {
  normal: ['#29272b', '#716b75', '#c4b9be'],
  fire: ['#290907', '#a6310b', '#ffc261'],
  water: ['#071d37', '#18699c', '#77d9f4'],
  electric: ['#302506', '#9b7615', '#ffe173'],
  grass: ['#112a16', '#397346', '#a5dc77'],
  ice: ['#16353f', '#5a9ead', '#d5f8ff'],
  fighting: ['#300d10', '#8b3540', '#ec8b70'],
  poison: ['#251030', '#743784', '#d49de8'],
  ground: ['#322215', '#896445', '#e1bf80'],
  flying: ['#1f2948', '#657aad', '#cdddfa'],
  psychic: ['#36102e', '#a43e77', '#ffacd6'],
  bug: ['#242c0b', '#6d7f23', '#d5e68a'],
  rock: ['#28231c', '#746650', '#cbb995'],
  ghost: ['#171226', '#4c3d77', '#b4a2df'],
  dragon: ['#161335', '#55439d', '#afa0f4'],
  dark: ['#100f16', '#39303f', '#a491a2'],
  steel: ['#202b34', '#657a89', '#d6e3ea'],
  fairy: ['#381a36', '#a566a0', '#fbd2ee'],
  stellar: ['#152b39', '#547898', '#b1eee6'],
  curse: ['#221d2b', '#64566f', '#cbb8da'],
  neutral: ['#252629', '#53565c', '#aaaeb7'],
};

const byName = new Map(Object.values(pokemon).map(entry => [entry.name, entry]));
const normalize = value => typeof value === 'string' && Object.hasOwn(palettes, value.toLowerCase()) && value.toLowerCase() !== 'neutral' ? value.toLowerCase() : null;
export function speciesTypes(dex, generation = 2) {
  const entry = pokemon[dex];
  const past = Object.keys(entry?.pastTypes || {}).map(Number).filter(limit => limit >= generation).sort((a, b) => a - b)[0];
  return entry?.pastTypes?.[past] || entry?.types || [];
}

export function hasPokemon(value, path) {
  if (value('meta.state', null) === 'No Pokemon' || value('player.team_count', null) === 0) return false;
  const dex = Number(value(`${path}.dex_number`, 0));
  const species = value(`${path}.species`, null);
  return dex > 0 || !isBlank(species);
}

export function activeTypes(value, path) {
  if (!hasPokemon(value, path)) return [];
  const dex = Number(value(`${path}.dex_number`, 0));
  const species = value(`${path}.species`, null);
  const first = normalize(value(`${path}.type_1`, null));
  if (first) return [...new Set([first, normalize(value(`${path}.type_2`, null))].filter(Boolean))];
  const entry = pokemon[dex] || byName.get(String(species).toLowerCase());
  const number = dex || Object.keys(pokemon).find(key => pokemon[key] === entry);
  return speciesTypes(number, Number(value('meta.generation', 2)));
}

// Resolve colors in JavaScript so older OBS browser engines do not need CSS color-mix().
function tint(color, target, amount) {
  const channels = hex => hex.slice(1).match(/../g).map(value => parseInt(value, 16));
  const source = channels(color), destination = channels(target);
  return '#' + source.map((value, index) => Math.round(value + (destination[index] - value) * amount).toString(16).padStart(2, '0')).join('');
}

export function themeStyle(type) {
  const [deep, mid, light] = palettes[type] || palettes.neutral;
  return {
    '--theme-deep': tint(deep, '#05060a', 0.35), '--theme-mid': mid, '--theme-light': light,
    '--theme-dusk': tint(mid, deep, 0.6),
    '--theme-glow': mid + '99',
    '--theme-edge': light + '40',
    '--theme-light-a': light + '38',
    '--primary': mid,
    '--primary-border': tint(mid, deep, 0.25),
    '--primary-subtle': tint(light, '#ffffff', 0.35),
    '--primary-surface': tint(light, '#ffffff', 0.15),
    '--primary-highlight': tint(light, '#ffffff', 0.7),
    '--primary-text': tint(deep, '#000000', 0.2),
    '--primary-muted': tint(mid, deep, 0.55),
    '--primary-divider': tint(mid, light, 0.25),
    '--primary-stripe': tint(light, '#ffffff', 0.5) + '55',
    '--primary-shadow': mid + '55',
    '--primary-meter-track': deep + '40',
  };
}
