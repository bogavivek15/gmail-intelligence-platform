export function parseScopeString(scope = '') {
  return new Set(String(scope).split(/\s+/).filter(Boolean));
}

export function getMissingScopes(grantedScope, requiredScopes) {
  const granted = parseScopeString(grantedScope);
  return requiredScopes.filter((scope) => !granted.has(scope));
}

export function assertRequiredScopes(grantedScope, requiredScopes, feature = 'Gmail') {
  const missingScopes = getMissingScopes(grantedScope, requiredScopes);

  if (missingScopes.length === 0) {
    return;
  }

  const error = new Error(
    `${feature} requires additional Google permissions. Reconnect Gmail and approve all requested permissions. Missing scopes: ${missingScopes.join(', ')}`
  );
  error.statusCode = 403;
  error.code = 'GMAIL_SCOPES_MISSING';
  error.missingScopes = missingScopes;
  throw error;
}
