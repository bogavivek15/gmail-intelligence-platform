export function chunkText(text, options = {}) {
  const maxChars = options.maxChars || 2200;
  const overlapChars = options.overlapChars || 180;
  const normalized = String(text || '').replace(/\r\n/g, '\n').trim();

  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const hardEnd = Math.min(start + maxChars, normalized.length);
    let end = hardEnd;

    if (hardEnd < normalized.length) {
      const breakAt = normalized.lastIndexOf('\n', hardEnd);
      if (breakAt > start + maxChars * 0.55) {
        end = breakAt;
      }
    }

    chunks.push(normalized.slice(start, end).trim());
    if (end >= normalized.length) {
      break;
    }
    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks.filter(Boolean);
}
