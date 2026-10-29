import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { createMenuActions, installKeyboardNavigation } from './navigation.js';
import { installGamepadNavigation } from './gamepad.js';

const fullscreenSupported = () => typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen);
const isFullscreen = () => Boolean(document.fullscreenElement);
export function toggleFullscreen() {
  if (!fullscreenSupported()) return;
  // Browsers reject requests without a user gesture or when blocked by policy; the toggle stays usable either way.
  (isFullscreen() ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
}

// Small corner button that stays out of the way: faint until the pointer moves or it has focus.
export function FullscreenToggle() {
  const [full, setFull] = createSignal(false);
  const [awake, setAwake] = createSignal(false);
  let timer;
  const wake = () => { setAwake(true); clearTimeout(timer); timer = setTimeout(() => setAwake(false), 2500); };
  const sync = () => setFull(isFullscreen());
  onMount(() => { sync(); document.addEventListener('fullscreenchange', sync); window.addEventListener('pointermove', wake); });
  onCleanup(() => { document.removeEventListener('fullscreenchange', sync); window.removeEventListener('pointermove', wake); clearTimeout(timer); });
  return <Show when={fullscreenSupported()}>
    <button type="button" class="bs-fullscreen" classList={{ awake: awake() }} onClick={toggleFullscreen}
      aria-label={full() ? 'Exit full screen' : 'Enter full screen'} title={full() ? 'Exit full screen (F)' : 'Full screen (F)'}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <Show when={full()} fallback={<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}>
          <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
        </Show>
      </svg>
    </button>
  </Show>;
}

// A fixed-ratio design stage fitted to the window (letterboxed, centered, uniformly scaled) for interactive
// menu pages. `width` x `height` are design units; children lay out inside that box. Unlike Scene, the
// stage accepts pointer, touch, keyboard, and gamepad input. Mark controls `data-shoulder="-1"` / `"1"` to
// have L1/R1 (PageUp/PageDown) click them, and scrolling lists `data-nav data-scroll` so the d-pad scrolls them.
export function BottomScreen(props) {
  const [fit, setFit] = createSignal({ scale: 1, left: 0, top: 0 });
  let stage, viewport;
  const resize = () => {
    const scale = Math.min(innerWidth / props.width, innerHeight / props.height);
    setFit({ scale, left: (innerWidth - props.width * scale) / 2, top: (innerHeight - props.height * scale) / 2 });
  };
  onMount(() => {
    resize();
    window.addEventListener('resize', resize);
    const actions = createMenuActions(stage, { onBack: () => props.onBack?.() ?? false });
    const layout = new URLSearchParams(location.search).get('gamepad') === 'nintendo' ? 'nintendo' : 'xbox';
    // Focus rings follow the last input device: shown for pad and keyboard, hidden after a pointer press.
    const usePad = () => { viewport.dataset.input = 'pad'; };
    const usePointer = () => { delete viewport.dataset.input; };
    viewport.addEventListener('pointerdown', usePointer);
    const removeKeyboard = installKeyboardNavigation(actions, { onToggleFullscreen: toggleFullscreen });
    const removePad = installGamepadNavigation(actions, { layout, onInput: usePad });
    onCleanup(() => { window.removeEventListener('resize', resize); viewport.removeEventListener('pointerdown', usePointer); removeKeyboard(); removePad(); });
  });
  return <div class="bs-viewport" ref={viewport}>
    <main class="bs-stage" ref={stage} style={{ width: `${props.width}px`, height: `${props.height}px`, left: `${fit().left}px`, top: `${fit().top}px`, transform: `scale(${fit().scale})` }}>
      {props.children}
    </main>
    <FullscreenToggle />
  </div>;
}
