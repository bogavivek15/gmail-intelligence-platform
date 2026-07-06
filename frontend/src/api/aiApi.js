import { apiRequest } from './apiClient.js';

export function summarizeMessage(id) {
  return apiRequest(`/ai/summarize-message/${id}`, { method: 'POST' });
}

export function summarizeThread(threadId) {
  return apiRequest(`/ai/summarize-thread/${threadId}`, { method: 'POST' });
}

export function categorizeMessage(id) {
  return apiRequest(`/ai/categorize/${id}`, { method: 'POST' });
}

export function categorizeBatch(limit = 10) {
  return apiRequest('/ai/categorize-batch', {
    method: 'POST',
    body: { limit }
  });
}

export function composeDraft(payload) {
  return apiRequest('/ai/compose', {
    method: 'POST',
    body: payload
  });
}

