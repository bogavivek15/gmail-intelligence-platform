export const SUMMARIZE_EMAIL_PROMPT_VERSION = 'summarize-email-v1';

export function buildSummarizeEmailPrompt(message) {
  return `You are an email intelligence assistant.
Summarize the email using only the provided email content.
Return strict JSON only with this shape:
{
  "summary": "...",
  "sender_intent": "...",
  "required_action": "...",
  "urgency": "low | medium | high",
  "important_dates": [],
  "people_or_companies": []
}

Email:
Sender: ${message.sender_name || ''} <${message.sender_email || ''}>
Subject: ${message.subject || ''}
Date: ${message.internal_date || ''}
Snippet: ${message.snippet || ''}
Body:
${message.body_text || message.body_html || ''}`;
}

