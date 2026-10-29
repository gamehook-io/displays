import { createSignal } from 'solid-js';

// A stack of screens for menu-style pages. `screen` is any value the page understands (usually a name);
// `params` travels with it. `direction` tells the page whether the last move went deeper or back.
export function createNavigator(home) {
  const [stack, setStack] = createSignal([{ screen: home, params: {} }]);
  const [direction, setDirection] = createSignal('forward');
  const current = () => stack().at(-1);
  return {
    current,
    direction,
    canGoBack: () => stack().length > 1,
    push(screen, params = {}) { setDirection('forward'); setStack(previous => [...previous, { screen, params }]); },
    // Swap the current screen without growing the history (for example, stepping between party members).
    replace(screen, params = {}) { setDirection('forward'); setStack(previous => [...previous.slice(0, -1), { screen, params }]); },
    back() { if (stack().length > 1) { setDirection('back'); setStack(previous => previous.slice(0, -1)); } },
    home() { setDirection('back'); setStack(previous => previous.slice(0, 1)); },
  };
}

const directions = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };

// The nearest focusable control in a direction, judged from on-screen rectangles so it works inside a scaled stage.
export function neighbor(from, candidates, [dx, dy]) {
  const origin = from.getBoundingClientRect();
  const ox = origin.left + origin.width / 2, oy = origin.top + origin.height / 2;
  let best = null, bestScore = Infinity;
  for (const element of candidates) {
    if (element === from) continue;
    const box = element.getBoundingClientRect();
    const x = box.left + box.width / 2 - ox, y = box.top + box.height / 2 - oy;
    const along = x * dx + y * dy;
    if (along <= 1) continue;
    const across = Math.abs(dx ? y : x);
    // Prefer targets straight ahead; sideways drift counts double.
    const score = along + across * 2;
    if (score < bestScore) { best = element; bestScore = score; }
  }
  return best;
}

const scrollStep = 140;

// Input-agnostic menu actions over the controls inside `root`. Keyboard and gamepad both drive these.
//   move([dx, dy])   focus the nearest control that way; a focused [data-scroll] region scrolls first
//   activate()       click the focused control
//   back()           run onBack (true when it handled the press)
//   shoulder(delta)  click the enabled [data-shoulder="<delta>"] control, for stepping between pages/tabs
export function createMenuActions(root, { onBack } = {}) {
  const controls = () => [...root.querySelectorAll('button:not(:disabled), [data-nav]:not([aria-disabled="true"])')].filter(element => element.getClientRects().length);
  const focused = () => (root.contains(document.activeElement) && document.activeElement !== document.body ? document.activeElement : null);
  return {
    move(direction) {
      const list = controls();
      if (!list.length) return false;
      const active = focused() && list.includes(focused()) ? focused() : null;
      const [, dy] = direction;
      if (active?.hasAttribute('data-scroll') && dy) {
        const before = active.scrollTop;
        active.scrollBy({ top: dy * scrollStep });
        // A browser may scroll asynchronously (smooth); treat room to scroll as handled.
        const room = dy > 0 ? active.scrollTop + active.clientHeight < active.scrollHeight - 1 : before > 0;
        if (room) return true;
      }
      const target = active ? neighbor(active, list, direction) : list.find(element => element.hasAttribute('data-nav-default')) || list[0];
      // At an edge, stay where we are rather than wrapping.
      (target || active)?.focus();
      return true;
    },
    activate() { const element = focused(); if (!element) return false; element.click(); return true; },
    back: () => Boolean(onBack?.()),
    shoulder(delta) {
      const element = root.querySelector(`[data-shoulder="${delta}"]:not(:disabled)`);
      if (!element) return false;
      element.click();
      return true;
    },
  };
}

// Keys: arrows/WASD move, Z/Enter-on-button activate, X/Escape/Backspace go back, PageUp/PageDown step, F full screen.
// Returns a cleanup function.
export function installKeyboardNavigation(actions, { onToggleFullscreen } = {}) {
  const handler = event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key;
    if (directions[key]) { event.preventDefault(); actions.move(directions[key]); }
    else if (key === 'z' || key === 'Z') { if (actions.activate()) event.preventDefault(); }
    else if (key === 'x' || key === 'X' || key === 'Escape' || key === 'Backspace') { if (actions.back()) event.preventDefault(); }
    else if (key === 'PageUp' || key === 'PageDown') { if (actions.shoulder(key === 'PageUp' ? -1 : 1)) event.preventDefault(); }
    else if (key === 'f' || key === 'F') onToggleFullscreen?.();
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}
