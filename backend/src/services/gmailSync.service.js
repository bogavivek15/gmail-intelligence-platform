import supabase from '../config/supabase.js';
import { parseGmailMessage } from '../utils/gmailParser.js';
import { generateMessageEmbeddings } from './embedding.service.js';
import { getFullMessage, listLabels, listMessageIds } from './gmail.service.js';
import { getPrimaryGmailAccount } from './supabase.service.js';

export async function syncLatestMessages(userId, options = {}) {
  const maxResults = Math.min(Number(options.maxResults) || 50, 100);
  const account = await getPrimaryGmailAccount(userId);

  if (!account) {
    const error = new Error('No Gmail account connected');
    error.statusCode = 400;
    error.code = 'GMAIL_ACCOUNT_NOT_CONNECTED';
    throw error;
  }

  const job = await createSyncJob(userId, account.id, maxResults);

  // Trigger sync in background to avoid HTTP timeouts
  setImmediate(() => {
    runSyncOrchestration(userId, job.id, account.id, maxResults)
      .catch((error) => {
        console.error(`Background sync orchestration error for job ${job.id}:`, error);
      });
  });

  return job;
}

export async function runSyncOrchestration(userId, jobId, accountId, maxResults) {
  try {
    await updateSyncJob(jobId, { status: 'running', started_at: new Date().toISOString() });
    const labels = await syncLabels(userId);
    const labelByGmailId = new Map(labels.map((label) => [label.gmail_label_id, label]));
    const { messages } = await listMessageIds(userId, { maxResults });

    await updateSyncJob(jobId, { total_items: messages.length });

    let processed = 0;
    let failed = 0;
    let lastHistoryId = null;

    for (const item of messages) {
      try {
        const fullMessage = await getFullMessage(userId, item.id);
        const parsed = parseGmailMessage(fullMessage);
        lastHistoryId = parsed.historyId || lastHistoryId;
        const storedMessage = await upsertParsedMessage(userId, parsed);
        await linkMessageLabels(userId, storedMessage.id, parsed.labelIds, labelByGmailId);
        await generateMessageEmbeddings(userId, storedMessage);
        processed += 1;
      } catch (error) {
        failed += 1;
        await appendSyncFailure(jobId, item.id, error.message);
      }

      await updateSyncJob(jobId, {
        processed_items: processed,
        failed_items: failed
      });
    }

    await upsertSyncState(userId, accountId, {
      last_history_id: lastHistoryId,
      last_sync_at: new Date().toISOString(),
      sync_status: failed > 0 ? 'partial' : 'success',
      error_message: failed > 0 ? `${failed} message(s) failed during sync` : null
    });

    await updateSyncJob(jobId, {
      status: failed > 0 ? 'partial' : 'success',
      finished_at: new Date().toISOString(),
      processed_items: processed,
      failed_items: failed
    });
  } catch (error) {
    await upsertSyncState(userId, accountId, {
      sync_status: 'failed',
      error_message: error.message
    });
    await updateSyncJob(jobId, {
      status: 'failed',
      finished_at: new Date().toISOString(),
      error_message: error.message
    });
    throw error;
  }
}


export async function getSyncStatus(userId) {
  const { data: state, error: stateError } = await supabase
    .from('sync_state')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stateError) {
    throw stateError;
  }

  const [messages, threads, categories, summaries] = await Promise.all([
    countRows('email_messages', userId),
    countRows('email_threads', userId),
    countRows('email_categories', userId),
    countRows('email_summaries', userId)
  ]);

  return {
    state,
    counts: {
      messages,
      threads,
      categories,
      summaries
    }
  };
}

