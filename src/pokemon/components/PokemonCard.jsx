import { Field, useGamehook } from '@overlay';
import Sprite from './Sprite.jsx';
import Stats from './Stats.jsx';
import Moves from './Moves.jsx';
import HealthBar from './HealthBar.jsx';

export default function PokemonCard(props) {
  const gamehook = useGamehook();
  return <article class="pokemon-card" classList={{ fainted: gamehook.value(`${props.path}.stats.hp`, null) === 0 }}>
    <div class="card-heading"><strong><Field path={`${props.path}.species`} /></strong><span>Lv. <Field path={`${props.path}.level`} /></span></div>
    <HealthBar path={`${props.path}.stats`} />
    <div class="opponent-body"><div class="opponent-sprite"><Sprite path={props.path} /></div><Stats path={`${props.path}.stats`} /><Moves compact path={`${props.path}.moves`} /></div>
  </article>;
}
