import { render } from 'solid-js/web';
import { GamehookProvider } from './gamehook.jsx';
import { Scene, ConnectedDisplay, ConnectionStatus } from './components.jsx';

// Mounts a stream overlay: provider, scaled scene, connection boundary, and the global waiting indicator.
// `provider` takes the GamehookProvider props (config, demo, acceptMapper, resolveValue, ...).
export function mountOverlay(Overlay, provider, overlayProps = {}) {
  render(() => (
    <GamehookProvider {...provider}>
      <Scene width={provider.config.width} height={provider.config.height}>
        <ConnectedDisplay><Overlay {...overlayProps} /></ConnectedDisplay>
        <ConnectionStatus />
      </Scene>
    </GamehookProvider>
  ), document.getElementById('root'));
}

// Mounts a bottom screen. `App` renders its own <BottomScreen>, connection boundary, and indicator,
// because it needs the provider's data to choose theme and focus.
export function mountScreen(App, provider) {
  render(() => <GamehookProvider {...provider}><App /></GamehookProvider>, document.getElementById('root'));
}
