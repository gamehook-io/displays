import { For } from 'solid-js';
import { Field, Panel, useGamehook } from '@display';
import { paths } from '../../../shared/pokemon/paths.js';
import Sprite from './Sprite.jsx';
import Stats from './Stats.jsx';
import Moves from './Moves.jsx';
import HealthBar from './HealthBar.jsx';
import HeldItem from './HeldItem.jsx';
import StatusCondition from './StatusCondition.jsx';
import { activeTypes } from '../../../shared/pokemon/types.js';

export default function WildEncounter() {
  const gamehook = useGamehook();
  const path = `${paths.opponent}.active_pokemon`;
  const types = () => activeTypes(gamehook.value, path);
  return <section class="wild-encounter">
    <div class="wild-hero"><Sprite path={path} /><h2><Field path={`${path}.species`} /></h2><p>Level <Field path={`${path}.level`} /></p></div>
    <div class="type-labels"><For each={types()}>{type => <span class={`type type-${type.toLowerCase()}`}>{type}</span>}</For></div>
    <Panel class="details-panel">
      <HealthBar path={`${path}.stats`} />
      <StatusCondition path={`${path}.status_condition`} showHealthy row />
      <HeldItem path={`${path}.held_item`} />
      <Moves path={`${path}.moves`} /><Stats path={`${path}.stats`} />
    </Panel>
  </section>;
}
