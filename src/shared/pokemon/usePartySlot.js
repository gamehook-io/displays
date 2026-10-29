import { useGamehook } from '@display';
import { statusDetails } from './status.js';
import { isBlank, slotOccupied } from './party.js';

// Reactive accessors for one party slot (`slot` is an accessor). Unknown values stay null; callers hide what is unknown.
export function usePartySlot(slot) {
  const gamehook = useGamehook();
  const path = () => `player.team.${slot()}`;
  const read = key => gamehook.value(`${path()}.${key}`, null);
  return {
    path,
    occupied: () => slotOccupied(gamehook.value, slot()),
    dex: () => Number(read('dex_number')) || 0,
    species: () => read('species'),
    name: () => (!isBlank(read('nickname')) ? read('nickname') : read('species')),
    level: () => read('level'),
    hp: () => read('stats.hp'),
    hpMax: () => read('stats.hp_max'),
    fainted: () => read('stats.hp') === 0,
    condition: () => { const details = statusDetails(read('status_condition')); return details && details.key !== 'healthy' ? details : null; },
    heldItem: () => (isBlank(read('held_item')) || read('held_item') === 'None' ? null : read('held_item')),
  };
}
