import { Router } from 'express';
import { createSession, getSession, listSessions, sendMessage } from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/session', createSession);
router.get('/sessions', listSessions);
router.get('/sessions/:id', getSession);
router.post('/message', sendMessage);

export default router;

