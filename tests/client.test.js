import test from 'node:test';
import assert from 'node:assert/strict';
import { createGamehookClient, decodeChanges, validateSnapshot, pathSegments } from '../src/shared/client.js';

const flush = () => new Promise(resolve => setImmediate(resolve));
function clock() {
  let now = 0, next = 0;
  const timers = new Map();
  return {
    setTimeout(callback, delay) { const id = ++next; timers.set(id, { callback, due: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    advance(milliseconds) {
      const end = now + milliseconds;
      while (true) {
        const entry = [...timers.entries()].filter(([, timer]) => timer.due <= end).sort((a, b) => a[1].due - b[1].due)[0];
        if (!entry) break;
        now = entry[1].due; timers.delete(entry[0]); entry[1].callback();
      }
      now = end;
    },
    get size() { return timers.size; },
  };
}
function harness({ request, expectedMapperId, acceptMapper, mapperRequirement, onMapper, onSnapshot, onChanges } = {}) {
  const time = clock(), sockets = [], statuses = [], snapshots = [], updates = [], calls = [];
  class Socket {
    constructor(url) { this.url = String(url); sockets.push(this); }
    close() { this.onclose?.(); }
    open() { this.onopen?.(); }
    send(changes) { this.onmessage?.({ data: JSON.stringify(changes) }); }
  }
  const client = createGamehookClient({ endpoint: '/gamehook/instances/0', expectedMapperId, acceptMapper, mapperRequirement, onMapper, location: { href: 'http://localhost:5173/', protocol: 'http:' }, WebSocket: Socket,
    fetch: (path, options) => { calls.push(path); return request ? request(path, options) : Promise.resolve({ ok: true, json: async () => ({ player: { hp: 10 } }) }); },
    onSnapshot: onSnapshot || ((...args) => snapshots.push(args)), onChanges: onChanges || (changes => updates.push(changes)), onStatus: (...args) => statuses.push(args),
    setTimeout: time.setTimeout, clearTimeout: time.clearTimeout, requestTimeout: 100, retryDelay: 20, healthInterval: 30,
  });
  return { client, time, sockets, statuses, snapshots, updates, calls };
}
test('buffers latest early changes, opens only after snapshot, streams afterward', async () => {
  const h = harness(); h.client.start(); await flush();
  assert.equal(h.statuses.at(-1)[0], 'waiting');
  h.sockets[0].send([{ path: 'player.hp', value: 8 }]);
  h.sockets[0].send([{ path: 'player.hp', value: 7 }]);
  h.sockets[0].open(); await flush();
  assert.equal(h.statuses.at(-1)[0], 'connected');
  assert.deepEqual(h.snapshots[0][1], [{ path: 'player.hp', value: 7 }]);
  h.sockets[0].send([{ path: 'player.hp', value: 0 }]);
  assert.equal(h.updates[0][0].value, 0);
  h.client.stop(); assert.equal(h.time.size, 0);
});
test('mapper policy reports author instructions before opening an unsupported stream', async () => {
  let observed = false;
  const h = harness({ acceptMapper: () => false, mapperRequirement: 'compatible game mapper', onMapper: () => { observed = true; } });
  h.client.start(); await flush();
  assert.equal(h.sockets.length, 0);
  assert.equal(observed, false);
  assert.match(h.statuses.at(-1)[1], /load a compatible game mapper/);
  h.client.stop();
});

test('the wrong game mapper never mounts the overlay or opens a socket', async () => {
  const h = harness({ expectedMapperId: 'expected', request: async () => ({ ok: true, json: async () => ({ id: 'other' }) }) });
  h.client.start(); await flush();
  assert.equal(h.sockets.length, 0);
  assert.equal(h.statuses.at(-1)[0], 'waiting');
  assert.match(h.statuses.at(-1)[1], /game mapper configured/);
  h.client.stop();
});

test('a schema mismatch in buffered initialization updates prevents connected status', async () => {
  const h = harness({ onSnapshot: () => false });
  h.client.start(); await flush(); h.sockets[0].open(); await flush();
  assert.equal(h.statuses.at(-1)[0], 'waiting');
  assert.match(h.statuses.at(-1)[1], /mapper schema changed/);
  h.client.stop();
});
test('failed health never creates a WebSocket and retries', async () => {
  const h = harness({ request: async () => ({ ok: false, status: 503 }) });
  h.client.start(); await flush(); assert.equal(h.sockets.length, 0);
  h.time.advance(20); await flush(); assert.equal(h.calls.length, 2);
  h.client.stop();
});
test('a hung health request after connecting hides data and retries', async () => {
  let healthReads = 0;
  const h = harness({ request: (path, { signal }) => {
    if (path.endsWith('/health') && ++healthReads > 1) return new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted'))));
    return Promise.resolve({ ok: true, json: async () => ({ player: { hp: 10 } }) });
  } });
  h.client.start(); await flush(); h.sockets[0].open(); await flush();
  assert.equal(h.statuses.at(-1)[0], 'connected');
  h.time.advance(100); await flush();
  assert.equal(h.statuses.at(-1)[0], 'waiting');
  assert.match(h.statuses.at(-1)[1], /timed out/);
  h.client.stop();
});
test('stale socket callbacks cannot close a new connection', async () => {
  const h = harness(); h.client.start(); await flush();
  const first = h.sockets[0]; first.open(); await flush(); first.close();
  h.time.advance(20); await flush(); const second = h.sockets[1]; second.open(); await flush();
  first.onerror(); first.send([{ path: 'player.hp', value: 99 }]);
  assert.equal(h.statuses.at(-1)[0], 'connected'); assert.equal(h.updates.length, 0);
  h.client.stop();
});
test('malformed updates cause a controlled reconnect', async () => {
  const h = harness(); h.client.start(); await flush(); h.sockets[0].open(); await flush();
  h.sockets[0].send([null]); assert.equal(h.statuses.at(-1)[0], 'waiting');
  h.client.stop();
});
test('stop aborts in-flight snapshot and ignores late completion', async () => {
  let aborted = false, finish;
  const h = harness({ request: (path, { signal }) => {
    if (path.endsWith('/properties')) {
      signal.addEventListener('abort', () => { aborted = true; });
      return new Promise(resolve => { finish = () => resolve({ ok: true, json: async () => ({ player: {} }) }); });
    }
    return Promise.resolve({ ok: true, json: async () => ({ name: 'Crystal' }) });
  } });
  h.client.start(); await flush(); h.sockets[0].open(); await flush(); h.client.stop(); finish(); await flush();
  assert.equal(aborted, true); assert.equal(h.snapshots.length, 0); assert.equal(h.time.size, 0);
});
test('unsafe paths and snapshots are rejected; null property values remain valid', () => {
  assert.throws(() => pathSegments('player.__proto__.hp'));
  assert.throws(() => pathSegments('player..hp'));
  assert.throws(() => validateSnapshot(JSON.parse('{"player":{"__proto__":{}}}')));
  assert.throws(() => decodeChanges('[{"path":"hp"}]'));
  assert.deepEqual(decodeChanges('[{"path":"player.hp","value":null}]'), [{ path: 'player.hp', value: null }]);
});

test('changing mapper metadata reconnects and loads a new snapshot', async () => {
  let mapper = 'Crystal';
  const h = harness({ request: async path => ({ ok: true, json: async () => path.endsWith('/mapper') ? { name: mapper } : { player: { hp: 10 } } }) });
  h.client.start(); await flush(); h.sockets[0].open(); await flush();
  assert.equal(h.statuses.at(-1)[0], 'connected');
  mapper = 'Another game'; h.time.advance(30); await flush();
  assert.equal(h.statuses.at(-1)[0], 'waiting');
  assert.match(h.statuses.at(-1)[1], /mapper changed/); h.client.stop();
});
