import { Show } from 'solid-js';
import { Meter, useGamehook } from '@display';
import { experienceProgress } from '../../../shared/pokemon/experience.js';

export default function ExperienceBar(props) {
  const gamehook = useGamehook();
  const progress = () => experienceProgress(
    gamehook.value(`${props.path}.dex_number`, null),
    gamehook.value(`${props.path}.level`, null),
    gamehook.value(`${props.path}.exp`, null),
  );
  return <Show when={progress()}>{amount => <div class="experience-row">
    <Meter label="Experience" value={amount().value} max={amount().max} color="#2880f0" />
  </div>}</Show>;
}
