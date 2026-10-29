import { For, Show, createMemo } from 'solid-js';
import { useGamehook } from '@display';
import { areaName } from '../../../shared/pokemon/party.js';
import { routeEncounters, groupEncounters } from '../../../shared/pokemon/encounters.js';
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

export default function Area(props) {
  const gamehook = useGamehook();
  const name = () => areaName(gamehook.value);
  const encounters = createMemo(() => routeEncounters(gamehook.value));
  const levels = entry => `${entry.min}${entry.max !== entry.min ? `–${entry.max}` : ''}`;
  const groups = createMemo(() => groupEncounters(encounters()));
  return <section class="bs-screen">
    <Header nav={props.nav} title="Area" />
    <div class="area">
      <h2>{name() ?? 'Unknown area'}</h2>
      <Show when={groups().length} fallback={<p class="empty-note">No wild Pokémon here.</p>}>
        <div class="area-scroll" tabindex="0" data-nav data-scroll aria-label="Wild Pokémon">
          <For each={groups()}>{group => <section class="encounter-group"><h3>{group.method}</h3>
            <ul><For each={group.entries}>{entry => <li classList={{ uncaught: gamehook.value(`pokedex.caught.${entry.dex}`, null) === false }}>
              <span class="enc-art"><Mon dex={entry.dex} /></span><strong>{entry.name}</strong>
              <Show when={entry.min != null}><span class="enc-level">Lv. {levels(entry)}</span></Show>
              <Show when={entry.chance != null}><b>{entry.chance}%</b></Show>
            </li>}</For></ul>
          </section>}</For>
        </div>
      </Show>
    </div>
  </section>;
}
