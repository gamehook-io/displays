import { Show } from 'solid-js';
import { Panel, useGamehook } from '@overlay';
import ResourceBar from '../shared/ResourceBar.jsx';
import StatGrid from '../shared/StatGrid.jsx';
import { numericEntries } from './data.js';

export default function HeroStatus() {
  const { value } = useGamehook();
  const stat = key => value(`player.stats.${key}`, null);
  const attributes = () => numericEntries(value, 'player.stats', [
    ['attack_power', 'Attack'], ['defense_power', 'Defense'], ['gold', 'Gold'], ['experience', 'Experience'],
  ]);
  const vitalsReady = () => ['hp', 'mp'].some(key => {
    const current = stat(`current_${key}`);
    const maximum = stat(`maximum_${key}`);
    return Number.isFinite(current) && Number.isFinite(maximum) &&
      (maximum > 0 || (key === 'mp' && current === 0 && maximum === 0));
  });
  return <>
    <section class="dw-hero">
      <div class="dw-emblem" aria-hidden="true"><svg viewBox="0 0 64 80" fill="none">
        <path d="M6 14L32 4l26 10v28c0 16-12 26-26 34C18 68 6 58 6 42Z" stroke="currentColor" stroke-width="2" />
        <path d="M32 15l5 8-3 29h-4l-3-29Z" fill="currentColor" />
        <path d="M22 53h20M32 54v10M28 65h8" stroke="currentColor" stroke-width="3" />
      </svg></div>
      <h1>THE HERO</h1>
      <Show when={Number.isFinite(stat('level'))}><div class="dw-level">LEVEL <b>{stat('level')}</b></div></Show>
    </section>
    <Show when={vitalsReady()}><Panel class="dw-vitals">
      <ResourceBar value={stat('current_hp')} max={stat('maximum_hp')} />
      <ResourceBar label="MP" meterLabel="Magic" value={stat('current_mp')} max={stat('maximum_mp')} color="#78a9f5" />
      <Show when={stat('maximum_mp') === 0 && stat('current_mp') === 0}><div class="dw-no-magic">MP <b>0/0</b></div></Show>
    </Panel></Show>
    <Show when={attributes().some(entry => Number.isFinite(entry.value))}><Panel title="Attributes"><StatGrid entries={attributes()} /></Panel></Show>
  </>;
}
