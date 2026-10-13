import { render } from 'solid-js/web';
import { GamehookProvider, Scene, ConnectedOverlay, ConnectionStatus } from '@overlay';
import config from './config.js';
import demo from './demo.js';
import Overlay from './Overlay.jsx';
import { registry, identifyGame, resolvePokemonValue } from './games/index.js';
import '../shared/base.css';
import '../shared/ui.css';
import './style.css';

const params = new URLSearchParams(location.search);
const isDemo = params.get('demo') === '1';
const version = isDemo ? params.get('version') || config.version : config.version;
render(() => (
  <GamehookProvider config={config} demo={isDemo ? demo : undefined}
    demoMapper={registry[params.get('game')] || registry.crystal}
    acceptMapper={mapper => Boolean(identifyGame(mapper))}
    mapperRequirement="supported Pokémon game mapper"
    resolveValue={(path, read, mapper) => resolvePokemonValue(path, read, mapper, version)}>
    <Scene width={config.width} height={config.height}>
      <ConnectedOverlay><Overlay /></ConnectedOverlay>
      <ConnectionStatus />
    </Scene>
  </GamehookProvider>
), document.getElementById('root'));
