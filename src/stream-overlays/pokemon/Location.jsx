import { Show } from 'solid-js';
import { Panel, useGamehook } from '@display';
import { areaName } from '../../shared/pokemon/party.js';
import RouteEncounters from './RouteEncounters.jsx';

export default function Location() {
  const gamehook = useGamehook();
  const name = () => areaName(gamehook.value);
  const ready = () => name() !== null;
  const kind = () => /\broute\s+\d+/i.test(name() || '') ? 'Route' : /\b(city|town)\b/i.test(name() || '') ? 'Town / City' : 'Area';
  return <section class="location-view" classList={{ 'location-route': kind() === 'Route' }}>
    <Panel class="location-summary">
      <h2>{name()}</h2>
      <Show when={ready() && kind() === 'Route'}><RouteEncounters /></Show>
    </Panel>
  </section>;
}
