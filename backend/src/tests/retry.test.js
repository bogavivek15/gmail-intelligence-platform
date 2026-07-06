import assert from 'node:assert/strict';
import test from 'node:test';
import { withRetry } from '../utils/retry.js';

test('withRetry retries retryable failures', async () => {
  let attempts = 0;
  const result = await withRetry(
    async () => {
      attempts += 1;
      if (attempts < 2) {
        const error = new Error('rate limited');
        error.status = 429;
        throw error;
      }
      return 'ok';
    },
    { baseDelayMs: 1, retries: 2 }
  );

  assert.equal(result, 'ok');
  assert.equal(attempts, 2);
});