export async function syncLabels(userId) {
  const gmailLabels = await listLabels(userId);

  if (gmailLabels.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('email_labels')
    .upsert(
      gmailLabels.map((label) => ({
        user_id: userId,
        gmail_label_id: label.id,
        name: label.name,
        type: label.type || null
      })),
      { onConflict: 'user_id,gmail_label_id' }
    )
    .select('*');

  if (error) {
    throw error;
  }

  return data;
}

async function createSyncJob(userId, gmailAccountId, maxResults) {
  const { data, error } = await supabase
    .from('sync_jobs')
    .insert({
      user_id: userId,
      gmail_account_id: gmailAccountId,
      job_type: 'latest_messages',
      status: 'queued',
      metadata: { maxResults }
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function updateSyncJob(jobId, patch) {
  const { data, error } = await supabase
    .from('sync_jobs')
    .update(patch)
    .eq('id', jobId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function appendSyncFailure(jobId, gmailMessageId, message) {
  const { data: job } = await supabase.from('sync_jobs').select('metadata').eq('id', jobId).single();
  const failures = job?.metadata?.failures || [];
  failures.push({ gmailMessageId, message });
  await supabase
    .from('sync_jobs')
    .update({ metadata: { ...(job?.metadata || {}), failures: failures.slice(-25) } })
    .eq('id', jobId);
}

async function upsertSyncState(userId, gmailAccountId, patch) {
  const { error } = await supabase.from('sync_state').upsert(
    {
      user_id: userId,
      gmail_account_id: gmailAccountId,
      ...patch
    },
    { onConflict: 'user_id,gmail_account_id' }
  );

  if (error) {
    throw error;
  }
}

async function upsertParsedMessage(userId, parsed) {
  const thread = await upsertThread(userId, parsed);

  const { data, error } = await supabase
    .from('email_messages')
    .upsert(
      {
        user_id: userId,
        thread_id: thread.id,
        gmail_message_id: parsed.gmailMessageId,
        gmail_thread_id: parsed.gmailThreadId,
        message_id_header: parsed.messageIdHeader,
        in_reply_to_header: parsed.inReplyToHeader,
        references_header: parsed.referencesHeader,
        sender_email: parsed.senderEmail,
        sender_name: parsed.senderName,
        to_emails: parsed.toEmails,
        cc_emails: parsed.ccEmails,
        bcc_emails: parsed.bccEmails,
        subject: parsed.subject,
        snippet: parsed.snippet,
        body_text: parsed.bodyText,
        body_html: parsed.bodyHtml,
        internal_date: parsed.internalDate,
        history_id: parsed.historyId,
        raw_headers: parsed.rawHeaders,
        size_estimate: parsed.sizeEstimate,
        has_attachments: parsed.hasAttachments,
        body_hash: parsed.bodyHash
      },
      { onConflict: 'user_id,gmail_message_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  await refreshThreadStats(userId, thread.id, parsed.gmailThreadId);
  return data;
}

async function upsertThread(userId, parsed) {
  const participants = [
    { name: parsed.senderName, email: parsed.senderEmail },
    ...parsed.toEmails,
    ...parsed.ccEmails
  ].filter((item) => item.email || item.name);

  const { data, error } = await supabase
    .from('email_threads')
    .upsert(
      {
        user_id: userId,
        gmail_thread_id: parsed.gmailThreadId,
        subject: parsed.subject,
        participants,
        latest_message_at: parsed.internalDate,
        message_count: 1
      },
      { onConflict: 'user_id,gmail_thread_id' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function refreshThreadStats(userId, threadId, gmailThreadId) {
  const { count } = await supabase
    .from('email_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('gmail_thread_id', gmailThreadId);

  const { data: latest } = await supabase
    .from('email_messages')
    .select('internal_date')
    .eq('user_id', userId)
    .eq('gmail_thread_id', gmailThreadId)
    .order('internal_date', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  await supabase
    .from('email_threads')
    .update({
      message_count: count || 0,
      latest_message_at: latest?.internal_date || null
    })
    .eq('id', threadId);
}

async function linkMessageLabels(userId, messageId, labelIds, labelByGmailId) {
  const rows = labelIds
    .map((gmailLabelId) => labelByGmailId.get(gmailLabelId))
    .filter(Boolean)
    .map((label) => ({
      user_id: userId,
      message_id: messageId,
      label_id: label.id
    }));

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('email_message_labels')
    .upsert(rows, { onConflict: 'message_id,label_id' });

  if (error) {
    throw error;
  }
}

async function countRows(table, userId) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return count || 0;
}
