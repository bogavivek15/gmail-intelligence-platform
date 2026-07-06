import { Router } from 'express';
import {
  getCurrentUser,
  handleGoogleAuthCallback,
  logout,
  startGoogleAuth,
  bypassLogin
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/google', startGoogleAuth);
router.get('/google/callback', handleGoogleAuthCallback);
router.get('/bypass-login', bypassLogin);
router.get('/me', requireAuth, getCurrentUser);
router.post('/logout', requireAuth, logout);


export default router;

