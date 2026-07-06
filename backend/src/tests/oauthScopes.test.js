import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRequiredScopes, getMissingScopes, parseScopeString } from '../utils/oauthScopes.js';

const READ_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';

test('parseScopeString handles space-delimited OAuth scopes', () => {
  const parsed = parseScopeString(`${READ_SCOPE} openid ${SEND_SCOPE}`);

  assert.equal(parsed.has(READ_SCOPE), true);
  assert.equal(parsed.has(SEND_SCOPE), true);
  assert.equal(parsed.has('openid'), true);
});

test('getMissingScopes returns only absent required scopes', () => {
  assert.deepEqual(getMissingScopes(`${READ_SCOPE} openid`, [READ_SCOPE, SEND_SCOPE]), [SEND_SCOPE]);
});

test('assertRequiredScopes throws a controlled error for partial grants', () => {
  assert.throws(
    () => assertRequiredScopes('openid https://www.googleapis.com/auth/userinfo.email', [READ_SCOPE], 'Gmail sync'),
    (error) => error.code === 'GMAIL_SCOPES_MISSING' && error.statusCode === 403
  );
});
