import { For, Show, createMemo } from 'solid-js';
import { useGamehook } from '@display';
import { speciesName } from '../../../shared/pokemon/names.js';
import { dexCounts, dexTotal } from '../../../shared/pokemon/pokedex.js';
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

export default function Pokedex(props) {
  const gamehook = useGamehook();
  const entries = createMemo(() => Array.from({ length: dexTotal(gamehook.value) }, (_, index) => ({ dex: index + 1, caught: gamehook.value(`pokedex.caught.${index + 1}`, null) })));
  const counts = createMemo(() => dexCounts(gamehook.value));
  return <section class="bs-screen">
    <Header nav={props.nav} title="Pokédex"><Show when={counts()}>{count => <span class="money">{count().seen != null ? `${count().seen} seen · ` : ''}{count().caught} caught</span>}</Show></Header>
    <Show when={counts()} fallback={<p class="empty-note">This game's mapper does not expose caught Pokémon.</p>}>
      <ul class="dex" tabindex="0" data-nav data-scroll aria-label="Pokédex"><For each={entries()}>{entry => <li classList={{ caught: entry.caught === true }} title={`${String(entry.dex).padStart(3, '0')} ${speciesName(entry.dex) ?? ''}`} aria-label={`${entry.dex} ${speciesName(entry.dex)}${entry.caught ? '' : ', not caught'}`}>
        <Mon dex={entry.dex} lazy />
      </li>}</For></ul>
    </Show>
  </section>;
}
