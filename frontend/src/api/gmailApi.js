import { apiRequest } from './apiClient.js';

export function getSyncStatus() {
  return apiRequest('/gmail/sync-status');
}

export function syncGmail(maxResults = 50) {
  return apiRequest('/gmail/sync', {
    method: 'POST',
    body: { maxResults }
  });
}

export function getMessages(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  }
  return apiRequest(`/gmail/messages?${query.toString()}`);
}

export function getMessage(id) {
  return apiRequest(`/gmail/messages/${id}`);
}

export function getThread(threadId) {
  return apiRequest(`/gmail/threads/${threadId}`);
}

export function getLabels() {
  return apiRequest('/gmail/labels');
}

export function createReplyDraft(payload) {
  return apiRequest('/gmail/reply-draft', {
    method: 'POST',
    body: payload
  });
}

export function sendReplyDraft(payload) {
  return apiRequest('/gmail/send-reply', {
    method: 'POST',
    body: payload
  });
}

export function sendComposedDraft(payload) {
  return apiRequest('/gmail/send-composed', {
    method: 'POST',
    body: payload
  });
}

