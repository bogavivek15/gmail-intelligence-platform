import { decodeBase64Url } from './base64url.js';
import { sha256 } from './crypto.js';
import { decodeMimeWords, getHeader, parseAddress, parseAddressList } from './emailHeaders.js';

export function parseGmailMessage(message) {
  const payload = message.payload || {};
  const headers = payload.headers || [];
  const subject = decodeMimeWords(getHeader(headers, 'Subject') || message.snippet || '(No subject)');
  const from = parseAddress(getHeader(headers, 'From') || '');
  const bodies = collectBodies(payload);
  const bodyHtml = bodies.html.join('\n\n').trim();
  const bodyText = bodies.text.join('\n\n').trim() || stripHtml(bodyHtml) || message.snippet || '';

  return {
    gmailMessageId: message.id,
    gmailThreadId: message.threadId,
    messageIdHeader: getHeader(headers, 'Message-ID'),
    inReplyToHeader: getHeader(headers, 'In-Reply-To'),
    referencesHeader: getHeader(headers, 'References'),
    senderEmail: from.email,
    senderName: from.name,
    toEmails: parseAddressList(getHeader(headers, 'To') || ''),
    ccEmails: parseAddressList(getHeader(headers, 'Cc') || ''),
    bccEmails: parseAddressList(getHeader(headers, 'Bcc') || ''),
    subject,
    snippet: message.snippet || '',
    bodyText,
    bodyHtml,
    internalDate: message.internalDate ? new Date(Number(message.internalDate)).toISOString() : null,
    historyId: message.historyId || null,
    rawHeaders: headers.reduce((acc, header) => {
      acc[header.name] = header.value;
      return acc;
    }, {}),
    sizeEstimate: message.sizeEstimate || null,
    hasAttachments: hasAttachments(payload),
    bodyHash: sha256(`${subject}\n${bodyText || bodyHtml || message.snippet || ''}`),
    labelIds: message.labelIds || []
  };
}

function collectBodies(part, bodies = { text: [], html: [] }) {
  if (!part) {
    return bodies;
  }

  const data = part.body?.data ? decodeBase64Url(part.body.data) : '';
  const mimeType = (part.mimeType || '').toLowerCase();

  if (data && mimeType === 'text/plain') {
    bodies.text.push(data);
  }

  if (data && mimeType === 'text/html') {
    bodies.html.push(data);
  }

  for (const child of part.parts || []) {
    collectBodies(child, bodies);
  }

  return bodies;
}

function hasAttachments(part) {
  if (!part) {
    return false;
  }

  if (part.filename || part.body?.attachmentId) {
    return true;
  }

  return (part.parts || []).some(hasAttachments);
}

export function stripHtml(value = '') {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

