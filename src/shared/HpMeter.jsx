import { Meter } from '@display';

// Shared HP meter: green, yellow at half, red at a fifth. Used by every HP display.
export const hpColor = (value, max) => !(max > 0) || !Number.isFinite(value) ? undefined : value / max <= .2 ? '#ed6a5f' : value / max <= .5 ? '#eec557' : undefined;

export default function HpMeter(props) {
  return <Meter label="Health" value={props.value} max={props.max} color={hpColor(props.value, props.max)} />;
}
