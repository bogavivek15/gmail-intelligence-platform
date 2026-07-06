import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { getUserById } from '../services/supabase.service.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.signedCookies?.session || req.cookies?.session;

    if (!token) {
      const error = new Error('Authentication required');
      error.statusCode = 401;
      error.code = 'AUTH_REQUIRED';
      throw error;
    }

    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'gmail-intelligence-platform',
      audience: 'gmail-intelligence-platform'
    });

    const user = await getUserById(payload.userId);

    if (!user) {
      const error = new Error('Authenticated user no longer exists');
      error.statusCode = 401;
      error.code = 'AUTH_USER_NOT_FOUND';
      throw error;
    }

    req.auth = {
      user,
      userId: user.id
    };

    next();
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401;
      error.code = 'INVALID_SESSION';
      error.message = 'Invalid or expired session';
    }
    next(error);
  }
}

