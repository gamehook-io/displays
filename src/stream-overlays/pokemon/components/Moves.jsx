import { For, Show } from 'solid-js';
import { useGamehook } from '@display';
import { moveType } from '../../../shared/pokemon/moves.js';
import { palettes } from '../../../shared/pokemon/types.js';
import { isBlank } from '../../../shared/pokemon/party.js';

export default function Moves(props) {
  const gamehook = useGamehook();
  const move = slot => gamehook.value(`${props.path}.${slot}.move`, null);
  const empty = slot => isBlank(move(slot));
  const color = slot => {
    const type = moveType(move(slot), gamehook.value(`${props.path.replace(/\.moves$/, '')}.hidden_power.type`), gamehook.value('meta.generation', 2));
    return type ? palettes[type]?.[2] : undefined;
  };
  return <div class="moves"><Show when={!props.compact}><div class="table-label"><span>Moves</span><span>PP</span></div></Show><For each={[0, 1, 2, 3]}>{slot => <Show when={!empty(slot)} fallback={<div class="move-row move-empty" aria-label="Empty move slot" />}><div class="move-row"><span class="move-name"><i class="move-icon" style={{ background: color(slot) }} aria-hidden="true" />{move(slot)}</span><Show when={!props.compact}><b>{gamehook.value(`${props.path}.${slot}.pp`)}</b></Show></div></Show>}</For></div>;
}
