import supabase from '../config/supabase.js';
import { buildChatAgentPrompt, CHAT_AGENT_PROMPT_VERSION } from '../prompts/chatAgent.prompt.js';
import { validateChatAnswer } from '../utils/validators.js';
import { embedQuery } from './embedding.service.js';
import { generateGeminiJson } from './gemini.service.js';

const NOT_FOUND = 'I could not find this information in the synced emails.';

export async function createChatSession(userId, title = 'New chat') {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId, title })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listChatSessions(userId) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getChatSession(userId, sessionId) {
  const { data: session, error: sessionError } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('id', sessionId)
    .single();

  if (sessionError) {
    throw sessionError;
  }

  const { data: messages, error: messagesError } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  return { session, messages };
}

export async function answerChatMessage(userId, { sessionId, message }) {
  if (!message?.trim()) {
    const error = new Error('Message is required');
    error.statusCode = 400;
    error.code = 'MESSAGE_REQUIRED';
    throw error;
  }

  const session = sessionId ? (await getChatSession(userId, sessionId)).session : await createChatSession(userId);
  const history = (await getChatSession(userId, session.id)).messages;
  await insertChatMessage(userId, session.id, 'user', message);

  const queryEmbedding = await embedQuery(message);
  const { data: matches, error: matchError } = await supabase.rpc('match_email_embeddings', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_count: 6
  });

  if (matchError) {
    throw matchError;
  }

  const context = (matches || []).filter((match) => Number(match.similarity) > 0.1);

  if (context.length === 0) {
    const assistant = await insertChatMessage(userId, session.id, 'assistant', NOT_FOUND, [], []);
    return {
      session,
      message: assistant,
      answer: NOT_FOUND,
      sources: [],
      not_found: true
    };
  }

  const { data } = await generateGeminiJson({
    userId,
    feature: 'rag_chat',
    promptVersion: CHAT_AGENT_PROMPT_VERSION,
    prompt: buildChatAgentPrompt({ question: message, context, history })
  });

  const answer = validateChatAnswer(data);
  const finalAnswer = answer.not_found ? NOT_FOUND : answer.answer;
  const assistant = await insertChatMessage(
    userId,
    session.id,
    'assistant',
    finalAnswer,
    answer.sources,
    context
  );

  return {
    session,
    message: assistant,
    answer: finalAnswer,
    sources: answer.sources,
    not_found: answer.not_found
  };
}

async function insertChatMessage(userId, sessionId, role, content, sources = [], retrievedContext = []) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: userId,
      session_id: sessionId,
      role,
      content,
      sources,
      retrieved_context: retrievedContext
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId);
  return data;
}

