import supabase from '../config/supabase.js';
import {
  CATEGORIZE_EMAIL_PROMPT_VERSION,
  buildCategorizeEmailPrompt
} from '../prompts/categorizeEmail.prompt.js';
import { validateCategory } from '../utils/validators.js';
import { getMessageById, listMessages } from './emailData.service.js';
import { generateGeminiJson } from './gemini.service.js';
import { generateNimJson } from './nim.service.js';

export async function categorizeMessage(userId, messageId) {
  const message = await getMessageById(userId, messageId);
  const prompt = buildCategorizeEmailPrompt(message);
  let result;

  try {
    result = await generateNimJson({
      userId,
      feature: 'categorize_message',
      promptVersion: CATEGORIZE_EMAIL_PROMPT_VERSION,
      prompt
    });
  } catch {
    result = await generateGeminiJson({
      userId,
      feature: 'categorize_message_fallback',
      promptVersion: CATEGORIZE_EMAIL_PROMPT_VERSION,
      prompt
    });
  }

  const category = validateCategory(result.data);
  const { data, error } = await supabase
    .from('email_categories')
    .upsert(
      {
        user_id: userId,
        message_id: message.id,
        category: category.category,
        confidence: category.confidence,
        reason: category.reason,
        model_used: result.modelUsed,
        prompt_version: CATEGORIZE_EMAIL_PROMPT_VERSION
      },
      { onConflict: 'message_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function categorizeBatch(userId, { limit = 10 } = {}) {
  const { messages } = await listMessages(userId, { limit: Math.min(limit, 25), offset: 0 });
  const results = [];

  for (const message of messages) {
    try {
      results.push({
        messageId: message.id,
        category: await categorizeMessage(userId, message.id)
      });
    } catch (error) {
      results.push({
        messageId: message.id,
        error: error.message
      });
    }
  }

  return results;
}

