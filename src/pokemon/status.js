const conditions = {
  healthy: { label: 'Healthy', color: '#c8ead2' },
  sleep: { label: 'Asleep', color: '#d3d8e1' },
  poison: { label: 'Poisoned', color: '#dab5ee' },
  toxic: { label: 'Badly poisoned', color: '#dab5ee' },
  burn: { label: 'Burned', color: '#ffc59e' },
  freeze: { label: 'Frozen', color: '#c0edfa' },
  paralysis: { label: 'Paralyzed', color: '#f5e39b' },
};
// Gen 1's installed mapper spells its three-turn sleep reference "Alseep".
const names = { healthy: 'healthy', none: 'healthy', slp: 'sleep', sleep: 'sleep', asleep: 'sleep', alseep: 'sleep', psn: 'poison', poison: 'poison', poisoned: 'poison', 'badly poisoned': 'toxic', brn: 'burn', burn: 'burn', burned: 'burn', frz: 'freeze', freeze: 'freeze', frozen: 'freeze', prz: 'paralysis', par: 'paralysis', paralysis: 'paralysis', paralyzed: 'paralysis' };

export function statusDetails(value) {
  let key;
  if (typeof value === 'number') {
    key = value === 0 ? 'healthy' : Number.isInteger(value) && value >= 1 && value <= 7 ? 'sleep' : ({ 8: 'poison', 16: 'burn', 32: 'freeze', 64: 'paralysis', 128: 'toxic' })[value];
  } else if (typeof value === 'string') key = value === '0' ? 'healthy' : Object.hasOwn(names, value.toLowerCase()) ? names[value.toLowerCase()] : null;
  return key ? { key, ...conditions[key] } : null;
}
