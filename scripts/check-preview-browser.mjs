// Optional browser check. Start Storybook first; Playwright is separate validation tooling.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  const gamehookRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('/gamehook/')) gamehookRequests.push(request.url());
  });
  const base = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';
  const openStory = async id => {
    await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`);
  };
  const updateDemo = (storyId, demo) => page.evaluate(({ storyId, demo }) => {
    window.__STORYBOOK_ADDONS_CHANNEL__.emit('updateStoryArgs', { storyId, updatedArgs: { demo } });
  }, { storyId, demo });

  const storyId = 'dragon-warrior-scene--journey-to-charlock';
  await openStory(storyId);
  await page.locator('.dw-level b').waitFor();
  assert.equal(await page.locator('.dw-level b').innerText(), '24');
  await updateDemo(storyId, 'sample=early');
  await page.waitForFunction(() => document.querySelector('.dw-level b')?.textContent === '1');
  assert.equal(await page.locator('.dw-spells').count(), 0);
  assert.equal(await page.locator('.dw-enemy').count(), 0);
  await updateDemo(storyId, 'sample=full');
  await page.waitForFunction(() => document.querySelectorAll('.dw-items li').length === 8);
  assert.equal(await page.locator('.dw-spells span').count(), 10);
  await updateDemo(storyId, 'sample=critical');
  await page.waitForFunction(() => document.querySelector('.dw-vitals [aria-label="Health"]')?.getAttribute('aria-valuenow') === '0');
  await updateDemo(storyId, 'sample=missing');
  await page.waitForFunction(() => !document.querySelector('.dw-vitals'));
  assert.equal(await page.locator('.dw-items').count(), 0);

  for (const name of ['journey-to-charlock', 'first-steps', 'critical-health', 'full-inventory', 'missing-optional-data', 'transparent-opening', 'hero', 'pack', 'location-and-enemy', 'learned-spells']) {
    await openStory(`dragon-warrior-scene--${name}`);
    await page.locator('.dragon-warrior-overlay').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const clipped = await page.locator('.dw-rail').evaluateAll(rails => rails
      .filter(rail => rail.scrollHeight > rail.clientHeight + 1).map(rail => rail.className));
    assert.deepEqual(clipped, [], name);
  }

  const pokemonStoryId = 'scene-overlay--trainer-battle';
  await openStory(pokemonStoryId);
  await page.locator('.pokemon-hero').waitFor();
  await updateDemo(pokemonStoryId, 'pokemon=totodile');
  await page.waitForFunction(() => document.querySelector('.hud-species')?.textContent.includes('TOTODILE'));
  assert.ok(await page.locator('.health-row [aria-label="Health"]').count() > 0);
  await updateDemo(pokemonStoryId, 'pokemon=none');
  await page.waitForFunction(() => !document.querySelector('.pokemon-hero'));
  await updateDemo(pokemonStoryId, 'team=6');
  await page.locator('.pokemon-hero').waitFor();
  assert.ok(await page.locator('.stats .stat').count() > 0);
  assert.deepEqual(gamehookRequests, [], 'Preview changes must never start live transport');
  assert.deepEqual(errors, []);
  console.log('PASS: 10 Dragon Warrior stories, fixture-control changes in both games, zero/missing values, no clipping, no live requests, no page errors.');
} finally {
  await browser.close();
}
