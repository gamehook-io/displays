import GameTime from '../components/GameTime.jsx';
import Badges from '../components/Badges.jsx';
import RunCounters from '../components/RunCounters.jsx';

export default { title: 'Widgets/Run' };

export const Timer = { render: () => <GameTime /> };
export const BadgeCase = { render: () => <Badges /> };
export const Counters = { render: () => <RunCounters /> };
export const Header = { render: () => <><GameTime /><Badges /><RunCounters /></> };
