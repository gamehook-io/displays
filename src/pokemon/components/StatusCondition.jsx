import { Show } from 'solid-js';
import { useGamehook } from '@overlay';
import { statusDetails } from '../status.js';

export default function StatusCondition(props) {
  const gamehook = useGamehook();
  const condition = () => statusDetails(gamehook.value(props.path));
  const visible = () => condition() && (props.showHealthy || condition().key !== 'healthy');
  const badge = () => <span class="status-pill" style={{ background: condition()?.color }}>{condition()?.label}</span>;
  return <Show when={visible()}><Show when={props.row} fallback={badge()}><div class="held-item status-condition"><span>Status</span>{badge()}</div></Show></Show>;
}
