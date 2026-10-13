import { Show } from 'solid-js';
import { useGamehook } from '@overlay';
import { pokemonGender } from '../gender.js';

// ♂/♀ for a Pokémon path. Hidden for genderless species, Gen 1, and unknown data.
export default function GenderMarker(props) {
  const gamehook = useGamehook();
  const gender = () => pokemonGender(gamehook.value, props.path);
  return <Show when={gender()}><span class={`gender gender-${gender()}`} role="img" aria-label={gender() === 'female' ? 'Female' : 'Male'}>{gender() === 'female' ? '♀' : '♂'}</span></Show>;
}
