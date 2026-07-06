import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGmailMessage } from '../utils/gmailParser.js';

test('parseGmailMessage extracts headers and plain body', () => {
  const parsed = parseGmailMessage({
    id: 'msg-1',
    threadId: 'thread-1',
    labelIds: ['INBOX'],
    snippet: 'hello',
    internalDate: '1700000000000',
    payload: {
      headers: [
        { name: 'Subject', value: 'Test subject' },
        { name: 'From', value: 'Jane Doe <jane@example.com>' },
        { name: 'To', value: 'John <john@example.com>' },
        { name: 'Message-ID', value: '<msg@example.com>' }
      ],
      mimeType: 'text/plain',
      body: {
        data: Buffer.from('Hello world').toString('base64url')
      }
    }
  });

  assert.equal(parsed.gmailMessageId, 'msg-1');
  assert.equal(parsed.gmailThreadId, 'thread-1');
  assert.equal(parsed.subject, 'Test subject');
  assert.equal(parsed.senderEmail, 'jane@example.com');
  assert.equal(parsed.bodyText, 'Hello world');
  assert.deepEqual(parsed.labelIds, ['INBOX']);
});

