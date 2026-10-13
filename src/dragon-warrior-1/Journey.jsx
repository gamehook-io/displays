import { Show } from 'solid-js';
import { Panel, useGamehook } from '@overlay';
import ResourceBar from '../shared/ResourceBar.jsx';
import StatGrid from '../shared/StatGrid.jsx';
import { activeEnemyName, numericEntries } from './data.js';

export default function Journey() {
  const { value } = useGamehook();
  const location = () => value('map.name', null);
  const enemy = key => value(`battle.enemy.${key}`, null);
  const enemyName = () => activeEnemyName(value);
  const abilities = () => enemy('abilities');
  return <>
    <Show when={typeof location() === 'string' && location().trim()}><section class="dw-location">
      <h2>{location()}</h2>
    </section></Show>
    {/* The mapper has no battle flag, so a fight counts as active only while the enemy has HP left. */}
    <Show when={enemyName()}><Panel title="Enemy" class="dw-enemy">
      <div class="dw-enemy-mark" aria-hidden="true">◇</div><h3>{enemyName()}</h3>
      <ResourceBar value={enemy('current_hp')} max={enemy('maximum_hp')} />
      <StatGrid entries={numericEntries(value, 'battle.enemy', [['strength', 'Strength'], ['agility', 'Agility'], ['xp_reward', 'XP reward'], ['gold_reward', 'Gold reward']])} />
      <Show when={typeof abilities() === 'string' && abilities().trim()}><div class="dw-abilities"><span>Abilities</span><p>{abilities()}</p></div></Show>
    </Panel></Show>
  </>;
}
