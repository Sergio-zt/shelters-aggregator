import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextSheetSize,
  nearestSheetSize,
  resolveSheetSize,
  sheetStops,
  type SheetSize,
} from './sheetModel';
test('informational panels toggle only between shown and collapsed', () => {
  let size: SheetSize = 'half';
  for (let i = 0; i < 20; i++) {
    size = nextSheetSize(size, 'state');
    assert.equal(size, i % 2 ? 'half' : 'collapsed');
  }
  assert.equal(resolveSheetSize('expanded', 'state'), 'half');
});
test('state-panel drags cannot introduce an expanded third position', () => {
  for (const height of [568, 740, 844, 1000]) {
    const stops = sheetStops('state', height);
    assert.deepEqual(
      stops.map((s) => s.size),
      ['collapsed', 'half'],
    );
    assert.equal(stops[0].height, 48);
    assert.ok(stops[1].height <= height - 158);
    assert.equal(nearestSheetSize(-10000, 'state', height), 'collapsed');
    assert.equal(nearestSheetSize(10000, 'state', height), 'half');
  }
});
test('result lists retain their three useful sizes', () => {
  assert.equal(nextSheetSize('half', 'list'), 'expanded');
  assert.equal(nextSheetSize('expanded', 'list'), 'collapsed');
  assert.equal(nextSheetSize('collapsed', 'list'), 'half');
  assert.equal(nearestSheetSize(800, 'list', 844), 'expanded');
});
