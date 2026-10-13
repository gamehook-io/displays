import { For } from 'solid-js';

// Entries are { key, label, value }; unknown numbers never become placeholder zeroes.
export default function StatGrid(props) {
  const available = () => (props.entries || []).filter(entry => Number.isFinite(entry.value));
  return <div class="stats"><For each={available()}>{entry =>
    <div class={`stat stat-${entry.key}`}><span>{entry.label}</span><b>{entry.value}</b></div>
  }</For></div>;
}
