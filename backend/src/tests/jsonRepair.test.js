import assert from 'node:assert/strict';
import test from 'node:test';
import { parseJsonWithRepair } from '../utils/jsonRepair.js';

test('parseJsonWithRepair parses valid JSON', () => {
  assert.deepEqual(parseJsonWithRepair('{"ok":true}'), { ok: true });
});

test('parseJsonWithRepair extracts fenced JSON', () => {
  assert.deepEqual(parseJsonWithRepair('```json\n{"ok":true}\n```'), { ok: true });
});

