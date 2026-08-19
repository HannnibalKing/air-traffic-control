const test = require('node:test');
const assert = require('node:assert/strict');
const { validateAircraft, withFreshness } = require('../server');

test('validates bounded aircraft state', () => {
  assert.equal(validateAircraft({ id: 'A', x: 0, y: 0, altitude: 30000 }), null);
  assert.match(validateAircraft({ id: 'A', x: 0, y: 0, altitude: -1 }), /non-negative/);
  assert.match(validateAircraft({ id: 'A', x: 2000, y: 0, altitude: 30000 }), /bounds/);
});

test('marks old surveillance data stale', () => {
  const result = withFreshness({ id: 'A', updatedAt: new Date(Date.now() - 60_000).toISOString() }, Date.now());
  assert.equal(result.freshness, 'stale');
  assert.ok(result.ageMs >= 60_000);
});
