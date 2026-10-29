import { Show } from 'solid-js';
import { Panel, useGamehook } from '@display';
import config from '../config.js';
export default function RunCounters() {
  const gamehook = useGamehook();
  const resets = () => config.resets ?? gamehook.value('overlay.resets');
  const blackouts = () => config.blackouts ?? gamehook.value('overlay.blackouts');
  return <Show when={resets() != null || blackouts() != null}><div class="counters">
    <Show when={resets() != null}><Panel><span>resets</span><strong>{resets()}</strong></Panel></Show>
    <Show when={blackouts() != null}><Panel><span>blackouts</span><strong>{blackouts()}</strong></Panel></Show>
  </div></Show>;
}
