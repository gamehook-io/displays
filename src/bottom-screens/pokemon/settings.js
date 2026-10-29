import { createSignal } from 'solid-js';
import { mix } from './color.js';
import config from './config.js';

// Settings for this screen, saved as one JSON object in Gamehook at /kv/<id> so they follow the screen across browsers and OBS.
// localStorage is only a fast first-paint cache (storage can be blocked, so every access is guarded).
// `color` is 'default' (follow the lead Pokémon's type) or an [r, g, b] triple.
const id = config.id;
const url = `${config.gamehookUrl}/kv/${id}`;
const defaults = { sounds: true, color: 'default' };
const cached = () => { try { return JSON.parse(localStorage.getItem(id) || '{}'); } catch { return {}; } };
const [settings, setSettings] = createSignal({ ...defaults, ...cached() });
const save = () => {
  const value = settings();
  try { localStorage.setItem(id, JSON.stringify(value)); } catch { /* unsaved is fine */ }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }).catch(() => { /* Gamehook offline; the cache keeps it */ });
};
// A 404 just means nothing has been saved yet.
fetch(url).then(response => (response.ok ? response.json() : null)).then(saved => {
  if (saved && typeof saved === 'object') setSettings(previous => ({ ...previous, ...saved }));
}).catch(() => { /* keep cached settings */ });

export const setting = name => settings()[name];
export function toggleSetting(name) { setSettings(previous => ({ ...previous, [name]: !previous[name] })); save(); }
export function setColor(color) { setSettings(previous => ({ ...previous, color })); save(); }

// The [dark, accent, light] triple the screen themes with, built from a chosen color.
export const customPalette = ([r, g, b]) => [mix([r, g, b], [0, 0, 0], .78), mix([r, g, b], [0, 0, 0], 0), mix([r, g, b], [255, 255, 255], .6)];
