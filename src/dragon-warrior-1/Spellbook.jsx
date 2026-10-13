import { For, Show } from 'solid-js';
import { Panel, useGamehook } from '@overlay';
import { knownSpells, spellLabel } from './data.js';

export default function Spellbook() {
  const { value } = useGamehook();
  const available = () => knownSpells(value);
  return <Show when={available().length}><Panel title="Magic">
    <div class="dw-spells"><For each={available()}>{key => <span>{spellLabel(key)}</span>}</For></div>
  </Panel></Show>;
}
