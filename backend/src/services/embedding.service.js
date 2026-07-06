import supabase from '../config/supabase.js';
import env from '../config/env.js';
import { chunkText } from '../utils/chunkText.js';
import { sha256 } from '../utils/crypto.js';
import { embedText } from './gemini.service.js';

export async function generateMessageEmbeddings(userId, message) {
  const input = buildEmbeddingInput(message);
  const chunks = chunkText(input);
  const inserted = [];

  for (const [index, chunk] of chunks.entries()) {
    const chunkHash = sha256(`${message.id}:${message.body_hash || ''}:${index}:${chunk}`);
    const { data: existing, error: existingError } = await supabase
      .from('email_embeddings')
      .select('id')
      .eq('user_id', userId)
      .eq('chunk_hash', chunkHash)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }
    if (existing) {
      continue;
    }

    const embedding = await embedText(chunk, 'RETRIEVAL_DOCUMENT');
    const metadata = {
      sender: message.sender_name,
      sender_email: message.sender_email,
      subject: message.subject,
      date: message.internal_date,
      gmail_message_id: message.gmail_message_id,
      gmail_thread_id: message.gmail_thread_id
    };

    const { data, error } = await supabase
      .from('email_embeddings')
      .insert({
        user_id: userId,
        message_id: message.id,
        thread_id: null,
        chunk_text: chunk,
        chunk_hash: chunkHash,
        chunk_index: index,
        source_type: 'message',
        embedding,
        metadata,
        embedding_model: env.GEMINI_EMBEDDING_MODEL
      })
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    inserted.push(data);
  }

  return inserted;
}

export async function embedQuery(question) {
  return embedText(question, 'RETRIEVAL_QUERY');
}

function buildEmbeddingInput(message) {
  return [
    `Subject: ${message.subject || '(No subject)'}`,
    `Sender: ${message.sender_name || ''} <${message.sender_email || ''}>`,
    `Date: ${message.internal_date || ''}`,
    `Snippet: ${message.snippet || ''}`,
    '',
    message.body_text || message.body_html || ''
  ].join('\n');
}

