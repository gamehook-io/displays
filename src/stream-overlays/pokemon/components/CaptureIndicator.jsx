import { Show } from 'solid-js';
export default function CaptureIndicator(props) {
  const status = () => props.caught === true ? 'Caught' : props.caught === false ? 'Not caught' : 'Unknown';
  return <Show when={typeof props.caught === 'boolean'}><span class="capture-status" role="img" aria-label={status()}><i class="capture-ball" classList={{ caught: props.caught === true, uncaught: props.caught === false, unknown: props.caught == null }} aria-hidden="true" /></span></Show>;
}
