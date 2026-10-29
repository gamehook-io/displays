import { For, Show } from 'solid-js';
import { useGamehook } from '@display';
import HpMeter from '../../../shared/HpMeter.jsx';
import { Meter } from '@display';
import { activeTypes } from '../../../shared/pokemon/types.js';
import { palettes } from '../../../shared/pokemon/types.js';
import { moveType } from '../../../shared/pokemon/moves.js';
import { experienceProgress } from '../../../shared/pokemon/experience.js';
import { pokemonGender } from '../../../shared/pokemon/gender.js';
import { statsForGeneration } from '../../../shared/pokemon/stats.js';
import { isBlank, occupiedSlots as occupied } from '../../../shared/pokemon/party.js';
import { usePartySlot } from '../../../shared/pokemon/usePartySlot.js';
import Header from '../Header.jsx';
import Mon from '../Mon.jsx';

const cap = text => text.charAt(0).toUpperCase() + text.slice(1);

export default function Summary(props) {
  const gamehook = useGamehook();
  const slot = () => props.params.slot;
  const mon = usePartySlot(slot);
  const occupiedSlots = () => occupied(gamehook.value);
  const step = delta => { const list = occupiedSlots(); const at = list.indexOf(slot()); const next = list[at + delta]; if (next != null) props.nav.replace('summary', { slot: next }); };
  const types = () => activeTypes(gamehook.value, mon.path());
  const gender = () => pokemonGender(gamehook.value, mon.path());
  const stat = key => gamehook.value(`${mon.path()}.stats.${key}`, null);
  const stats = () => statsForGeneration(gamehook.value('meta.generation')).map(([key, label]) => ({ key, label, value: stat(key) })).filter(entry => Number.isFinite(entry.value));
  const progress = () => experienceProgress(mon.dex(), mon.level(), gamehook.value(`${mon.path()}.exp`, null));
  const moves = () => [0, 1, 2, 3].map(index => ({
    index,
    name: gamehook.value(`${mon.path()}.moves.${index}.move`, null),
    pp: gamehook.value(`${mon.path()}.moves.${index}.pp`, null),
  })).filter(move => !isBlank(move.name));
  const color = move => {
    const type = moveType(move.name, gamehook.value(`${mon.path()}.hidden_power.type`), gamehook.value('meta.generation', 2));
    return type ? palettes[type]?.[1] : undefined;
  };
  const position = () => `${occupiedSlots().indexOf(slot()) + 1}/${occupiedSlots().length}`;
  return <section class="bs-screen">
    <Header nav={props.nav} title="Summary">
      <button type="button" class="step" aria-label="Previous Pokémon" data-shoulder="-1" disabled={occupiedSlots().indexOf(slot()) <= 0} onClick={() => step(-1)}>‹</button>
      <span class="step-count">{position()}</span>
      <button type="button" class="step" aria-label="Next Pokémon" data-shoulder="1" disabled={occupiedSlots().indexOf(slot()) >= occupiedSlots().length - 1} onClick={() => step(1)}>›</button>
    </Header>
    <Show when={mon.occupied()} fallback={<p class="empty-note">This slot is empty.</p>}>
      <div class="summary">
        <div class="summary-card">
          <div class="summary-art"><Mon dex={mon.dex()} art /></div>
          <h2>{mon.name()}<Show when={gender()}><span class={`gender gender-${gender()}`} aria-label={cap(gender())}>{gender() === 'female' ? '♀' : '♂'}</span></Show></h2>
          <div class="summary-line"><Show when={mon.level() != null}><b>Lv. {mon.level()}</b></Show>
            <For each={types()}>{type => <span class="type-chip" style={{ background: palettes[type]?.[1] }}>{cap(type)}</span>}</For>
            <Show when={mon.condition()}>{status => <i class="status" style={{ background: status().color }}>{status().label}</i>}</Show></div>
          <div class="summary-hp"><span>HP</span><HpMeter value={mon.hp()} max={mon.hpMax()} /><b>{mon.hp()} / {mon.hpMax()}</b></div>
          <Show when={progress()}>{amount => <div class="summary-hp"><span>EXP</span><Meter label="Experience" value={amount().value} max={amount().max} color="#2880f0" /><b>{amount().max - amount().value} to next</b></div>}</Show>
          <Show when={mon.heldItem()}>{item => <p class="held">Holding <strong>{item()}</strong></p>}</Show>
        </div>
        <div class="summary-side">
          <Show when={stats().length}><div class="stat-list"><For each={stats()}>{entry => <div><span>{entry.label}</span><b>{entry.value}</b></div>}</For></div></Show>
          <Show when={moves().length}><ul class="move-list"><For each={moves()}>{move => <li style={{ '--move': color(move) }}><span>{move.name}</span><Show when={Number.isFinite(move.pp)}><b>PP {move.pp}</b></Show></li>}</For></ul></Show>
        </div>
      </div>
    </Show>
  </section>;
}
