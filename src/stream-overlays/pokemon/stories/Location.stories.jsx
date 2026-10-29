import Location from '../Location.jsx';
import EncounterCard from '../components/EncounterCard.jsx';

export default { title: 'Widgets/Location', render: () => <Location /> };

export const Town = { args: { demo: 'battle=none' } };
export const RouteDay = { args: { demo: 'battle=none&location=route' } };
export const RouteNight = { args: { demo: 'battle=none&location=route&time=night' } };
export const RouteSurf = { args: { demo: 'battle=none&location=route&route=35&movement=surf' } };
export const LargestCrystalTable = { args: { demo: 'battle=none&location=route&map=3:39&time=morning' } };
export const DenseDSTable = { args: { demo: 'game=platinum&battle=none&encounters=many' } };
export const Encounter = {
  args: { demo: 'battle=none' },
  render: () => <div class="encounter-grid" style={{ 'grid-template-rows': '76px' }}><EncounterCard pokemon={{ dex: 16, name: 'pidgey', min: 2, max: 3, chance: 50, primaryMethod: 'Grass', details: [{ name: 'Grass', min: 2, max: 3 }] }} /></div>,
};
