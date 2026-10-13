import Overlay from '../Overlay.jsx';
import HeroStatus from '../HeroStatus.jsx';
import Inventory from '../Inventory.jsx';
import Journey from '../Journey.jsx';
import Spellbook from '../Spellbook.jsx';

export default {
  title: 'Dragon Warrior/Scene', component: Overlay,
  parameters: { game: 'dragon-warrior', frame: 'scene' },
  render: () => <Overlay />,
};
export const JourneyToCharlock = { args: { demo: '' } };
export const FirstSteps = { args: { demo: 'sample=early' } };
export const CriticalHealth = { args: { demo: 'sample=critical' } };
export const FullInventory = { args: { demo: 'sample=full' } };
export const MissingOptionalData = { args: { demo: 'sample=missing' } };
export const TransparentOpening = { render: () => <Overlay fillOpening={false} /> };
const widget = Component => () => <div class="dragon-warrior-overlay"><aside class="dw-rail dw-left"><Component /></aside></div>;
export const Hero = { render: widget(HeroStatus) };
export const Pack = { args: { demo: 'sample=full' }, render: widget(Inventory) };
export const LocationAndEnemy = { render: widget(Journey) };
export const LearnedSpells = { render: widget(Spellbook) };
