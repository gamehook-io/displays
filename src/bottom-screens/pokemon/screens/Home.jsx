import { For, Show } from 'solid-js';
import { useGamehook } from '@display';
import { hasBag } from '../bag.js';
import { areaName, partyCount } from '../../../shared/pokemon/party.js';
import { paths } from '../../../shared/pokemon/paths.js';

const icons = {
  party: () => <><circle cx="12" cy="12" r="9" /><path d="M3 12h6M15 12h6" /><circle cx="12" cy="12" r="3" /></>,
  dex: () => <><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="10" r="3" /><path d="M8 17h8" /></>,
  bag: () => <><path d="M6 8h12l2 12H4z" /><path d="M9 8V6a3 3 0 016 0v2" /></>,
  area: () => <><path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
};
const pad = value => String(value).padStart(2, '0');

export default function Home(props) {
  const gamehook = useGamehook();
  const area = () => areaName(gamehook.value);
  const partySize = () => partyCount(gamehook.value);
  const time = () => {
    const part = key => gamehook.value(`${paths.time}.${key}`, null);
    return ['hours', 'minutes'].every(key => Number.isFinite(part(key))) ? `${part('hours')}:${pad(part('minutes'))}` : null;
  };
  // Fixed tile list: only the notes and enabled state are reactive, so buttons (and keyboard focus) survive live updates.
  const tiles = ['party', 'dex', 'bag', 'area'];
  const label = { party: 'Pokémon', dex: 'Pokédex', bag: 'Bag', area: 'Area' };
  const enabled = id => id !== 'bag' || hasBag(gamehook.value);
  const note = id => id === 'party' ? (partySize() ? `${partySize()} in party` : null)
    : id === 'bag' ? (enabled('bag') ? null : 'Not available')
    : id === 'area' ? area() : null;
  return <section class="bs-home" aria-label="Menu">
    <div class="home-status">
      <Show when={area()}><span>{area()}</span></Show>
      <Show when={time()}><span class="home-time">{time()}</span></Show>
    </div>
    <div class="tiles">
      <For each={tiles}>{(id, index) => <button type="button" class={`tile tile-${id}`} disabled={!enabled(id)} data-nav-default={index() === 0 ? '' : undefined} onClick={() => props.nav.push(id)}>
        <svg viewBox="0 0 24 24" width="120" height="120" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">{icons[id]()}</svg>
        <strong>{label[id]}</strong>
        <Show when={note(id)}><small>{note(id)}</small></Show>
      </button>}</For>
    </div>
  </section>;
}
