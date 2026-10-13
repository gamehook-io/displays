import { useGamehook } from '@overlay';
import { statsForGeneration } from '../usePlayerData.js';
import StatGrid from '../../shared/StatGrid.jsx';

export default function Stats(props) {
  const gamehook = useGamehook();
  const entries = () => statsForGeneration(gamehook.value('meta.generation')).map(([key, label]) => ({
    key, label, value: gamehook.value(`${props.path}.${key}`, null),
  }));
  return <StatGrid entries={entries()} />;
}
