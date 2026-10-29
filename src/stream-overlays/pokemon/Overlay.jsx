import { Show } from 'solid-js';
import { useGamehook } from '@display';
import config from './config.js';
import { paths } from '../../shared/pokemon/paths.js';
import { activeTypes, hasPokemon, themeStyle } from '../../shared/pokemon/types.js';
import { usePlayerData } from './usePlayerData.js';
import Location from './Location.jsx';
import GameTime from './components/GameTime.jsx';
import Badges from './components/Badges.jsx';
import RunCounters from './components/RunCounters.jsx';
import PokemonHero from './components/PokemonHero.jsx';
import PlayerDetails from './components/PlayerDetails.jsx';
import TrainerTeam from './components/TrainerTeam.jsx';
import WildEncounter from './components/WildEncounter.jsx';

export default function Overlay() {
  const gamehook = useGamehook();
  const playerTypes = () => activeTypes(gamehook.value, paths.active);
  const theme = () => playerTypes()[0] || 'neutral';
  const battling = () => {
    const mode = gamehook.value('battle.mode', null);
    return mode !== null && !['None', 'Overworld', '0', ''].includes(String(mode));
  };
  const wild = () => ['Wild', '1'].includes(String(gamehook.value('battle.mode', '')));
  const player = usePlayerData(battling);
  const background = () => config.background ? `url(${config.background})` : undefined;
  return <div class={`crystal-overlay theme-${theme()}`} classList={{ filled: config.fillOpening !== false }} style={themeStyle(theme())}>
    <Show when={config.fillOpening !== false} fallback={<div class="bottom-fire" />}>
      {/* Game capture goes above the overlay, between the two 400-unit side columns. */}
      <div class="backdrop" style={{ 'background-image': background() }} />
    </Show>
    <aside class="rail left-rail" style={{ 'background-image': config.fillOpening === false ? background() : undefined }}>
      <GameTime />
      <Badges />
      <RunCounters />
      <Show when={hasPokemon(gamehook.value, paths.active)}>
        <PokemonHero path={paths.active} sprite={config.sprite} statsPath={player.statPath()} types={playerTypes()} />
        <PlayerDetails path={paths.active} statsPath={player.statPath()} movesPath={player.movePath()} showHeader={false} />
      </Show>
    </aside>
    {/* Game opening: everything between the side columns, above the 32-unit bottom edge. */}
    <aside class="rail right-rail" style={{ 'background-image': config.fillOpening === false ? background() : undefined }}>
      <Show when={battling()} fallback={<Location />}>
        <header class="opponent-heading"><h1>{wild() ? 'Wild encounter' : `${gamehook.value(`${paths.opponent}.trainer`, 'Opponent')}'s Team`}</h1></header>
        <Show when={wild()} fallback={<TrainerTeam />}><WildEncounter /></Show>
      </Show>
    </aside>
  </div>;
}
