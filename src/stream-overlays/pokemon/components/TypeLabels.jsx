import { For } from 'solid-js';
export default function TypeLabels(props) {
  return <div class="type-labels"><For each={props.types}>{type => <span class={`type type-${type.toLowerCase()}`}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>}</For></div>;
}
