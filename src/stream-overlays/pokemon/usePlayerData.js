import { useGamehook } from '@display';
import { paths } from '../../shared/pokemon/paths.js';
import { statDefinitions, statsForGeneration } from '../../shared/pokemon/stats.js';

export { statDefinitions, statsForGeneration };

export function usePlayerData(battling) {
  const gamehook = useGamehook();
  // Encounter mode starts before send-out finishes. Party values remain valid during that intro.
  const playerBattleReady = () => {
    if (!battling()) return false;
    const state = gamehook.value('meta.state', null);
    if (state !== 'Battle') return false;
    const maximum = gamehook.value(`${paths.battleStats}.hp_max`, null);
    return typeof maximum === 'number' && maximum > 0 &&
      statsForGeneration(gamehook.value('meta.generation')).every(([key]) => {
        const value = gamehook.value(`${paths.battleStats}.${key}`, null);
        return typeof value === 'number' && Number.isFinite(value);
      });
  };
  const statPath = () => playerBattleReady() ? paths.battleStats : `${paths.active}.stats`;
  const movePath = () => {
    const path = 'battle.player.active_pokemon.moves';
    const firstMove = gamehook.value(`${path}.0.move`, null);
    return playerBattleReady() && typeof firstMove === 'string' && firstMove !== '0' && firstMove !== ''
      ? path : `${paths.active}.moves`;
  };
  return { statPath, movePath };
}
