import { Show } from 'solid-js';
import { Panel, useGamehook } from '@display';
import { paths } from '../../../shared/pokemon/paths.js';

const pad = (value, length = 2) => String(value).padStart(length, '0');
export default function GameTime() {
  const gamehook = useGamehook();
  const part = key => gamehook.value(`${paths.time}.${key}`);
  const ready = () => ['hours', 'minutes', 'seconds'].every(key => typeof part(key) === 'number' && Number.isFinite(part(key)) && part(key) >= 0);
  // Games count 60 frames per second; show them as milliseconds.
  const milliseconds = () => typeof part('frames') === 'number' && Number.isFinite(part('frames')) ? Math.min(999, Math.floor(part('frames') / 60 * 1000)) : null;
  const unit = (value, label) => <span class="clock-unit"><b>{value}</b><i>{label}</i></span>;
  return <Show when={ready()}><Panel class="clock-panel"><div class="timer-label">time played in-game</div>
    <div class="clock">{unit(part('hours'), 'h')}{unit(pad(part('minutes')), 'm')}{unit(pad(part('seconds')), 's')}<Show when={milliseconds() != null}><small class="clock-ms">{unit(pad(milliseconds(), 3), 'ms')}</small></Show></div>
  </Panel></Show>;
}
