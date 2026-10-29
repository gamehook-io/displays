// Party, area, and "is this value set?" rules shared by every Pokémon page. `value` is gamehook.value.

// Mappers report empty slots and unset fields as null, 0, '0', or ''.
export const isBlank = value => [null, undefined, 0, '0', ''].includes(value);

export const partySlots = [0, 1, 2, 3, 4, 5];

export const partyCount = value => Math.min(6, Math.max(0, Number(value('player.team_count', 0)) || 0));

export const slotOccupied = (value, slot) => slot < partyCount(value) &&
  (Number(value(`player.team.${slot}.dex_number`, 0)) > 0 || !isBlank(value(`player.team.${slot}.species`, null)));

export const occupiedSlots = value => partySlots.filter(slot => slotOccupied(value, slot));

// The current map's name, or null when unknown.
export function areaName(value) {
  const name = value('overworld.map_name', null);
  return typeof name === 'string' && name !== '' && name !== '0' ? name : null;
}
