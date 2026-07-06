export function parseJsonWithRepair(value) {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    const extracted = extractJson(value);
    if (!extracted) {
      throw new Error('AI response did not contain JSON');
    }
    return JSON.parse(extracted);
  }
}

function extractJson(value) {
  const withoutFence = value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const objectStart = withoutFence.indexOf('{');
  const objectEnd = withoutFence.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    return withoutFence.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = withoutFence.indexOf('[');
  const arrayEnd = withoutFence.lastIndexOf(']');
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return withoutFence.slice(arrayStart, arrayEnd + 1);
  }

  return null;
}

