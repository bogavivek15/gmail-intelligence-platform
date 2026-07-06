export const CHAT_AGENT_PROMPT_VERSION = 'chat-agent-v1';

export function buildChatAgentPrompt({ question, context, history = [] }) {
  const sourceContext = context
    .map((item, index) => {
      const meta = item.metadata || {};
      return `Source ${index + 1}
Sender: ${meta.sender || ''}
Sender Email: ${meta.sender_email || ''}
Subject: ${meta.subject || ''}
Date: ${meta.date || ''}
Gmail Message ID: ${meta.gmail_message_id || ''}
Gmail Thread ID: ${meta.gmail_thread_id || ''}
Similarity: ${item.similarity}
Text:
${item.chunk_text}`;
    })
    .join('\n\n---\n\n');

  const recentHistory = history
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');

  return `You are an email intelligence assistant.
You must answer only using the provided retrieved email context.
If the answer is not present in the context, say exactly:
"I could not find this information in the synced emails."
Do not guess.
Do not use outside knowledge.
Always include sources.

Return strict JSON only:
{
  "answer": "...",
  "sources": [
    {
      "sender": "...",
      "sender_email": "...",
      "subject": "...",
      "date": "...",
      "gmail_message_id": "...",
      "gmail_thread_id": "...",
      "reason_used": "..."
    }
  ],
  "not_found": false
}

Recent conversation for wording continuity only:
${recentHistory || '(none)'}

Question:
${question}

Retrieved email context:
${sourceContext || '(none)'}`;
}

