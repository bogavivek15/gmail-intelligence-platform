import { Router } from 'express';
import {
  createGmailReplyDraft,
  getGmailLabels,
  getGmailMessage,
  getGmailMessages,
  getGmailSyncStatus,
  getGmailThread,
  sendGmailReply,
  sendGmailComposedDraft,
  syncGmail
} from '../controllers/gmail.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/sync', syncGmail);
router.get('/sync-status', getGmailSyncStatus);
router.get('/messages', getGmailMessages);
router.get('/messages/:id', getGmailMessage);
router.get('/threads/:threadId', getGmailThread);
router.get('/labels', getGmailLabels);
router.post('/reply-draft', createGmailReplyDraft);
router.post('/send-reply', sendGmailReply);
router.post('/send-composed', sendGmailComposedDraft);

export default router;
