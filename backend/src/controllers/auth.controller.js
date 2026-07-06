import env from '../config/env.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
  clearSessionCookie,
  createGoogleAuthUrl,
  createSessionToken,
  handleGoogleCallback,
  setSessionCookie
} from '../services/googleOAuth.service.js';
import { getUserById } from '../services/supabase.service.js';
import logger from '../utils/logger.js';


export const startGoogleAuth = asyncHandler(async (req, res) => {
  const authUrl = await createGoogleAuthUrl(req.query.redirect || '/dashboard');
  res.redirect(authUrl);
});

export const handleGoogleAuthCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    redirectOAuthFailure(res, 'GOOGLE_OAUTH_ERROR', 'Google OAuth was cancelled or failed. Start Gmail connection again.');
    return;
  }

  if (!code) {
    redirectOAuthFailure(res, 'OAUTH_CODE_MISSING', 'Google did not return an OAuth code. Start Gmail connection again.');
    return;
  }

  try {
    const { user, redirectAfterLogin } = await handleGoogleCallback({ code, state });
    const sessionToken = createSessionToken(user);
    setSessionCookie(res, sessionToken);

    const safePath = isSafeFrontendPath(redirectAfterLogin) ? redirectAfterLogin : '/dashboard';
    const redirectTarget = new URL(safePath, env.FRONTEND_URL);
    res.redirect(redirectTarget.toString());
  } catch (callbackError) {
    logger.error(`${callbackError.code || 'GOOGLE_OAUTH_CALLBACK_FAILED'}: ${callbackError.message}`);
    redirectOAuthFailure(
      res,
      callbackError.code || 'GOOGLE_OAUTH_CALLBACK_FAILED',
      getOAuthFailureMessage(callbackError)
    );
  }
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  logger.info('getCurrentUser - user from auth middleware:', JSON.stringify(req.auth.user));
  res.json({
    success: true,
    data: {
      user: req.auth.user
    }
  });
});

export const logout = asyncHandler(async (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, data: { loggedOut: true } });
});

function isSafeFrontendPath(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

function redirectOAuthFailure(res, code, message) {
  const redirectTarget = new URL('/login', env.FRONTEND_URL);
  redirectTarget.searchParams.set('oauth_error', message);
  redirectTarget.searchParams.set('oauth_code', code);
  res.redirect(redirectTarget.toString());
}

function getOAuthFailureMessage(error) {
  switch (error.code) {
    case 'OAUTH_STATE_EXPIRED':
      return 'OAuth session expired. Start Gmail connection again.';
    case 'OAUTH_STATE_INVALID':
      return 'OAuth session was already used or was not found. Start Gmail connection again.';
    case 'OAUTH_STATE_MISSING':
      return 'OAuth callback was missing its security state. Start Gmail connection again.';
    case 'GOOGLE_TOKEN_EXCHANGE_FAILED':
      return 'Google rejected the OAuth callback. Confirm the redirect URI and start Gmail connection again.';
    case 'GMAIL_SCOPES_MISSING':
      return 'Gmail permissions were not granted. Start Gmail connection again and approve Gmail read/send access.';
    default:
      return 'Google OAuth could not be completed. Start Gmail connection again.';
  }
}

export const bypassLogin = asyncHandler(async (req, res) => {
  const mockUserId = 'd0000000-0000-0000-0000-000000000001';
  const user = await getUserById(mockUserId);

  if (!user) {
    const error = new Error('Mock user not seeded yet. Run the seed script in your Supabase database first.');
    error.statusCode = 404;
    error.code = 'MOCK_USER_NOT_FOUND';
    throw error;
  }

  const sessionToken = createSessionToken(user);
  setSessionCookie(res, sessionToken);

  res.redirect(`${env.FRONTEND_URL}/dashboard`);
});

