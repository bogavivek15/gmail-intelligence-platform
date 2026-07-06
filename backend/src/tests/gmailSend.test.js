import test from 'node:test';
import assert from 'node:assert';
import { buildRawEmail, buildReplyRaw } from '../services/gmailSend.service.js';
import { decodeBase64Url } from '../utils/base64url.js';

test('buildRawEmail formats plain text mail correctly', () => {
  const result = buildRawEmail({
    to: 'test@example.com',
    subject: 'Hello World',
    body: 'This is a test email body.'
  });

  assert.ok(result);
  const decoded = decodeBase64Url(result);
  assert.ok(decoded.includes('To: test@example.com'));
  assert.ok(decoded.includes('Subject: Hello World'));
  assert.ok(decoded.includes('This is a test email body.'));
});

test('buildReplyRaw formats thread replies correctly', () => {
  const result = buildReplyRaw({
    to: 'replyto@example.com',
    subject: 'Original Subject',
    body: 'This is my reply.',
    inReplyTo: '<message123@mail.com>',
    references: '<ref456@mail.com>'
  });

  assert.ok(result);
  const decoded = decodeBase64Url(result);
  assert.ok(decoded.includes('To: replyto@example.com'));
  assert.ok(decoded.includes('Subject: Re: Original Subject'));
  assert.ok(decoded.includes('In-Reply-To: <message123@mail.com>'));
  assert.ok(decoded.includes('References: <ref456@mail.com>'));
  assert.ok(decoded.includes('This is my reply.'));
});
