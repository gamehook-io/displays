// Blend two [r, g, b] colors; `amount` is how far from `from` toward `to`. Returns '#rrggbb'.
export const mix = (from, to, amount) => '#' + from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount).toString(16).padStart(2, '0')).join('');
