export const CATEGORIES = [
  'Newsletters',
  'Job / Recruitment',
  'Finance',
  'Notifications',
  'Personal',
  'Work / Professional'
];

export function requireFields(value, fields, label = 'object') {
  for (const field of fields) {
    if (value?.[field] === undefined || value?.[field] === null) {
      throw new Error(`Invalid ${label}: missing ${field}`);
    }
  }

  return value;
}

export function validateCategory(value) {
  requireFields(value, ['category', 'confidence', 'reason'], 'category response');
  if (!CATEGORIES.includes(value.category)) {
    throw new Error(`Invalid category: ${value.category}`);
  }

  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Invalid category confidence');
  }

  return {
    category: value.category,
    confidence,
    reason: String(value.reason || '')
  };
}

export function validateDraft(value) {
  requireFields(value, ['subject', 'body'], 'draft response');
  return {
    subject: String(value.subject || '').trim(),
    body: String(value.body || '').trim(),
    assumptions: Array.isArray(value.assumptions) ? value.assumptions : [],
    missing_info: Array.isArray(value.missing_info) ? value.missing_info : []
  };
}

export function validateChatAnswer(value) {
  requireFields(value, ['answer', 'sources', 'not_found'], 'chat response');
  return {
    answer: String(value.answer || '').trim(),
    sources: Array.isArray(value.sources) ? value.sources : [],
    not_found: Boolean(value.not_found)
  };
}

export function validateSummary(value) {
  requireFields(value, ['summary'], 'summary response');
  return value;
}

