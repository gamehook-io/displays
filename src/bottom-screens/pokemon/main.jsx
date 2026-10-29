import { mountScreen } from '@display';
import config from './config.js';
import App from './App.jsx';
import createDemo from './demo.js';
import { registry, identifyGame, resolvePokemonValue } from '../../shared/pokemon/games/index.js';
import '../../shared/base.css';
import '../../shared/ui.css';
import '../../shared/screen.css';
import './style.css';

const params = new URLSearchParams(location.search);
const isDemo = params.get('demo') === '1';
const version = isDemo ? params.get('version') || config.version : config.version;
mountScreen(App, {
  config, demo: isDemo ? createDemo(params) : undefined,
  demoMapper: registry[params.get('game')] || registry.crystal,
  acceptMapper: mapper => Boolean(identifyGame(mapper)),
  mapperRequirement: 'supported Pokémon game mapper',
  resolveValue: (path, read, mapper) => resolvePokemonValue(path, read, mapper, version),
});
