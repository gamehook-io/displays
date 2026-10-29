import { For, Show } from 'solid-js';
import { useGamehook } from '@display';
import CaptureIndicator from './CaptureIndicator.jsx';
import SpeciesImage from './SpeciesImage.jsx';
import { speciesTypes } from '../../../shared/pokemon/types.js';

export default function EncounterCard(props) {
  const gamehook = useGamehook();
  const caught = () => gamehook.value(`pokedex.caught.${props.pokemon.dex}`, null);
  const types = () => speciesTypes(props.pokemon.dex, gamehook.value('meta.generation', 2));
  const levels = method => `${method.min}${method.max !== method.min ? `–${method.max}` : ''}`;
  return <article class="encounter-entry" classList={{ 'encounter-uncaught': caught() === false }}>
    <div class="encounter-art"><SpeciesImage dex={props.pokemon.dex} /></div>
    <div class="encounter-description">
      <div class="encounter-heading"><strong>{props.pokemon.name}</strong></div>
      <div class="encounter-types"><For each={types()}>{type => <span class={`type-${type}`}>{type}</span>}</For></div>
    </div>
    <div class="encounter-facts">
      <Show when={props.pokemon.min != null}><span class="encounter-level">Lv. {levels(props.pokemon)}</span></Show>
      <Show when={props.pokemon.chance != null}><span class="encounter-rate">{props.pokemon.chance}%</span></Show>
    </div>
    <div class="encounter-capture"><CaptureIndicator caught={caught()} /></div>
  </article>;
}
