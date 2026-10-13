import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOverlayServer } from '../scripts/server.js';
const listen = server => new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}`)));
test('local server serves static assets and refuses writes', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'overlay-server-'));
  await mkdir(join(directory, 'assets')); await writeFile(join(directory, 'index.html'), '<html>overlay</html>'); await writeFile(join(directory, 'assets', 'index-abc123.js'), 'export default 1');
  for (const [name, title] of [['pokemon', 'Pokemon page'], ['dragon-warrior-1', 'Dragon Warrior page']]) {
    await mkdir(join(directory, name)); await writeFile(join(directory, name, 'index.html'), `<html>${title}</html>`);
  }
  await writeFile(join(directory, 'assets', 'font.ttf'), 'font fixture');
  await writeFile(join(directory, 'assets', 'OFL.txt'), 'license fixture');
  const server = createOverlayServer({ directory }); const url = await listen(server);
  t.after(async () => { await server.stop(); await rm(directory, { recursive: true }); });
  const home = await fetch(url); assert.equal(home.status, 200); assert.match(await home.text(), /overlay/);
  for (const [route, title] of [['pokemon', 'Pokemon page'], ['dragon-warrior-1', 'Dragon Warrior page']]) {
    for (const suffix of ['', '/', '/index.html', '?demo=1']) {
      const response = await fetch(`${url}/${route}${suffix}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /^text\/html/);
      assert.equal(await response.text(), `<html>${title}</html>`);
    }
    const head = await fetch(`${url}/${route}`, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  }
  assert.equal((await fetch(url + '/unknown-overlay')).status, 404);
  assert.equal((await fetch(url + '/pokemon/deeper')).status, 404);
  assert.equal((await fetch(url + '/pokemon', { method: 'POST' })).status, 405);
  assert.equal((await fetch(url + '/assets/index-abc123.js')).headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal((await fetch(url + '/assets/index-abc123.js', { method: 'HEAD' })).headers.get('content-length'), '16');
  assert.equal((await fetch(url + '/assets/font.ttf')).headers.get('content-type'), 'font/ttf');
  assert.equal((await fetch(url + '/assets/OFL.txt')).headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal((await fetch(url + '/%zz')).status, 400);
});
