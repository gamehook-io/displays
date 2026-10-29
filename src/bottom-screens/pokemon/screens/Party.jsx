import { For, Show } from 'solid-js';
import { Meter, useGamehook } from '@display';
import { experienceProgress } from '../../../shared/pokemon/experience.js';
import HpMeter from '../../../shared/HpMeter.jsx';
import { palettes, activeTypes } from '../../../shared/pokemon/types.js';
import { partySlots } from '../../../shared/pokemon/party.js';
import { usePartySlot } from '../../../shared/pokemon/usePartySlot.js';
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

function Slot(props) {
  const mon = usePartySlot(() => props.slot);
  const gamehook = useGamehook();
  const progress = () => experienceProgress(mon.dex(), mon.level(), gamehook.value(`${mon.path()}.exp`, null));
  // Each card is tinted by the Pokémon's own primary type.
  const types = () => activeTypes(gamehook.value, mon.path());
  const tint = () => { const [, mid, light] = palettes[types()[0]] || palettes.neutral; return { '--slot': mid, '--slot-light': light }; };
  const hpClass = () => mon.fainted() ? 'low' : !(mon.hpMax() > 0) ? '' : mon.hp() / mon.hpMax() <= .2 ? 'low' : mon.hp() / mon.hpMax() <= .5 ? 'mid' : '';
  return <Show when={mon.occupied()} fallback={<div class="slot slot-empty" aria-label={`Slot ${props.slot + 1}: empty`}><svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h6M15 12h6" /><circle cx="12" cy="12" r="2.6" /></svg></div>}>
    <button type="button" class="slot" classList={{ fainted: mon.fainted() }} style={tint()} data-nav-default={props.first ? '' : undefined} onClick={() => props.nav.push('summary', { slot: props.slot })}>
      <span class="slot-figure"><span class="slot-art"><Mon dex={mon.dex()} /></span><Show when={mon.level() != null}><b class="slot-level">Lv. {mon.level()}</b></Show></span>
      <span class="slot-info">
        <strong>{mon.name()}</strong>
        <span class="slot-line"><Show when={mon.fainted()} fallback={<Show when={mon.condition()}>{status => <i class="status" style={{ background: status().color }}>{status().label}</i>}</Show>}><i class="status fainted-tag">Fainted</i></Show></span>
        <div class="slot-bar"><span>HP</span><HpMeter value={mon.hp()} max={mon.hpMax()} /><small class={`hp-text ${hpClass()}`}>{Number.isFinite(mon.hp()) && Number.isFinite(mon.hpMax()) ? `${mon.hp()} / ${mon.hpMax()}` : ''}</small></div>
        <Show when={progress()}>{amount => <div class="slot-bar"><span>EXP</span><Meter label="Experience" value={amount().value} max={amount().max} color="#2880f0" /><small>{amount().value} / {amount().max}</small></div>}</Show>
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
