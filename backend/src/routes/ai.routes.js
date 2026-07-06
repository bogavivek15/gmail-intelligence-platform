import { Router } from 'express';
import {
  categorizeEmailBatch,
  categorizeEmailMessage,
  composeEmailDraft,
  summarizeEmailMessage,
  summarizeEmailThread
} from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.post('/summarize-message/:id', summarizeEmailMessage);
router.post('/summarize-thread/:threadId', summarizeEmailThread);
router.post('/categorize/:id', categorizeEmailMessage);
router.post('/categorize-batch', categorizeEmailBatch);
router.post('/compose', composeEmailDraft);

export default router;

