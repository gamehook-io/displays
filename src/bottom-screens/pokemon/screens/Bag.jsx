import { For, Show, createMemo, createSignal } from 'solid-js';
import { useGamehook } from '@display';
import { bagContents } from '../bag.js';
import Header from '../Header.jsx';

export default function Bag(props) {
  const gamehook = useGamehook();
  const pockets = createMemo(() => bagContents(gamehook.value));
  const [selected, setSelected] = createSignal(null);
  const pocket = () => pockets().find(item => item.key === selected()) || pockets()[0];
  const activeIndex = () => pockets().findIndex(item => item.key === pocket()?.key);
  const money = () => { const value = gamehook.value('bag.money', null); return Number.isFinite(value) ? value : null; };
  return <section class="bs-screen">
    <Header nav={props.nav} title="Bag"><Show when={money() != null}><span class="money">₽{money().toLocaleString()}</span></Show></Header>
    <Show when={pocket()} fallback={<p class="empty-note">The bag is empty.</p>}>
      <div class="bag">
        <nav class="pockets" aria-label="Pockets"><For each={pockets()}>{(item, index) => <button type="button" classList={{ active: item.key === pocket().key }} data-nav-default={item.key === pocket().key ? '' : undefined} data-shoulder={index() === activeIndex() - 1 ? '-1' : index() === activeIndex() + 1 ? '1' : undefined} aria-pressed={item.key === pocket().key} onClick={() => setSelected(item.key)}>{item.label}<small>{item.entries.length}</small></button>}</For></nav>
        <ul class="items" tabindex="0" data-nav data-scroll aria-label={pocket().label}><For each={pocket().entries}>{entry => <li><span>{entry.name}</span><Show when={entry.quantity != null}><b>×{entry.quantity}</b></Show></li>}</For></ul>
      </div>
    </Show>
  </section>;
}
