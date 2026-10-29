import { For, Show } from 'solid-js';
import { useGamehook } from '@display';
import HpMeter from '../../../shared/HpMeter.jsx';
import { partySlots } from '../../../shared/pokemon/party.js';
import { usePartySlot } from '../../../shared/pokemon/usePartySlot.js';
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

function Slot(props) {
  const mon = usePartySlot(() => props.slot);
  const gamehook = useGamehook();
  const lead = () => props.slot === (Number.isInteger(gamehook.value('player.party_position', null)) ? gamehook.value('player.party_position', null) : 0);
  return <Show when={mon.occupied()} fallback={<div class="slot slot-empty" aria-label={`Slot ${props.slot + 1}: empty`} />}>
    <button type="button" class="slot" classList={{ fainted: mon.fainted(), lead: lead() }} data-nav-default={props.first ? '' : undefined} onClick={() => props.nav.push('summary', { slot: props.slot })}>
      <span class="slot-art"><Mon dex={mon.dex()} /></span>
      <span class="slot-info">
        <strong>{mon.name()}</strong>
        <span class="slot-line"><Show when={mon.level() != null}><b>Lv. {mon.level()}</b></Show><Show when={mon.fainted()} fallback={<Show when={mon.condition()}>{status => <i class="status" style={{ background: status().color }}>{status().label}</i>}</Show>}><i class="status fainted-tag">Fainted</i></Show></span>
        <HpMeter value={mon.hp()} max={mon.hpMax()} />
        <Show when={Number.isFinite(mon.hp()) && Number.isFinite(mon.hpMax())}><small>{mon.hp()} / {mon.hpMax()}</small></Show>
      </span>
    </button>
  </Show>;
}

export default function Party(props) {
  return <section class="bs-screen">
    <Header nav={props.nav} title="Pokémon" />
    <div class="party-grid"><For each={partySlots}>{slot => <Slot slot={slot} nav={props.nav} first={slot === 0} />}</For></div>
  </section>;
}
