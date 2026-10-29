import SpeciesImage from '../../shared/pokemon/SpeciesImage.jsx';

// Picture for the bottom screen: pixel sprites by default, official artwork with `art`.
export default function Mon(props) {
  return <SpeciesImage class="mon" dex={props.dex} prefer={props.art ? 'art' : 'sprite'} lazy={props.lazy} />;
}
