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
assert.match(js, /label: '0–99'/, 'missing 0–99 bonus tier');
assert.match(js, /label: '100–149'/, 'missing 100–149 bonus tier');
assert.match(js, /label: '150–199'/, 'missing 150–199 bonus tier');
assert.match(js, /label: '200–249'/, 'missing 200–249 bonus tier');
assert.match(js, /label: '250\+'/, 'missing 250+ bonus tier');
assert.match(js, /percent: 0\.5/, 'missing 0.5% bonus rate');
assert.match(js, /percent: 3/, 'missing 3% bonus rate');
assert.match(js, /Math\.min\(current\.percent, parkCommissionPercent\)/, 'cashback must be capped by park commission');
assert.match(js, /eligibleEarnings: 84300/, 'missing eligible cashback base');
assert.match(js, /Math\.round\(eligibleEarnings \* effectivePercent\) \/ 100/, 'cashback amount must be calculated from the eligible base');
assert.match(html, /v1\.3/, 'visible application version must be v1.3');
assert.doesNotMatch(html, /520 ₽/, 'old hardcoded cashback amount must be removed');
assert.doesNotMatch(`${html}\n${css}\n${js}`, /\b\d{10,16}\b|bot\d*:[A-Za-z0-9_-]{20,}/i, 'possible real phone or bot token');
assert.doesNotMatch(`${html}\n${js}`, /(?:улица|ул\.|проспект|дом\s+\d+)/i, 'possible real address');

console.log('Static checks passed: navigation, periods, Telegram SDK, and demo-data guardrails.');
