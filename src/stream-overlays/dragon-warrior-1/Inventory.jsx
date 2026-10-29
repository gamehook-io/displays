import { For, Show } from 'solid-js';
import { Panel, useGamehook } from '@display';
import StatGrid from '../../shared/StatGrid.jsx';
import { inventoryItems, numericEntries } from './data.js';

export default function Inventory() {
  const { value } = useGamehook();
  const items = () => inventoryItems(value);
  const counts = () => numericEntries(value, 'player.inventory', [['magic_keys_quantity', 'Keys'], ['herbs_quantity', 'Herbs']]);
  const ready = () => items().length || counts().some(entry => Number.isFinite(entry.value));
  return <Show when={ready()}><Panel title="Traveler’s pack" class="dw-inventory">
    <StatGrid entries={counts()} />
    <Show when={items().length}><ol class="dw-items"><For each={items()}>{item =>
      <li><span class="dw-slot">{String(item.index + 1).padStart(2, '0')}</span><span>{item.name}</span></li>
    }</For></ol></Show>
  </Panel></Show>;
}
