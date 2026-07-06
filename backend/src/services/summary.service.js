import supabase from '../config/supabase.js';
import {
  SUMMARIZE_EMAIL_PROMPT_VERSION,
  buildSummarizeEmailPrompt
} from '../prompts/summarizeEmail.prompt.js';
import {
  SUMMARIZE_THREAD_PROMPT_VERSION,
  buildSummarizeThreadPrompt
} from '../prompts/summarizeThread.prompt.js';
import { validateSummary } from '../utils/validators.js';
import { generateGeminiJson } from './gemini.service.js';
import { getMessageById, getThreadById, getThreadMessages } from './emailData.service.js';

export async function summarizeMessage(userId, messageId) {
  const message = await getMessageById(userId, messageId);
  const { data, modelUsed } = await generateGeminiJson({
    userId,
    feature: 'summarize_message',
    promptVersion: SUMMARIZE_EMAIL_PROMPT_VERSION,
    prompt: buildSummarizeEmailPrompt(message)
  });

  const summary = validateSummary(data);
  const { data: row, error } = await supabase
    .from('email_summaries')
    .insert({
      user_id: userId,
      message_id: message.id,
      summary_type: 'message',
      summary: summary.summary,
      action_items: summary.required_action ? [summary.required_action] : [],
      model_used: modelUsed,
      prompt_version: SUMMARIZE_EMAIL_PROMPT_VERSION
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return { ...summary, record: row };
}

export async function summarizeThread(userId, threadId) {
  const thread = await getThreadById(userId, threadId);
  const messages = await getThreadMessages(userId, thread.id);
  const { data, modelUsed } = await generateGeminiJson({
    userId,
    feature: 'summarize_thread',
    promptVersion: SUMMARIZE_THREAD_PROMPT_VERSION,
    prompt: buildSummarizeThreadPrompt(thread, messages)
  });

  const summary = validateSummary({ summary: data.thread_summary || data.summary, ...data });
  const { data: row, error } = await supabase
    .from('email_summaries')
    .insert({
      user_id: userId,
      thread_id: thread.id,
      summary_type: 'thread',
      summary: summary.thread_summary || summary.summary,
      action_items: summary.next_steps || [],
      model_used: modelUsed,
      prompt_version: SUMMARIZE_THREAD_PROMPT_VERSION
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await supabase
    .from('email_threads')
    .update({ thread_summary: summary.thread_summary || summary.summary })
    .eq('user_id', userId)
    .eq('id', thread.id);

  return { ...summary, record: row };
}

