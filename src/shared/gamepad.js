// Gamepad input for menu pages, using the standard mapping (d-pad, face buttons, shoulders, left stick).
// Browsers expose a pad only after a button is pressed on it, so nothing happens until then.
//
//   south (A on Xbox)  east (B on Xbox)
//   layout 'xbox'      activate / back        (default)
//   layout 'nintendo'  back / activate        (south is Nintendo's B, east is A)
// D-pad and left stick move; L1 / R1 step (data-shoulder); held directions repeat.

export const buttons = { south: 0, east: 1, l1: 4, r1: 5, up: 12, down: 13, left: 14, right: 15 };
const stickDeadzone = 0.55;
const repeatDelay = 420, repeatInterval = 130;

// Pure: which logical inputs a pad's raw state presses. `state` is { buttons: boolean[], axes: number[] }.
export function padInputs(state, layout = 'xbox') {
  const down = index => Boolean(state.buttons[index]);
  const [x = 0, y = 0] = state.axes;
  const [confirm, cancel] = layout === 'nintendo' ? [buttons.east, buttons.south] : [buttons.south, buttons.east];
  return {
    up: down(buttons.up) || y < -stickDeadzone,
    down: down(buttons.down) || y > stickDeadzone,
    left: down(buttons.left) || x < -stickDeadzone,
    right: down(buttons.right) || x > stickDeadzone,
    activate: down(confirm), back: down(cancel), previous: down(buttons.l1), next: down(buttons.r1),
  };
}

const moves = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// Tracks held inputs between polls: fires once on press, then repeats directions while held.
export function createInputTracker() {
  const since = new Map(), lastFired = new Map();
  return function poll(inputs, now) {
    const fired = [];
    // Anything tracked but no longer reported counts as released.
    for (const name of [...since.keys()]) if (!(name in inputs)) { since.delete(name); lastFired.delete(name); }
    for (const [name, held] of Object.entries(inputs)) {
      if (!held) { since.delete(name); lastFired.delete(name); continue; }
      if (!since.has(name)) { since.set(name, now); lastFired.set(name, now); fired.push(name); continue; }
      const repeats = name in moves;
      if (repeats && now - since.get(name) >= repeatDelay && now - lastFired.get(name) >= repeatInterval) { lastFired.set(name, now); fired.push(name); }
    }
    return fired;
  };
}

const snapshot = pad => ({ buttons: Array.from(pad.buttons, button => button.pressed), axes: Array.from(pad.axes) });

// Starts polling and returns a cleanup function. `onInput` runs on every pad press (to mark gamepad use).
export function installGamepadNavigation(actions, { layout = 'xbox', onInput } = {}) {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return () => {};
  const poll = createInputTracker();
  let frame = 0;
  const tick = now => {
    frame = 0;
    const pads = [...navigator.getGamepads()].filter(pad => pad?.connected);
    for (const pad of pads) {
      const fired = poll(padInputs(snapshot(pad), layout), now);
      if (fired.length) onInput?.();
      for (const name of fired) {
        if (name in moves) actions.move(moves[name]);
        else if (name === 'activate') actions.activate();
        else if (name === 'back') actions.back();
        else if (name === 'previous') actions.shoulder(-1);
        else if (name === 'next') actions.shoulder(1);
      }
    }
    if (pads.length && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame) frame = requestAnimationFrame(tick); };
  window.addEventListener('gamepadconnected', start);
  document.addEventListener('visibilitychange', start);
  start();
  return () => { window.removeEventListener('gamepadconnected', start); document.removeEventListener('visibilitychange', start); cancelAnimationFrame(frame); frame = 0; };
}
