import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
const js = await readFile(new URL('./app.js', import.meta.url), 'utf8');

for (const view of ['home', 'orders', 'bonus', 'profile']) {
  assert.match(html, new RegExp(`data-view="${view}"`), `missing ${view} view`);
  assert.match(html, new RegExp(`data-target="${view}"`), `missing ${view} navigation button`);
}
for (const period of ['today', 'week', 'month']) {
  assert.match(html, new RegExp(`data-period="${period}"`), `missing ${period} period button`);
  assert.match(js, new RegExp(`${period}:\\s*\\{`), `missing ${period} statistics`);
}
assert.match(html, /telegram\.org\/js\/telegram-web-app\.js/);
assert.match(js, /telegram\.ready\(\)/);
assert.match(js, /telegram\.expand\(\)/);
assert.doesNotMatch(`${html}\n${css}\n${js}`, /\b\d{10,16}\b|bot\d*:[A-Za-z0-9_-]{20,}/i, 'possible real phone or bot token');
assert.doesNotMatch(`${html}\n${js}`, /(?:улица|ул\.|проспект|дом\s+\d+)/i, 'possible real address');

console.log('Static checks passed: navigation, periods, Telegram SDK, and demo-data guardrails.');
