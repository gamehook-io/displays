import { createMemo } from 'solid-js';
import { GamehookProvider, Scene, ConnectedDisplay, useGamehook } from '@display';
import pokemonConfig from '../src/stream-overlays/pokemon/config.js';
import dragonWarriorConfig from '../src/stream-overlays/dragon-warrior-1/config.js';
import { createDemo } from '../src/shared/pokemon/demo.js';
import { registry, identifyGame, resolvePokemonValue } from '../src/shared/pokemon/games/index.js';
import { paths } from '../src/shared/pokemon/paths.js';
import { activeTypes, themeStyle } from '../src/shared/pokemon/types.js';
import { createDragonWarriorDemo } from '../src/stream-overlays/dragon-warrior-1/demo.js';
import { mapper as dragonWarriorMapper, acceptsMapper } from '../src/stream-overlays/dragon-warrior-1/data.js';
import '../src/shared/base.css';
import '../src/shared/ui.css';
import '../src/stream-overlays/pokemon/style.css';
import '../src/stream-overlays/dragon-warrior-1/style.css';
import './preview.css';

// Every story sets a `demo` arg using the same query parameters as ?demo=1 (for example `battle=wild&status=PSN`).
// The toolbar adds a game family and lead type on top of it. Stories with `parameters.game: 'dragon-warrior'`
// use that display's fixtures; `parameters.frame: 'scene'` fills the window; other stories sit in a 400px rail.
export const globalTypes = {
  game: { description: 'Game family', toolbar: { title: 'Game', icon: 'controller', items: ['crystal', ...Object.keys(registry).filter(key => key !== 'crystal')], dynamicTitle: true } },
  leadType: { description: 'Lead Pokémon type', toolbar: { title: 'Type', icon: 'paintbrush', items: ['auto', 'fire', 'water', 'grass', 'electric', 'psychic', 'ghost', 'dragon', 'dark', 'steel', 'fairy', 'normal'], dynamicTitle: true } },
};
export const initialGlobals = { game: 'crystal', leadType: 'auto' };

function RailFrame(props) {
  const gamehook = useGamehook();
  const type = () => activeTypes(gamehook.value, paths.active)[0] || 'neutral';
  return <div class="crystal-overlay" style={themeStyle(type())}><div class="sb-rail">{props.children}</div></div>;
}

export const decorators = [(Story, context) => {
  const dragonWarrior = context.parameters.game === 'dragon-warrior';
  const params = () => {
    const query = new URLSearchParams(context.args.demo || '');
    if (!dragonWarrior) {
      if (context.globals.game && context.globals.game !== 'crystal' && !query.has('game')) query.set('game', context.globals.game);
      if (context.globals.leadType && context.globals.leadType !== 'auto' && !query.has('type')) query.set('type', context.globals.leadType);
    }
    return query;
  };
  const demo = createMemo(() => dragonWarrior ? createDragonWarriorDemo(params()) : createDemo(params()));
  const config = dragonWarrior ? { ...dragonWarriorConfig, mapperId: dragonWarriorMapper.id } : pokemonConfig;
  const provider = dragonWarrior
    ? { demoMapper: dragonWarriorMapper, acceptMapper: acceptsMapper }
    : {
      // A getter so the toolbar's game choice updates the mapper along with the fixtures.
      get demoMapper() { return registry[params().get('game')] || registry.crystal; },
      acceptMapper: mapper => Boolean(identifyGame(mapper)),
      resolveValue: (path, read, mapper) => resolvePokemonValue(path, read, mapper, config.version),
    };
  const story = () => <ConnectedDisplay>{Story()}</ConnectedDisplay>;
  return <GamehookProvider config={config} demo={demo()} {...provider}>
    {context.parameters.frame === 'scene'
      ? <div class="sb-checker"><Scene width={config.width} height={config.height}>{story()}</Scene></div>
      : dragonWarrior ? story() : <RailFrame>{story()}</RailFrame>}
  </GamehookProvider>;
}];

export const parameters = { layout: 'fullscreen', controls: { disable: true } };
