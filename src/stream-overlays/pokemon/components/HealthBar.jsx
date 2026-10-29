import { useGamehook } from '@display';
import ResourceBar from '../../../shared/ResourceBar.jsx';

// HP label, shared meter, and current/max numbers. Pass a stats path.
export default function HealthBar(props) {
  const gamehook = useGamehook();
  return <ResourceBar value={gamehook.value(`${props.path}.hp`, null)} max={gamehook.value(`${props.path}.hp_max`, null)} />;
}
