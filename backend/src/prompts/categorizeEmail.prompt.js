import { CATEGORIES } from '../utils/validators.js';

export const CATEGORIZE_EMAIL_PROMPT_VERSION = 'categorize-email-v1';

export function buildCategorizeEmailPrompt(message) {
  return `Classify this email into exactly one allowed category.
Allowed categories: ${CATEGORIES.join(', ')}

Return strict JSON only:
{
  "category": "Finance",
  "confidence": 0.92,
  "reason": "..."
}

Email:
Sender: ${message.sender_name || ''} <${message.sender_email || ''}>
Subject: ${message.subject || ''}
Snippet: ${message.snippet || ''}
Body:
${(message.body_text || '').slice(0, 5000)}`;
}

