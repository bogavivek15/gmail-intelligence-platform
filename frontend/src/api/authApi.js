import { apiRequest, getBackendUrl } from './apiClient.js';

export function startGoogleLogin() {
  window.location.href = getBackendUrl('/auth/google');
}

export function getCurrentUser() {
  return apiRequest('/auth/me');
}

export function logout() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

