import { setting } from './settings.js';

// Little menu blips from ZzFX (a tiny sound synthesizer). Loaded on first use so nothing touches audio until the
// viewer has interacted; each sound is a ZzFX parameter list: [volume, randomness, frequency, attack, sustain, release, shape, ...].
const blips = {
  move: [.4, 0, 520, 0, .01, .04, 0, 1.5],
  select: [.5, 0, 700, 0, .04, .1, 0, 1.5, 0, 0, 250, .04],
  back: [.5, 0, 420, 0, .03, .1, 0, 1.5, -12],
};
let engine;
export function playSound(name) {
  if (!setting('sounds') || !blips[name]) return;
  engine ??= import('zzfx').then(module => module.ZZFX);
  engine.then(ZZFX => { ZZFX.audioContext?.resume?.(); ZZFX.play(...blips[name]); }).catch(() => {});
}
