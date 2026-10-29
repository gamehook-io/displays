import { For, Show, createMemo } from 'solid-js';
import { useGamehook } from '@display';
import pokemon from '../../../shared/pokemon/pokemon-types.json' with { type: 'json' };
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

// National dex size reachable in each generation's games.
const dexSize = { 1: 151, 2: 251, 3: 386, 4: 493, 5: 649 };

export default function Pokedex(props) {
  const gamehook = useGamehook();
  const size = () => dexSize[gamehook.value('meta.generation', 2)] || 251;
  const entries = createMemo(() => Array.from({ length: size() }, (_, index) => ({ dex: index + 1, caught: gamehook.value(`pokedex.caught.${index + 1}`, null) })));
  const known = () => entries().some(entry => typeof entry.caught === 'boolean');
  const total = () => entries().filter(entry => entry.caught === true).length;
  return <section class="bs-screen">
    <Header nav={props.nav} title="Pokédex"><Show when={known()}><span class="money">{total()} caught</span></Show></Header>
    <Show when={known()} fallback={<p class="empty-note">This game's mapper does not expose caught Pokémon.</p>}>
      <ul class="dex" tabindex="0" data-nav data-scroll aria-label="Pokédex"><For each={entries()}>{entry => <li classList={{ caught: entry.caught === true }} aria-label={`${entry.dex} ${entry.caught ? pokemon[entry.dex]?.name : 'not caught'}`}>
        <span class="dex-art"><Show when={entry.caught}><Mon dex={entry.dex} lazy /></Show></span>
        <small>{String(entry.dex).padStart(3, '0')}</small>
        <Show when={entry.caught}><strong>{pokemon[entry.dex]?.name}</strong></Show>
      </li>}</For></ul>
    </Show>
  </section>;
}
