import asyncHandler from '../utils/asyncHandler.js';
import { listMessages, getMessageById, getThreadById, getThreadMessages } from '../services/emailData.service.js';
import { createReplyDraft } from '../services/draft.service.js';
import { sendReplyDraft, sendComposedDraft } from '../services/gmailSend.service.js';
import { syncLabels, syncLatestMessages, getSyncStatus } from '../services/gmailSync.service.js';

export const syncGmail = asyncHandler(async (req, res) => {
  const job = await syncLatestMessages(req.auth.userId, {
    maxResults: req.body?.maxResults
  });

  res.json({ success: true, data: { job } });
});

export const getGmailSyncStatus = asyncHandler(async (req, res) => {
  const status = await getSyncStatus(req.auth.userId);
  res.json({ success: true, data: status });
});

export const getGmailMessages = asyncHandler(async (req, res) => {
  const result = await listMessages(req.auth.userId, {
    limit: Number(req.query.limit) || 25,
    offset: Number(req.query.offset) || 0,
    category: req.query.category,
    search: req.query.search
  });

  res.json({ success: true, data: result });
});

export const getGmailMessage = asyncHandler(async (req, res) => {
  const message = await getMessageById(req.auth.userId, req.params.id);
  res.json({ success: true, data: { message } });
});

export const getGmailThread = asyncHandler(async (req, res) => {
  const thread = await getThreadById(req.auth.userId, req.params.threadId);
  const messages = await getThreadMessages(req.auth.userId, thread.id);
  res.json({ success: true, data: { thread, messages } });
});

export const getGmailLabels = asyncHandler(async (req, res) => {
  const labels = await syncLabels(req.auth.userId);
  res.json({ success: true, data: { labels } });
});

export const createGmailReplyDraft = asyncHandler(async (req, res) => {
  const draft = await createReplyDraft(req.auth.userId, req.body || {});
  res.json({ success: true, data: { draft } });
});

export const sendGmailReply = asyncHandler(async (req, res) => {
  const result = await sendReplyDraft(req.auth.userId, req.body?.draftId, {
    subject: req.body?.subject,
    body: req.body?.body
  });
  res.json({ success: true, data: result });
});

export const sendGmailComposedDraft = asyncHandler(async (req, res) => {
  const result = await sendComposedDraft(req.auth.userId, req.body?.draftId, {
    to_email: req.body?.to_email,
    subject: req.body?.subject,
    body: req.body?.body
  });
  res.json({ success: true, data: result });
});

