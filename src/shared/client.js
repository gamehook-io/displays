const unsafeKeys = new Set(['__proto__', 'constructor', 'prototype']);

export function pathSegments(path) {
  if (typeof path !== 'string' || path.length > 512) throw new Error('Invalid property path');
  const segments = path.split('.');
  if (segments.some(key => !key || unsafeKeys.has(key))) throw new Error('Invalid property path');
  return segments;
}

export function validateSnapshot(snapshot) {
  if (!snapshot || Array.isArray(snapshot) || typeof snapshot !== 'object') throw new Error('Invalid property snapshot');
  function visit(value, depth = 0) {
    if (depth > 32) throw new Error('Property snapshot is too deeply nested');
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (unsafeKeys.has(key)) throw new Error('Invalid property snapshot');
      visit(child, depth + 1);
    }
  }
  visit(snapshot);
  return snapshot;
}

export function decodeChanges(text) {
  const changes = JSON.parse(text);
  if (!Array.isArray(changes) || changes.length > 20000) throw new Error('Invalid property updates');
  return changes.map(change => {
    if (!change || typeof change !== 'object' || !Object.hasOwn(change, 'value')) throw new Error('Invalid property update');
    pathSegments(change.path);
    validateSnapshot({ value: change.value });
    return { path: change.path, value: change.value };
  });
}

// Transport owns timeouts and lifetimes. Solid integration only owns reactive state.
export function createGamehookClient({ endpoint, expectedMapperId, acceptMapper, mapperRequirement = 'supported mapper', onMapper = () => {}, onSnapshot, onChanges, onStatus, fetch: request = globalThis.fetch, WebSocket: Socket = globalThis.WebSocket, location = globalThis.location, requestTimeout = 3000, retryDelay = 500, healthInterval = 1000, setTimeout: schedule = globalThis.setTimeout, clearTimeout: cancel = globalThis.clearTimeout }) {
  let stopped = true, current, retry;
  const waiting = 'Waiting for Gamehook';
  function connect() {
    if (stopped) return;
    const attempt = { closed: false, initialized: false, pending: new Map(), controllers: new Set(), timers: new Set(), socket: null, mapper: null };
    current = attempt;
    const live = () => !stopped && current === attempt && !attempt.closed;
    function later(callback, delay) {
      const timer = schedule(() => { attempt.timers.delete(timer); if (live()) callback(); }, delay);
      attempt.timers.add(timer);
      return timer;
    }
    function dispose() {
      attempt.closed = true;
      for (const timer of attempt.timers) cancel(timer);
      attempt.timers.clear();
      for (const controller of attempt.controllers) controller.abort();
      attempt.controllers.clear();
      attempt.socket?.close();
    }
    attempt.dispose = dispose;
    function fail(reason) {
      if (!live()) return;
      dispose();
      onStatus('waiting', reason || waiting);
      retry = schedule(connect, retryDelay);
    }
    async function get(path, json = false) {
      const controller = new AbortController();
      attempt.controllers.add(controller);
      const timer = later(() => fail(`${waiting} — connection timed out`), requestTimeout);
      try {
        const response = await request(endpoint + path, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 404
          ? `${waiting} — load a mapper in the selected instance`
          : waiting);
        return json ? await response.json() : response;
      } finally {
        cancel(timer);
        attempt.timers.delete(timer);
        attempt.controllers.delete(controller);
      }
    }
    async function health() {
      try {
        await get('/health');
        const mapper = await get('/mapper', true);
        if (!live()) return;
        if (JSON.stringify(mapper) !== attempt.mapper) {
          fail(`${waiting} — mapper changed, synchronizing`);
          return;
        }
        later(health, healthInterval);
      } catch (error) { fail(error.message?.startsWith(waiting) ? error.message : waiting); }
    }
    const startup = later(() => fail(`${waiting} — connection timed out`), requestTimeout);
    (async () => {
      try {
        await get('/health');
        const mapper = await get('/mapper', true);
        if (expectedMapperId && String(mapper?.id).toLowerCase() !== expectedMapperId.toLowerCase()) {
          throw new Error(`${waiting} — load the game mapper configured for this display`);
        }
        if (acceptMapper && !acceptMapper(mapper)) throw new Error(`${waiting} — load a ${mapperRequirement}`);
        attempt.mapper = JSON.stringify(mapper);
        if (!live()) return;
        onMapper(mapper);
        const url = new URL(endpoint + '/ws', location.href);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        const socket = attempt.socket = new Socket(url);
        socket.onclose = () => fail(`${waiting} — reconnecting`);
        socket.onerror = () => fail(`${waiting} — connection lost`);
        socket.onmessage = event => {
          if (!live()) return;
          try {
            const changes = decodeChanges(event.data);
            if (attempt.initialized) {
              if (onChanges(changes) === false) fail(`${waiting} — mapper schema changed, synchronizing`);
            }
            else {
              for (const change of changes) attempt.pending.set(change.path, change);
              if (attempt.pending.size > 20000) throw new Error('Too many pending updates');
            }
          } catch { fail(`${waiting} — invalid property update`); }
        };
        socket.onopen = async () => {
          try {
            const snapshot = validateSnapshot(await get('/properties', true));
            if (!live()) return;
            if (onSnapshot(snapshot, [...attempt.pending.values()]) === false) {
              fail(`${waiting} — mapper schema changed, synchronizing`);
              return;
            }
            attempt.pending.clear();
            attempt.initialized = true;
            cancel(startup);
            attempt.timers.delete(startup);
            onStatus('connected');
            health();
          } catch (error) { fail(error.message?.startsWith(waiting) ? error.message : `${waiting} — invalid property snapshot`); }
        };
      } catch (error) { fail(error.message?.startsWith(waiting) ? error.message : waiting); }
    })();
  }
  return {
    start() { if (!stopped) return; stopped = false; onStatus('waiting', waiting); connect(); },
    stop() { stopped = true; cancel(retry); current?.dispose(); current = null; },
    refresh() { if (stopped) return; cancel(retry); current?.dispose(); onStatus('waiting', waiting); connect(); },
  };
}
