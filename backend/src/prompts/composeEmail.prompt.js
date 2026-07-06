export const COMPOSE_EMAIL_PROMPT_VERSION = 'compose-email-v1';

export function buildComposeEmailPrompt({ prompt, tone = 'professional' }) {
  return `You write clear professional emails.
Create an email draft from the user's instruction.
The user must review this before sending, so do not claim it has been sent.
Return strict JSON only:
{
  "subject": "...",
  "body": "..."
}

Tone: ${tone}
Instruction:
${prompt}`;
}

