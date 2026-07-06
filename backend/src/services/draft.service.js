import supabase from '../config/supabase.js';
import { COMPOSE_EMAIL_PROMPT_VERSION, buildComposeEmailPrompt } from '../prompts/composeEmail.prompt.js';
import { REPLY_THREAD_PROMPT_VERSION, buildReplyThreadPrompt } from '../prompts/replyThread.prompt.js';
import { validateDraft } from '../utils/validators.js';
import { getMessageById, getThreadById, getThreadMessages } from './emailData.service.js';
import { generateGeminiJson } from './gemini.service.js';
import { createGmailDraft } from './gmail.service.js';
import { buildRawEmail, buildReplyRaw } from './gmailSend.service.js';
import logger from '../utils/logger.js';

export async function composeDraft(userId, { prompt, tone }) {
  if (!prompt?.trim()) {
    const error = new Error('Prompt is required');
    error.statusCode = 400;
    error.code = 'PROMPT_REQUIRED';
    throw error;
  }

  const { data, modelUsed } = await generateGeminiJson({
    userId,
    feature: 'compose_email',
    promptVersion: COMPOSE_EMAIL_PROMPT_VERSION,
    prompt: buildComposeEmailPrompt({ prompt, tone })
  });

  const draft = validateDraft(data);

  let gmailDraftId = null;
  try {
    const raw = buildRawEmail({ to: '', subject: draft.subject, body: draft.body });
    const gmailDraft = await createGmailDraft(userId, { raw });
    gmailDraftId = gmailDraft.id;
  } catch (err) {
    logger.error(`Failed to create Gmail draft for composed email: ${err.message}`);
  }

  const { data: row, error } = await supabase
    .from('email_drafts')
    .insert({
      user_id: userId,
      draft_type: 'compose',
      prompt,
      subject: draft.subject,
      body: draft.body,
      status: 'draft',
      gmail_draft_id: gmailDraftId
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...row, model_used: modelUsed };
}

export async function createReplyDraft(userId, { threadId, messageId, instruction }) {
  const thread = await getThreadById(userId, threadId);
  if (messageId) {
    await getMessageById(userId, messageId);
  }

  const messages = await getThreadMessages(userId, thread.id);
  const { data, modelUsed } = await generateGeminiJson({
    userId,
    feature: 'reply_thread',
    promptVersion: REPLY_THREAD_PROMPT_VERSION,
    prompt: buildReplyThreadPrompt({ thread, messages, instruction })
  });

  const draft = validateDraft(data);

  let gmailDraftId = null;
  try {
    const original = messages[messages.length - 1];
    if (original) {
      const raw = buildReplyRaw({
        to: original.sender_email,
        subject: draft.subject,
        body: draft.body,
        inReplyTo: original.message_id_header,
        references: original.references_header || original.message_id_header
      });
      const gmailDraft = await createGmailDraft(userId, { raw, threadId: thread.gmail_thread_id });
      gmailDraftId = gmailDraft.id;
    }
  } catch (err) {
    logger.error(`Failed to create Gmail draft for reply: ${err.message}`);
  }

  const { data: row, error } = await supabase
    .from('email_drafts')
    .insert({
      user_id: userId,
      thread_id: thread.id,
      message_id: messageId || null,
      draft_type: 'reply',
      prompt: instruction || null,
      subject: draft.subject,
      body: draft.body,
      status: 'draft',
      gmail_draft_id: gmailDraftId
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return {
    ...row,
    assumptions: draft.assumptions,
    missing_info: draft.missing_info,
    model_used: modelUsed
  };
}


export async function listDrafts(userId) {
  const { data, error } = await supabase
    .from('email_drafts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

