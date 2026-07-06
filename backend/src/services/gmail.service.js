import { google } from 'googleapis';
import env from '../config/env.js';
import { createOAuthClient } from '../config/googleOAuth.js';
import { assertRequiredScopes } from '../utils/oauthScopes.js';
import { withRetry } from '../utils/retry.js';
import { getPrimaryGmailAccount, updateGmailAccountTokens } from './supabase.service.js';

const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const GMAIL_COMPOSE_SCOPE = 'https://www.googleapis.com/auth/gmail.compose';

export async function getAuthorizedGmailClient(userId, requiredScopes = []) {
  const account = await getPrimaryGmailAccount(userId);

  if (!account) {
    const error = new Error('No Gmail account connected');
    error.statusCode = 400;
    error.code = 'GMAIL_ACCOUNT_NOT_CONNECTED';
    throw error;
  }

  assertRequiredScopes(account.scope, requiredScopes, 'This Gmail action');
  const freshAccount = await ensureFreshAccessToken(account);
  assertRequiredScopes(freshAccount.scope, requiredScopes, 'This Gmail action');
  const oauthClient = createOAuthClient();
  oauthClient.setCredentials({
    access_token: freshAccount.access_token,
    refresh_token: freshAccount.refresh_token,
    expiry_date: freshAccount.token_expiry ? new Date(freshAccount.token_expiry).getTime() : null
  });

  return {
    gmail: google.gmail({ version: 'v1', auth: oauthClient }),
    account: freshAccount
  };
}

export async function listLabels(userId) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_READONLY_SCOPE]);
  const response = await withRetry(() => gmail.users.labels.list({ userId: 'me' }));
  return response.data.labels || [];
}

export async function listMessageIds(userId, { maxResults = 50, pageSize = 25 } = {}) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_READONLY_SCOPE]);
  const messages = [];
  let pageToken;

  while (messages.length < maxResults) {
    const response = await withRetry(() =>
      gmail.users.messages.list({
        userId: 'me',
        maxResults: Math.min(pageSize, maxResults - messages.length),
        pageToken
      })
    );

    messages.push(...(response.data.messages || []));
    pageToken = response.data.nextPageToken;

    if (!pageToken) {
      break;
    }
  }

  return {
    messages,
    nextPageToken: pageToken,
    resultSizeEstimate: messages.length
  };
}

export async function getFullMessage(userId, messageId) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_READONLY_SCOPE]);
  const response = await withRetry(() =>
    gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    })
  );

  return response.data;
}

export async function sendRawMessage(userId, raw, threadId) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_SEND_SCOPE]);
  const response = await withRetry(() =>
    gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        threadId
      }
    })
  );

  return response.data;
}

export async function createGmailDraft(userId, { raw, threadId }) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_COMPOSE_SCOPE]);
  const response = await withRetry(() =>
    gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw,
          threadId
        }
      }
    })
  );

  return response.data;
}

export async function updateGmailDraft(userId, draftId, { raw, threadId }) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_COMPOSE_SCOPE]);
  const response = await withRetry(() =>
    gmail.users.drafts.update({
      userId: 'me',
      id: draftId,
      requestBody: {
        message: {
          raw,
          threadId
        }
      }
    })
  );

  return response.data;
}

export async function sendGmailDraft(userId, draftId) {
  const { gmail } = await getAuthorizedGmailClient(userId, [GMAIL_COMPOSE_SCOPE]);
  const response = await withRetry(() =>
    gmail.users.drafts.send({
      userId: 'me',
      requestBody: {
        id: draftId
      }
    })
  );

  return response.data;
}


async function ensureFreshAccessToken(account) {
  const expiryMs = account.token_expiry ? new Date(account.token_expiry).getTime() : 0;

  if (account.access_token && expiryMs > Date.now() + 60_000) {
    return account;
  }

  if (!account.refresh_token) {
    const error = new Error('Gmail refresh token is missing. Reconnect Google OAuth.');
    error.statusCode = 401;
    error.code = 'GMAIL_REFRESH_TOKEN_MISSING';
    throw error;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error_description || payload.error || 'Google token refresh failed');
    error.statusCode = 401;
    error.code = 'GMAIL_TOKEN_REFRESH_FAILED';
    throw error;
  }

  return updateGmailAccountTokens(account.id, payload);
}
