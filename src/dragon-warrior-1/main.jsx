import { render } from 'solid-js/web';
import { GamehookProvider, Scene, ConnectedOverlay, ConnectionStatus } from '@overlay';
import config from './config.js';
import Overlay from './Overlay.jsx';
import { mapper, acceptsMapper } from './data.js';
import { createDragonWarriorDemo } from './demo.js';
import '../shared/base.css';
import '../shared/ui.css';
import './style.css';

const params = new URLSearchParams(location.search);
const isDemo = params.get('demo') === '1';
render(() => (
  <GamehookProvider config={{ ...config, mapperId: mapper.id }}
    demo={isDemo ? createDragonWarriorDemo(params) : undefined}
    demoMapper={mapper} acceptMapper={acceptsMapper}
    mapperRequirement="Dragon Warrior (NES) mapper">
    <Scene width={config.width} height={config.height}>
      <ConnectedOverlay><Overlay fillOpening={params.get('transparent') === '1' ? false : undefined} /></ConnectedOverlay>
      <ConnectionStatus />
    </Scene>
  </GamehookProvider>
), document.getElementById('root'));
