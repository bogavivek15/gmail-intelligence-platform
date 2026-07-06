import supabase from '../config/supabase.js';
import { encodeBase64Url } from '../utils/base64url.js';
import { createGmailDraft, updateGmailDraft, sendGmailDraft, sendRawMessage } from './gmail.service.js';
import { insertAuditEvent } from './supabase.service.js';

export async function sendReplyDraft(userId, draftId, reviewed = {}) {
  const { data: draft, error: draftError } = await supabase
    .from('email_drafts')
    .select('*, email_threads(*), email_messages(*)')
    .eq('user_id', userId)
    .eq('id', draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  if (draft.draft_type !== 'reply') {
    const error = new Error('Only reply drafts can be sent through this route');
    error.statusCode = 400;
    error.code = 'INVALID_DRAFT_TYPE';
    throw error;
  }

  if (draft.status !== 'draft') {
    const error = new Error('Draft is not sendable');
    error.statusCode = 400;
    error.code = 'DRAFT_NOT_SENDABLE';
    throw error;
  }

  const original = draft.email_messages;
  const thread = draft.email_threads;

  if (!original?.sender_email || !thread?.gmail_thread_id) {
    const error = new Error('Reply draft is missing original message context');
    error.statusCode = 400;
    error.code = 'DRAFT_CONTEXT_MISSING';
    throw error;
  }

  const subject = reviewed.subject?.trim() || draft.subject;
  const body = reviewed.body?.trim() || draft.body;

  const raw = buildReplyRaw({
    to: original.sender_email,
    subject,
    body,
    inReplyTo: original.message_id_header,
    references: original.references_header || original.message_id_header
  });

  let sent;
  if (draft.gmail_draft_id) {
    try {
      await updateGmailDraft(userId, draft.gmail_draft_id, { raw, threadId: thread.gmail_thread_id });
      sent = await sendGmailDraft(userId, draft.gmail_draft_id);
    } catch (err) {
      sent = await sendRawMessage(userId, raw, thread.gmail_thread_id);
    }
  } else {
    sent = await sendRawMessage(userId, raw, thread.gmail_thread_id);
  }

  const { data: updated, error: updateError } = await supabase
    .from('email_drafts')
    .update({
      status: 'sent',
      subject,
      body,
      gmail_draft_id: sent.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  await insertAuditEvent(userId, 'gmail_reply_sent', {
    draft_id: draft.id,
    gmail_message_id: sent.id,
    gmail_thread_id: sent.threadId || sent.thread_id || null
  });

  return { draft: updated, sent };
}

export async function sendComposedDraft(userId, draftId, reviewed = {}) {
  const { data: draft, error: draftError } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('user_id', userId)
    .eq('id', draftId)
    .single();

  if (draftError) {
    throw draftError;
  }

  if (draft.draft_type !== 'compose') {
    const error = new Error('Only compose drafts can be sent through this route');
    error.statusCode = 400;
    error.code = 'INVALID_DRAFT_TYPE';
    throw error;
  }

  if (draft.status !== 'draft') {
    const error = new Error('Draft is not sendable');
    error.statusCode = 400;
    error.code = 'DRAFT_NOT_SENDABLE';
    throw error;
  }

  const to = reviewed.to_email?.trim() || draft.to_email?.trim() || '';
  if (!to) {
    const error = new Error('Recipient email (To) is required to send composed email');
    error.statusCode = 400;
    error.code = 'RECIPIENT_REQUIRED';
    throw error;
  }

  const subject = reviewed.subject?.trim() || draft.subject;
  const body = reviewed.body?.trim() || draft.body;

  const raw = buildRawEmail({
    to,
    subject,
    body
  });

  let sent;
  if (draft.gmail_draft_id) {
    try {
      await updateGmailDraft(userId, draft.gmail_draft_id, { raw });
      sent = await sendGmailDraft(userId, draft.gmail_draft_id);
    } catch (err) {
      sent = await sendRawMessage(userId, raw);
    }
  } else {
    sent = await sendRawMessage(userId, raw);
  }

  const { data: updated, error: updateError } = await supabase
    .from('email_drafts')
    .update({
      status: 'sent',
      to_email: to,
      subject,
      body,
      gmail_draft_id: sent.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', draft.id)
    .select('*')
    .single();

  if (updateError) {
    throw updateError;
  }

  await insertAuditEvent(userId, 'gmail_composed_sent', {
    draft_id: draft.id,
    gmail_message_id: sent.id
  });

  return { draft: updated, sent };
}

export function buildRawEmail({ to, subject, body }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject || ''}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"'
  ];

  lines.push('', body || '');
  return encodeBase64Url(lines.join('\r\n'));
}

export function buildReplyRaw({ to, subject, body, inReplyTo, references }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject?.startsWith('Re:') ? subject : `Re: ${subject || ''}`}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"'
  ];

  if (inReplyTo) {
    lines.push(`In-Reply-To: ${inReplyTo}`);
  }
  if (references) {
    lines.push(`References: ${references}`);
  }

  lines.push('', body || '');
  return encodeBase64Url(lines.join('\r\n'));
}

