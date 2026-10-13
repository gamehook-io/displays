import { For, Show } from 'solid-js';
import { useGamehook } from '@overlay';
import { statusDetails } from '../status.js';
import Sprite from './Sprite.jsx';
import HpMeter from './HpMeter.jsx';

// One sprite per party slot: filled, fainted, status-afflicted, active, or empty.
export default function PartySprites() {
  const gamehook = useGamehook();
  const count = () => Math.min(6, Math.max(0, Number(gamehook.value('player.team_count', 0)) || 0));
  const occupied = slot => {
    if (slot >= count()) return false;
    const dex = Number(gamehook.value(`player.team.${slot}.dex_number`, 0));
    const species = gamehook.value(`player.team.${slot}.species`, null);
    return dex > 0 || ![null, undefined, 0, '0', ''].includes(species);
  };
  const hp = slot => gamehook.value(`player.team.${slot}.stats.hp`, null);
  const maximum = slot => gamehook.value(`player.team.${slot}.stats.hp_max`, null);
  const active = () => {
    const position = [gamehook.value('battle.player.party_position', null), gamehook.value('player.party_position', null)]
      .find(value => Number.isInteger(value) && value >= 0 && value < count());
    if (position != null) return position;
    return [0, 1, 2, 3, 4, 5].find(slot => occupied(slot) && hp(slot) > 0) ?? null;
  };
  const condition = slot => {
    const details = statusDetails(gamehook.value(`player.team.${slot}.status_condition`, null));
    return details && details.key !== 'healthy' ? details : null;
  };
  const label = slot => {
    if (!occupied(slot)) return `Slot ${slot + 1}: empty`;
    const name = gamehook.value(`player.team.${slot}.species`, `Slot ${slot + 1}`);
    return `${name}: ${hp(slot) === 0 ? 'fainted' : condition(slot)?.label || 'healthy'}${active() === slot ? ', active' : ''}`;
  };
  return <Show when={count() > 0}><div class="party-sprites" aria-label="Party">
    <For each={[0, 1, 2, 3, 4, 5]}>{slot => <span class="party-slot" role="img" aria-label={label(slot)}
      classList={{ filled: occupied(slot), fainted: occupied(slot) && hp(slot) === 0, active: occupied(slot) && active() === slot }}>
      <span class="party-mon" aria-hidden="true"><Show when={occupied(slot)} fallback={<i class="party-empty" />}><Sprite path={`player.team.${slot}`} sprite /></Show></span>
      <Show when={occupied(slot)}><span class="party-hp" aria-hidden="true"><HpMeter value={hp(slot)} max={maximum(slot)} /></span></Show>
      <Show when={occupied(slot) && hp(slot) !== 0 && condition(slot)}>{details => <b class="party-status" style={{ background: details().color }} />}</Show>
    </span>}</For>
  </div></Show>;
}
