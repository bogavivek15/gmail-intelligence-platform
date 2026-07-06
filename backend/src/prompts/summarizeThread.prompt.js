export const SUMMARIZE_THREAD_PROMPT_VERSION = 'summarize-thread-v1';

export function buildSummarizeThreadPrompt(thread, messages) {
  const timeline = messages
    .map((message, index) => {
      return `Message ${index + 1}
From: ${message.sender_name || ''} <${message.sender_email || ''}>
Date: ${message.internal_date || ''}
Subject: ${message.subject || ''}
Body:
${message.body_text || message.snippet || ''}`;
    })
    .join('\n\n---\n\n');

  return `You are an email intelligence assistant.
Summarize this email thread chronologically using only the provided messages.
Return strict JSON only with this shape:
{
  "thread_summary": "...",
  "conversation_arc": "...",
  "current_status": "...",
  "open_questions": [],
  "next_steps": [],
  "important_dates": [],
  "participants": []
}

Thread subject: ${thread.subject || ''}

Messages:
${timeline}`;
}

