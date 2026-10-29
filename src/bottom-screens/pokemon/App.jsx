import { createEffect } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { BottomScreen, ConnectedDisplay, ConnectionStatus, createNavigator, useGamehook } from '@display';
import config from './config.js';
import { palettes, activeTypes } from '../../shared/pokemon/types.js';
import { paths } from '../../shared/pokemon/paths.js';
import Home from './screens/Home.jsx';
import Party from './screens/Party.jsx';
import Summary from './screens/Summary.jsx';
import Bag from './screens/Bag.jsx';
import Pokedex from './screens/Pokedex.jsx';
import Area from './screens/Area.jsx';
import Settings from './screens/Settings.jsx';
import { setting, customPalette } from './settings.js';
import { playSound } from './sounds.js';

const screens = { home: Home, party: Party, summary: Summary, bag: Bag, dex: Pokedex, area: Area, settings: Settings };

export default function App() {
  const gamehook = useGamehook();
  const nav = createNavigator('home');
  // The lead Pokémon's type tints the screen.
  const palette = () => Array.isArray(setting('color')) ? customPalette(setting('color')) : palettes[activeTypes(gamehook.value, paths.active)[0] || 'neutral'];
  let app, quiet = false;
  // Move focus into each newly opened screen so the keyboard works straight away.
  createEffect(() => {
    nav.current();
    queueMicrotask(() => {
      quiet = true;
      const target = app?.querySelector('[data-nav-default]:not(:disabled)') || app?.querySelector('button:not(:disabled)');
      target?.focus({ preventScroll: true });
      quiet = false;
    });
  });
  return <BottomScreen width={config.width} height={config.height} onBack={() => { if (!nav.canGoBack()) return false; nav.back(); return true; }}>
    <ConnectedDisplay>
      <div class="bs-app" ref={app} onFocusIn={() => { if (!quiet) playSound('move'); }} onClick={event => { const button = event.target.closest?.('button'); if (button && !button.disabled) playSound(button.classList.contains('back') ? 'back' : 'select'); }} style={{ '--accent-dark': palette()[0], '--accent': palette()[1], '--accent-light': palette()[2] }}>
        <div class={`bs-slide ${nav.direction()}`} data-screen={nav.current().screen}>
          <Dynamic component={screens[nav.current().screen]} nav={nav} params={nav.current().params} />
        </div>
      </div>
    </ConnectedDisplay>
    <ConnectionStatus />
  </BottomScreen>;
}
