import { apiRequest } from './apiClient.js';

export function createChatSession(title) {
  return apiRequest('/chat/session', {
    method: 'POST',
    body: { title }
  });
}

export function getChatSessions() {
  return apiRequest('/chat/sessions');
}

export function getChatSession(id) {
  return apiRequest(`/chat/sessions/${id}`);
}

export function sendChatMessage(payload) {
  return apiRequest('/chat/message', {
    method: 'POST',
    body: payload
  });
}

