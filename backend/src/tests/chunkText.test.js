import assert from 'node:assert/strict';
import test from 'node:test';
import { chunkText } from '../utils/chunkText.js';

test('chunkText returns empty array for blank input', () => {
  assert.deepEqual(chunkText('   '), []);
});

test('chunkText chunks long text with bounded sizes', () => {
  const chunks = chunkText('a'.repeat(5000), { maxChars: 1000, overlapChars: 100 });
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 1000));
});

