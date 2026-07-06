export const REPLY_THREAD_PROMPT_VERSION = 'reply-thread-v1';

export function buildReplyThreadPrompt({ thread, messages, instruction }) {
  const context = messages
    .map((message, index) => {
      return `Message ${index + 1}
From: ${message.sender_name || ''} <${message.sender_email || ''}>
Date: ${message.internal_date || ''}
Subject: ${message.subject || ''}
Body:
${message.body_text || message.snippet || ''}`;
    })
    .join('\n\n---\n\n');

  return `You draft a reply using only the provided thread context.
Do not invent facts. If information is missing, include it in missing_info.
The draft will be reviewed by the user before sending.
Return strict JSON only:
{
  "subject": "...",
  "body": "...",
  "assumptions": [],
  "missing_info": []
}

Thread subject: ${thread.subject || ''}
User instruction: ${instruction || 'Draft a helpful reply.'}

Thread context:
${context}`;
}

