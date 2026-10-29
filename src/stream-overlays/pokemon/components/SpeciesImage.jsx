import SpeciesImage from '../../../shared/pokemon/SpeciesImage.jsx';
import config from '../config.js';

// Stream overlay picture: official artwork first unless config.artwork is false or `sprite` forces the game sprite.
export default function StreamSpeciesImage(props) {
  return <SpeciesImage dex={props.dex} override={props.override} prefer={config.artwork === false || props.sprite ? 'sprite-only' : 'art'} />;
}
