import Overlay from '../Overlay.jsx';

// Full 1920×1080 scene. The checkerboard marks the transparent game opening.
export default { title: 'Scene/Overlay', component: Overlay, parameters: { frame: 'scene' }, render: () => <Overlay /> };

export const TrainerBattle = { args: { demo: '' } };
export const FullTrainerTeam = { args: { demo: 'team=6' } };
export const WildBattle = { args: { demo: 'battle=wild' } };
export const BattleIntro = { args: { demo: 'battle=intro' } };
export const Town = { args: { demo: 'battle=none' } };
export const RouteDay = { args: { demo: 'battle=none&location=route&pokemon=totodile' } };
export const RouteNight = { args: { demo: 'battle=none&location=route&time=night' } };
export const RouteSurf = { args: { demo: 'battle=none&location=route&route=35&movement=surf&pokemon=totodile' } };
export const NoPokemon = { args: { demo: 'pokemon=none' } };
export const NoCounters = { args: { demo: 'counters=none&pokemon=totodile' } };
export const RouteLargestCrystalTable = { args: { demo: 'battle=none&location=route&map=3:39&time=morning' } };
export const RouteDenseDSTable = { args: { demo: 'game=platinum&battle=none&encounters=many' } };
