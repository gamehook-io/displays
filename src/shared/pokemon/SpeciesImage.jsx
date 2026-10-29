import { Show, createMemo, createSignal } from 'solid-js';
import { useGamehook } from '@display';

// Species picture by national dex number, from the shared `assets/pokemon/` group. `prefer` picks the order:
// 'art' official artwork then the game sprite; 'sprite' the game sprite then artwork; 'sprite-only' no artwork.
// `override` replaces the lookup with one URL. A missing file falls through to the next source.
export default function SpeciesImage(props) {
  const gamehook = useGamehook();
  const sources = createMemo(() => {
    const dex = Number(props.dex);
    if (props.override) return [props.override];
    if (!(dex > 0)) return [];
    const sprite = `assets/pokemon/${gamehook.value('meta.game_key', 'crystal') === 'crystal' ? '' : 'shared/'}${dex}.png`;
    const art = `assets/pokemon/art/${dex}.webp`;
    return props.prefer === 'sprite-only' ? [sprite] : props.prefer === 'sprite' ? [sprite, art] : [art, sprite];
  });
  const [failed, setFailed] = createSignal(new Set());
  const source = () => sources().find(item => !failed().has(item));
  return <Show when={source()}>{current => <img class={props.class} classList={{ 'pixel-sprite': current().endsWith('.png') && !props.override }} src={current()} alt="" draggable={false} loading={props.lazy ? 'lazy' : undefined}
    onError={() => setFailed(previous => new Set(previous).add(current()))} />}</Show>;
}
