import { Field, Panel } from '@display';
import Moves from './Moves.jsx';
import Stats from './Stats.jsx';
import HealthBar from './HealthBar.jsx';
import HeldItem from './HeldItem.jsx';
import StatusCondition from './StatusCondition.jsx';
import { Show } from 'solid-js';
export default function PlayerDetails(props) {
  return <Panel class="details-panel"><Show when={props.showHeader !== false}><h2 class="player-heading">Level <Field path={`${props.path}.level`} /><StatusCondition path={`${props.path}.status_condition`} /></h2><HealthBar path={props.statsPath} /></Show><HeldItem path={`${props.path}.held_item`} /><Moves path={props.movesPath} /><Stats path={props.statsPath} /></Panel>;
}
