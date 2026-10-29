import { Show } from 'solid-js';
import { Field, useGamehook } from '@display';
import Sprite from './Sprite.jsx';
import HealthBar from './HealthBar.jsx';
import ExperienceBar from './ExperienceBar.jsx';
import StatusCondition from './StatusCondition.jsx';
import PartySprites from './PartySprites.jsx';
import TypeLabels from './TypeLabels.jsx';
import GenderMarker from './GenderMarker.jsx';
export default function PokemonHero(props) {
  const gamehook = useGamehook();
  const name = () => {
    const nickname = gamehook.value(`${props.path}.nickname`, null);
    return typeof nickname === 'string' && nickname.trim() && nickname !== '0' ? nickname : gamehook.value(`${props.path}.species`, null);
  };
  const nameSize = () => `${Math.max(18, Math.min(28, Math.floor(400 / String(name() || '').length)))}px`;
  return <div class="pokemon-hero" classList={{ 'player-hud': Boolean(props.statsPath) }}>
    <Show when={props.statsPath} fallback={<Sprite path={props.path} override={props.sprite} />}>
      <div class="hud-sprite"><Sprite path={props.path} override={props.sprite} /></div>
      <div class="hud-info">
        <div class="hud-title">
          <h1 class="hud-species" style={{ 'font-size': nameSize() }}><span>{name()}</span><GenderMarker path={props.path} /></h1>
          <h2 class="player-heading">Level <Field path={`${props.path}.level`} /><StatusCondition path={`${props.path}.status_condition`} /></h2>
        </div>
        <Show when={props.types?.length}><TypeLabels types={props.types} /></Show>
        <HealthBar path={props.statsPath} />
        <ExperienceBar path={props.path} />
        <PartySprites />
      </div>
    </Show>
  </div>;
}
