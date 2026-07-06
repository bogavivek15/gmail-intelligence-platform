import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { createOAuthClient, GMAIL_SCOPES, REQUIRED_GMAIL_SCOPES } from '../config/googleOAuth.js';
import supabase from '../config/supabase.js';
import { createPkcePair, randomToken } from '../utils/crypto.js';
import { assertRequiredScopes } from '../utils/oauthScopes.js';
import {
  insertAuditEvent,
  upsertGmailAccount,
  upsertUserFromGoogleProfile
} from './supabase.service.js';

const SESSION_COOKIE_NAME = 'session';
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function createGoogleAuthUrl(redirectAfterLogin = '/dashboard') {
  const oauthClient = createOAuthClient();
  const state = randomToken(32);
  const { codeVerifier, codeChallenge } = createPkcePair();
  const safeRedirect = isSafeFrontendPath(redirectAfterLogin) ? redirectAfterLogin : '/dashboard';

  await pruneExpiredOAuthStates();

  const { error } = await supabase.from('oauth_states').insert({
    state,
    code_verifier: codeVerifier,
    redirect_after_login: safeRedirect,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  });

  if (error) {
    throw error;
  }

  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent select_account',
    include_granted_scopes: true,
    scope: GMAIL_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return url;
}

function isSafeFrontendPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export async function handleGoogleCallback({ code, state }) {
  const oauthState = await consumeOAuthState(state);
  const tokens = await exchangeCodeForTokens(code, oauthState.code_verifier);
  assertRequiredScopes(tokens.scope, REQUIRED_GMAIL_SCOPES, 'Gmail sync and send');
  const profile = await fetchGoogleProfile(tokens.access_token);
  const user = await upsertUserFromGoogleProfile(profile);

  await upsertGmailAccount({
    userId: user.id,
    gmailEmail: profile.email,
    tokens,
    scope: tokens.scope
  });

  await insertAuditEvent(user.id, 'google_oauth_connected', {
    gmail_email: profile.email,
    scope: tokens.scope || null
  });

  return {
    user,
    redirectAfterLogin: oauthState.redirect_after_login || '/dashboard'
  };
}

export function createSessionToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.google_email
    },
    env.JWT_SECRET,
    {
      expiresIn: `${SESSION_MAX_AGE_MS / 1000}s`,
      issuer: 'gmail-intelligence-platform',
      audience: 'gmail-intelligence-platform'
    }
  );
}

export function setSessionCookie(res, token) {
  const isProd = env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    signed: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/'
  });
}

export function clearSessionCookie(res) {
  const isProd = env.NODE_ENV === 'production';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    signed: true,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
    path: '/'
  });
}

async function consumeOAuthState(state) {
  if (!state) {
    const error = new Error('Missing OAuth state');
    error.statusCode = 400;
    error.code = 'OAUTH_STATE_MISSING';
    throw error;
  }

  const { data, error } = await supabase
    .from('oauth_states')
    .delete()
    .eq('state', state)
    .select('*')
    .maybeSingle();

  if (error) {
    const lookupError = new Error('Unable to validate OAuth state');
    lookupError.statusCode = 500;
    lookupError.code = 'OAUTH_STATE_LOOKUP_FAILED';
    lookupError.cause = error;
    throw lookupError;
  }

  if (!data) {
    const invalid = new Error('Invalid OAuth state');
    invalid.statusCode = 400;
    invalid.code = 'OAUTH_STATE_INVALID';
    throw invalid;
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    const expired = new Error('Expired OAuth state');
    expired.statusCode = 400;
    expired.code = 'OAUTH_STATE_EXPIRED';
    throw expired;
  }

  return data;
}

async function pruneExpiredOAuthStates() {
  const { error } = await supabase
    .from('oauth_states')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    const pruneError = new Error('Unable to clean expired OAuth states');
    pruneError.statusCode = 500;
    pruneError.code = 'OAUTH_STATE_PRUNE_FAILED';
    pruneError.cause = error;
    throw pruneError;
  }
}

async function exchangeCodeForTokens(code, codeVerifier) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error_description || payload.error || 'Google token exchange failed');
    error.statusCode = 502;
    error.code = 'GOOGLE_TOKEN_EXCHANGE_FAILED';
    throw error;
  }

  return payload;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();

  if (!response.ok) {
    const error = new Error(payload.error_description || payload.error || 'Google profile fetch failed');
    error.statusCode = 502;
    error.code = 'GOOGLE_PROFILE_FAILED';
    throw error;
  }

  return payload;
}
