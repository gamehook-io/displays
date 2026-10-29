import { Show } from 'solid-js';
import { Field, useGamehook } from '@display';
export default function HeldItem(props) {
  const gamehook = useGamehook();
  return <Show when={gamehook.value(props.path, null) !== null}><div class="held-item"><span>Held item</span><strong><Field path={props.path} format={value => value === 0 || value === '0' ? 'None' : value} /></strong></div></Show>;
}
