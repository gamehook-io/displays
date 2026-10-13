import { Show, createMemo, createSignal } from 'solid-js';
import { useGamehook } from '@overlay';
import config from '../config.js';

// Species picture by national dex number. Official artwork first (config.artwork; `sprite` forces
// the game sprite), then the game's own sprite; each failed file falls through to the next. Pixel sprites stay crisp.
export default function SpeciesImage(props) {
  const gamehook = useGamehook();
  const sources = createMemo(() => {
    const dex = Number(props.dex);
    if (props.override) return [props.override];
    if (!(dex > 0)) return [];
    const sprite = `assets/pokemon/${gamehook.value('meta.game_key', 'crystal') === 'crystal' ? '' : 'shared/'}${dex}.png`;
    return config.artwork === false || props.sprite ? [sprite] : [`assets/pokemon/art/${dex}.webp`, sprite];
  });
  const [failed, setFailed] = createSignal(new Set());
  const source = () => sources().find(item => !failed().has(item));
  return <Show when={source()}>{current => <img src={current()} classList={{ 'pixel-sprite': current().endsWith('.png') && !props.override }} alt="" draggable={false} onError={() => setFailed(previous => new Set(previous).add(current()))} />}</Show>;
}
