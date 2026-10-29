import { For, createEffect, createSignal, onCleanup } from 'solid-js';
import { useGamehook } from '@display';
import { paths } from '../../../shared/pokemon/paths.js';
import { identifyGame } from '../../../shared/pokemon/games/index.js';
export default function Badges() {
  const gamehook = useGamehook();
  const game = () => identifyGame(gamehook.mapper());
  const [page, setPage] = createSignal(0);
  createEffect(() => {
    const count = game()?.badges.length || 8;
    setPage(0);
    if (count > 8) {
      const timer = setInterval(() => setPage(current => (current + 1) % Math.ceil(count / 8)), 12000);
      onCleanup(() => clearInterval(timer));
    }
  });
  const badges = () => game()?.badges.slice(page() * 8, page() * 8 + 8) || Array.from({ length: 8 }, (_, index) => ({ index, name: `Badge ${index + 1}` }));
  return <div class="badges" aria-label={`${page() ? 'Kanto' : game()?.region || 'Johto'} badges`}><For each={badges()}>{badge => <span class={`badge badge-${badge.index % 8}`} classList={{ earned: gamehook.value(`${paths.badges}.${badge.index}`, false) }} aria-label={`${badge.name}: ${gamehook.value(`${paths.badges}.${badge.index}`, false) ? 'earned' : 'not earned'}`}><i /></span>}</For></div>;
}
