import { For, Show } from 'solid-js';
import { useGamehook } from '@overlay';
import { paths } from '../paths.js';
import PokemonCard from './PokemonCard.jsx';
export default function TrainerTeam() {
  const gamehook = useGamehook();
  const team = () => Array.from({ length: Math.min(6, Math.max(0, Number(gamehook.value(`${paths.opponent}.team_count`, 0)))) }, (_, i) => i);
  return <Show when={team().length}><div class="opponent-team"><For each={team()}>{i => <PokemonCard path={`${paths.opponent}.team.${i}`} />}</For></div></Show>;
}
