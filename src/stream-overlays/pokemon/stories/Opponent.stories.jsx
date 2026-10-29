import { paths } from '../../../shared/pokemon/paths.js';
import TrainerTeam from '../components/TrainerTeam.jsx';
import PokemonCard from '../components/PokemonCard.jsx';
import WildEncounter from '../components/WildEncounter.jsx';

export default { title: 'Widgets/Opponent' };

const heading = text => <header class="opponent-heading"><h1>{text}</h1></header>;
export const TrainerParty = { render: () => <>{heading("Scientist's Team")}<TrainerTeam /></>, args: { demo: '' } };
export const TrainerPartyFull = { render: () => <>{heading("Scientist's Team")}<TrainerTeam /></>, args: { demo: 'team=6' } };
export const SingleCard = { render: () => <PokemonCard path={`${paths.opponent}.team.0`} /> };
export const Wild = { render: () => <>{heading('Wild encounter')}<WildEncounter /></>, args: { demo: 'battle=wild' } };
