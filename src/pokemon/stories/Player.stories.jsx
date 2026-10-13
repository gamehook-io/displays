import { useGamehook } from '@overlay';
import { paths } from '../paths.js';
import { activeTypes } from '../types.js';
import { usePlayerData } from '../usePlayerData.js';
import PokemonHero from '../components/PokemonHero.jsx';
import PartySprites from '../components/PartySprites.jsx';
import PlayerDetails from '../components/PlayerDetails.jsx';
import HealthBar from '../components/HealthBar.jsx';
import ExperienceBar from '../components/ExperienceBar.jsx';
import Moves from '../components/Moves.jsx';
import Stats from '../components/Stats.jsx';
import HeldItem from '../components/HeldItem.jsx';
import TypeLabels from '../components/TypeLabels.jsx';
import { Panel } from '@overlay';

export default { title: 'Widgets/Player' };

function Hero() {
  const gamehook = useGamehook();
  const player = usePlayerData(() => false);
  return <PokemonHero path={paths.active} statsPath={player.statPath()} types={activeTypes(gamehook.value, paths.active)} />;
}

export const PlayerCard = { render: () => <Hero />, args: { demo: '' } };
export const PlayerCardPoisoned = { render: () => <Hero />, args: { demo: 'status=PSN' } };
export const PlayerCardLowLevel = { render: () => <Hero />, args: { demo: 'pokemon=totodile' } };
export const PlayerCardFemale = { render: () => <Hero />, args: { demo: 'gender=female' } };
export const Party = { render: () => <Panel><PartySprites /></Panel> };
export const Details = { render: () => <PlayerDetails path={paths.active} statsPath={`${paths.active}.stats`} movesPath={`${paths.active}.moves`} showHeader={false} /> };
export const DetailsWithHeader = { render: () => <PlayerDetails path={paths.active} statsPath={`${paths.active}.stats`} movesPath={`${paths.active}.moves`} /> };
export const Bars = { render: () => <Panel><HealthBar path={`${paths.active}.stats`} /><ExperienceBar path={paths.active} /></Panel> };
export const MoveList = { render: () => <Panel><Moves path={`${paths.active}.moves`} /></Panel> };
export const StatGrid = { render: () => <Panel><Stats path={`${paths.active}.stats`} /></Panel> };
export const Item = { render: () => <Panel><HeldItem path={`${paths.active}.held_item`} /></Panel> };
export const Types = { render: () => <TypeLabels types={['electric', 'steel']} /> };
