import asyncHandler from '../utils/asyncHandler.js';
import {
  answerChatMessage,
  createChatSession,
  getChatSession,
  listChatSessions
} from '../services/rag.service.js';

export const createSession = asyncHandler(async (req, res) => {
  const session = await createChatSession(req.auth.userId, req.body?.title || 'New chat');
  res.json({ success: true, data: { session } });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = await listChatSessions(req.auth.userId);
  res.json({ success: true, data: { sessions } });
});

export const getSession = asyncHandler(async (req, res) => {
  const session = await getChatSession(req.auth.userId, req.params.id);
  res.json({ success: true, data: session });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const result = await answerChatMessage(req.auth.userId, {
    sessionId: req.body?.sessionId,
    message: req.body?.message
  });

  res.json({ success: true, data: result });
});

