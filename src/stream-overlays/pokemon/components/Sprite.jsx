import { useGamehook } from '@display';
import SpeciesImage from './SpeciesImage.jsx';

// Picture for a Pokémon property path (reads `${path}.dex_number`). `sprite` forces game sprites.
export default function Sprite(props) {
  const gamehook = useGamehook();
  return <SpeciesImage dex={gamehook.value(`${props.path}.dex_number`, 0)} override={props.override} sprite={props.sprite} />;
}
