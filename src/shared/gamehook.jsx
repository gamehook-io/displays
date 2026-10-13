import { createContext, createSignal, createEffect, onMount, onCleanup, useContext, batch } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { createGamehookClient, pathSegments } from './client.js';

const Context = createContext();
export function GamehookProvider(props) {
  const [data, setData] = createStore({});
  const [status, setStatus] = createSignal('waiting');
  const [message, setMessage] = createSignal('Waiting for Gamehook');
  const [mapper, setMapper] = createSignal(null);
  const rawValue = (path, fallback) => {
    const segments = pathSegments(path);
    return segments.reduce((node, key) => node?.[key], data) ?? fallback;
  };
  const value = (path, fallback) => (props.resolveValue ? props.resolveValue(path, rawValue, mapper()) : rawValue(path)) ?? fallback;
  const apply = changes => {
    const updates = changes.map(change => ({ ...change, keys: pathSegments(change.path) }));
    if (updates.some(({ keys }) => {
      const parent = keys.slice(0, -1).reduce((node, key) => node?.[key], data);
      return parent == null || typeof parent !== 'object' || !Object.hasOwn(parent, keys.at(-1));
    })) return false;
    batch(() => {
      for (const change of updates) setData(...change.keys, () => change.value);
    });
    return true;
  };
  const client = createGamehookClient({
    endpoint: `${props.config.gamehookUrl}/instances/${props.config.instance}`,
    expectedMapperId: props.config.mapperId,
    acceptMapper: props.acceptMapper,
    mapperRequirement: props.mapperRequirement,
    onMapper: setMapper,
    onSnapshot: (snapshot, pending) => batch(() => { setData(reconcile(snapshot)); return apply(pending); }),
    onChanges: apply,
    onStatus: (next, detail) => batch(() => {
      setStatus(next);
      if (detail) setMessage(detail);
      if (next === 'waiting') { setData(reconcile({})); setMapper(null); }
    }),
  });
  onMount(() => {
    if (props.demo) {
      // Preview controls replace snapshots without remounting story children or starting a client.
      createEffect(() => {
        const snapshot = props.demo;
        if (!snapshot) return;
        batch(() => {
          setMapper(props.demoMapper || null);
          setData(reconcile(snapshot));
          setStatus('demo');
        });
      });
    } else client.start();
  });
  onCleanup(() => client.stop());
  return <Context.Provider value={{ data, value, rawValue, mapper, status, message }}>{props.children}</Context.Provider>;
}
export function useGamehook() {
  const context = useContext(Context);
  if (!context) throw new Error('useGamehook must be inside GamehookProvider');
  return context;
}
