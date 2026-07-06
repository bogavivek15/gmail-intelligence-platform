import asyncHandler from '../utils/asyncHandler.js';
import { categorizeBatch, categorizeMessage } from '../services/category.service.js';
import { composeDraft } from '../services/draft.service.js';
import { summarizeMessage, summarizeThread } from '../services/summary.service.js';

export const summarizeEmailMessage = asyncHandler(async (req, res) => {
  const summary = await summarizeMessage(req.auth.userId, req.params.id);
  res.json({ success: true, data: { summary } });
});

export const summarizeEmailThread = asyncHandler(async (req, res) => {
  const summary = await summarizeThread(req.auth.userId, req.params.threadId);
  res.json({ success: true, data: { summary } });
});

export const categorizeEmailMessage = asyncHandler(async (req, res) => {
  const category = await categorizeMessage(req.auth.userId, req.params.id);
  res.json({ success: true, data: { category } });
});

export const categorizeEmailBatch = asyncHandler(async (req, res) => {
  const results = await categorizeBatch(req.auth.userId, {
    limit: req.body?.limit
  });
  res.json({ success: true, data: { results } });
});

export const composeEmailDraft = asyncHandler(async (req, res) => {
  const draft = await composeDraft(req.auth.userId, req.body || {});
  res.json({ success: true, data: { draft } });
});

