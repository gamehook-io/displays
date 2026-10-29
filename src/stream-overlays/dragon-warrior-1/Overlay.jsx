import { Show } from 'solid-js';
import config from './config.js';
import HeroStatus from './HeroStatus.jsx';
import Inventory from './Inventory.jsx';
import Spellbook from './Spellbook.jsx';
import Journey from './Journey.jsx';
import './style.css';

export default function DragonWarriorOverlay(props) {
  const fill = () => props.fillOpening ?? (config.fillOpening !== false);
  return <div class="dragon-warrior-overlay" classList={{ 'dw-filled': fill() }}>
    <Show when={fill()}><div class="dw-backdrop" /></Show>
    <aside class="dw-rail dw-left"><header class="dw-brand"><span>DRAGON</span><strong>WARRIOR</strong></header>
      <HeroStatus /><Spellbook />
    </aside>
    <aside class="dw-rail dw-right"><Journey /><Inventory /></aside>
  </div>;
}
