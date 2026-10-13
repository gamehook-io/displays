import { For, Show, createMemo } from 'solid-js';
import { useGamehook } from '@overlay';
import { routeEncounters } from './encounters.js';
import EncounterCard from './components/EncounterCard.jsx';

// Every encounter stays visible, grouped under a header per method (Grass, Surf, Old Rod…).
// Groups share the panel height; long tables switch to two columns.
export default function RouteEncounters() {
  const gamehook = useGamehook();
  const encounters = createMemo(() => routeEncounters(gamehook.value));
  const dense = () => encounters().length > 12;
  const groups = createMemo(() => {
    const byMethod = new Map();
    for (const entry of encounters()) {
      const method = entry.primaryMethod || 'Other';
      if (!byMethod.has(method)) byMethod.set(method, []);
      byMethod.get(method).push(entry);
    }
    return [...byMethod].map(([method, entries]) => ({ method, entries, rows: dense() ? Math.ceil(entries.length / 2) : entries.length }));
  });
  const rowHeight = () => dense() ? 64 : 76;
  return <Show when={encounters().length}><section class="route-encounters" aria-label="Wild Pokémon"><h3>Wild Pokémon</h3>
    <div class="encounter-groups" classList={{ dense: dense() }}>
      <For each={groups()}>{group => <section class="encounter-group" aria-label={group.method} style={{ 'flex-basis': `${group.rows * (rowHeight() + 6) + 24}px` }}>
        <h4 class="encounter-method"><span>{group.method}</span></h4>
        <div class="encounter-grid" style={{ 'grid-template-rows': `repeat(${group.rows}, minmax(0, ${rowHeight()}px))` }}>
          <For each={group.entries}>{entry => <EncounterCard pokemon={entry} />}</For>
        </div>
      </section>}</For>
    </div>
  </section></Show>;
}
