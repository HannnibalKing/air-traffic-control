const test = require('node:test');
const assert = require('node:assert/strict');
const { detectConflicts } = require('../server');

test('detects aircraft inside horizontal and vertical separation limits', () => {
  const conflicts = detectConflicts([
    { id: 'A', x: 0, y: 0, altitude: 30000 },
    { id: 'B', x: 3, y: 4, altitude: 30500 },
  ]);
  assert.equal(conflicts.length, 1);
  assert.deepEqual(conflicts[0].aircraft, ['A', 'B']);
});

test('ignores aircraft separated by altitude', () => {
  assert.equal(detectConflicts([
    { id: 'A', x: 0, y: 0, altitude: 30000 },
    { id: 'B', x: 1, y: 1, altitude: 32000 },
  ]).length, 0);
});
