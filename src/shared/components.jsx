import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { useGamehook } from './gamehook.jsx';

// Fills the window. `height` is the design height that maps to the window height; the layout width
// stretches to the window. Windows narrower than `width` (minimum layout width) scale by width instead.
export function Scene(props) {
  const [size, setSize] = createSignal({ scale: 1, width: props.width, height: props.height });
  const resize = () => {
    const scale = Math.min(innerHeight / props.height, innerWidth / props.width);
    setSize({ scale, width: innerWidth / scale, height: innerHeight / scale });
  };
  onMount(() => { resize(); window.addEventListener('resize', resize); });
  onCleanup(() => window.removeEventListener('resize', resize));
  return <main class="overlay-scene" style={{ width: `${size().width}px`, height: `${size().height}px`, transform: `scale(${size().scale})` }}>{props.children}</main>;
}
export function ConnectedDisplay(props) {
  const gamehook = useGamehook();
  return <Show when={gamehook.status() === 'connected' || gamehook.status() === 'demo'}>{props.children}</Show>;
}
// Full-window loading screen; split "Title — detail" status messages for display.
export function ConnectionCard(props) {
  const parts = () => String(props.message || 'Waiting for Gamehook').split(' — ');
  const steps = [
    ['Start Gamehook', 'Run Gamehook on this computer.'],
    ['Connect your emulator', ''],
    ['Load a game mapper', 'Pick the mapper for the game you are playing.'],
  ];
  return <div class="connection-status" role="status" aria-live="polite">
    <div class="connection-center">
      <div class="connection-pulse" aria-hidden="true"><span /><span /><span /><i /></div>
      <strong class="connection-title">{parts()[0]}</strong>
      <Show when={parts()[1]}><em class="connection-detail">{parts().slice(1).join(' — ')}</em></Show>
      <ol class="connection-steps">{steps.map(([title, text], index) => <li><b>{index + 1}</b><span>{title}</span>{text && <small>{text}</small>}</li>)}</ol>
    </div>
  </div>;
}
export function ConnectionStatus() {
  const gamehook = useGamehook();
  return <>
    <Show when={gamehook.status() === 'waiting'}><ConnectionCard message={gamehook.message()} /></Show>
  </>;
}
export function Field(props) {
  const gamehook = useGamehook();
  return <span class={props.class}>{props.format ? props.format(gamehook.value(props.path, props.fallback)) : gamehook.value(props.path, props.fallback)}</span>;
}
export function Panel(props) {
  return <section class={`panel ${props.class || ''}`}><Show when={props.title}><h2>{props.title}</h2></Show>{props.children}</section>;
}
export function Meter(props) {
  const ready = () => typeof props.value === 'number' && Number.isFinite(props.value) && typeof props.max === 'number' && Number.isFinite(props.max) && props.max > 0;
  const amount = () => Math.max(0, Math.min(props.max, props.value));
  const percent = () => amount() / props.max * 100;
  return <Show when={ready()}><div class="meter" role="meter" aria-label={props.label || 'Health'} aria-valuemin={0} aria-valuemax={props.max} aria-valuenow={amount()}><div style={{ width: `${percent()}%`, background: props.color }} /></div></Show>;
}
