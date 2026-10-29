import { For, Show } from 'solid-js';
import { setting, setColor, toggleSetting } from '../settings.js';
import { customPalette } from '../settings.js';
import Header from '../Header.jsx';

const options = [
  { key: 'sounds', label: 'Menu sounds', note: 'Little blips when moving and selecting.' },
];

const channels = [['R', 0], ['G', 1], ['B', 2]];

export default function Settings(props) {
  const custom = () => Array.isArray(setting('color'));
  const rgb = () => (custom() ? setting('color') : [64, 128, 240]);
  const update = (index, value) => setColor(rgb().map((channel, at) => (at === index ? value : channel)));
  return <section class="bs-screen">
    <Header nav={props.nav} title="Settings" />
    <div class="color-panel">
      <strong>Primary color</strong>
      <div class="color-modes">
        <button type="button" aria-pressed={!custom()} data-nav-default onClick={() => setColor('default')}>Default</button>
        <button type="button" aria-pressed={custom()} onClick={() => setColor(rgb())}>Custom</button>
        <Show when={custom()}><span class="color-swatch" style={{ background: customPalette(rgb())[1] }} /></Show>
      </div>
      <Show when={custom()}><div class="color-sliders"><For each={channels}>{([label, index]) => <>
        <span>{label}</span><input type="range" min="0" max="255" value={rgb()[index]} aria-label={label} onInput={event => update(index, Number(event.currentTarget.value))} /><b>{rgb()[index]}</b>
      </>}</For></div></Show>
    </div>
    <ul class="settings">
      <For each={options}>{option => <li><button type="button" class="setting" role="switch" aria-checked={setting(option.key)} onClick={() => toggleSetting(option.key)}>
        <span><strong>{option.label}</strong><small>{option.note}</small></span>
        <i class="switch" classList={{ on: setting(option.key) }} aria-hidden="true" />
      </button></li>}</For>
    </ul>
  </section>;
}
