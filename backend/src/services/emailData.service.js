import supabase from '../config/supabase.js';

export async function getMessageById(userId, messageId) {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*, email_categories(*)')
    .eq('user_id', userId)
    .eq('id', messageId)
    .single();

  if (error) {
    throw notFoundOr(error, 'Email message not found');
  }

  return data;
}

export async function getThreadById(userId, threadId) {
  const { data, error } = await supabase
    .from('email_threads')
    .select('*')
    .eq('user_id', userId)
    .eq('id', threadId)
    .single();

  if (error) {
    throw notFoundOr(error, 'Email thread not found');
  }

  return data;
}

export async function getThreadMessages(userId, threadId) {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('thread_id', threadId)
    .order('internal_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function listMessages(userId, { limit = 25, offset = 0, category, search } = {}) {
  const selectClause = category
    ? '*, email_categories!inner(category, confidence, reason)'
    : '*, email_categories(category, confidence, reason)';

  let query = supabase
    .from('email_messages')
    .select(selectClause, { count: 'exact' })
    .eq('user_id', userId)
    .order('internal_date', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`subject.ilike.%${search}%,sender_email.ilike.%${search}%,snippet.ilike.%${search}%`);
  }

  if (category) {
    query = query.eq('email_categories.category', category);
  }

  const { data, count, error } = await query;

  if (error) {
    throw error;
  }

  return { messages: data, count };
}

export async function listThreads(userId, { limit = 25, offset = 0 } = {}) {
  const { data, count, error } = await supabase
    .from('email_threads')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('latest_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return { threads: data, count };
}

function notFoundOr(error, message) {
  if (error.code === 'PGRST116') {
    const notFound = new Error(message);
    notFound.statusCode = 404;
    notFound.code = 'NOT_FOUND';
    return notFound;
  }

  return error;
}
