export function getHeader(headers = [], name) {
  const found = headers.find((header) => header.name?.toLowerCase() === name.toLowerCase());
  return found?.value || null;
}

export function decodeMimeWords(value = '') {
  return value.replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g, (_match, charset, encoding, text) => {
    try {
      const normalizedCharset = charset.toLowerCase();
      if (!['utf-8', 'utf8', 'iso-8859-1', 'windows-1252'].includes(normalizedCharset)) {
        return text;
      }

      if (encoding.toLowerCase() === 'b') {
        return Buffer.from(text, 'base64').toString('utf8');
      }

      const quoted = text.replace(/_/g, ' ').replace(/=([a-fA-F0-9]{2})/g, (_hex, code) => {
        return String.fromCharCode(Number.parseInt(code, 16));
      });
      return Buffer.from(quoted, 'binary').toString('utf8');
    } catch {
      return text;
    }
  });
}

export function parseAddress(value = '') {
  const decoded = decodeMimeWords(value).trim();
  const match = decoded.match(/^(.*)<([^>]+)>$/);

  if (match) {
    return {
      name: cleanName(match[1]),
      email: match[2].trim().toLowerCase()
    };
  }

  if (decoded.includes('@')) {
    return {
      name: null,
      email: decoded.replace(/^mailto:/i, '').trim().toLowerCase()
    };
  }

  return { name: decoded || null, email: null };
}

export function parseAddressList(value = '') {
  if (!value) {
    return [];
  }

  return splitAddressList(value).map(parseAddress).filter((item) => item.name || item.email);
}

function splitAddressList(value) {
  const parts = [];
  let current = '';
  let quoted = false;
  let angleDepth = 0;

  for (const char of value) {
    if (char === '"') {
      quoted = !quoted;
    }
    if (!quoted && char === '<') {
      angleDepth += 1;
    }
    if (!quoted && char === '>') {
      angleDepth = Math.max(0, angleDepth - 1);
    }
    if (!quoted && angleDepth === 0 && char === ',') {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

function cleanName(value = '') {
  const trimmed = value.trim().replace(/^"|"$/g, '').trim();
  return trimmed || null;
}

