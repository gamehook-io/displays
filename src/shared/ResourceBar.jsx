import { Show } from 'solid-js';
import { Meter } from '@overlay';
import { hpColor } from './HpMeter.jsx';

// Presentation only: callers own mapper paths and game-specific resource rules.
export default function ResourceBar(props) {
  const ready = () => Number.isFinite(props.value) && Number.isFinite(props.max) && props.max > 0;
  return <Show when={ready()}><div class="health-row">
    <span>{props.label || 'HP'}</span>
    <Meter label={props.meterLabel || 'Health'} value={props.value} max={props.max}
      color={props.color ?? hpColor(props.value, props.max)} />
    <span>{props.value}/{props.max}</span>
  </div></Show>;
}
