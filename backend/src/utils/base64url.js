export function decodeBase64Url(value = '') {
  if (!value) {
    return '';
  }

  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function encodeBase64Url(value = '') {
  return Buffer.from(value, 'utf8').toString('base64url');
}

