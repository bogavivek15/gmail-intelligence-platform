import supabase from '../config/supabase.js';

export function getSupabaseClient() {
  return supabase;
}

export async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

export async function upsertUserFromGoogleProfile(profile) {
  const googleEmail = profile.email?.toLowerCase();

  if (!googleEmail) {
    throw new Error('Google profile did not include an email address');
  }

  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        google_email: googleEmail,
        name: profile.name || null,
        avatar_url: profile.picture || null
      },
      { onConflict: 'google_email' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertGmailAccount({ userId, gmailEmail, tokens, scope }) {
  const existing = await getPrimaryGmailAccount(userId);
  const refreshToken = tokens.refresh_token || existing?.refresh_token || null;
  const tokenExpiry = tokens.expiry_date
    ? new Date(tokens.expiry_date).toISOString()
    : tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

  const { data, error } = await supabase
    .from('gmail_accounts')
    .upsert(
      {
        user_id: userId,
        gmail_email: gmailEmail.toLowerCase(),
        access_token: tokens.access_token || existing?.access_token || null,
        refresh_token: refreshToken,
        token_expiry: tokenExpiry || existing?.token_expiry || null,
        scope: scope || tokens.scope || existing?.scope || null
      },
      { onConflict: 'user_id,gmail_email' }
    )
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateGmailAccountTokens(accountId, tokens) {
  const patch = {
    updated_at: new Date().toISOString()
  };

  if (tokens.access_token) {
    patch.access_token = tokens.access_token;
  }
  if (tokens.refresh_token) {
    patch.refresh_token = tokens.refresh_token;
  }
  if (tokens.expires_in) {
    patch.token_expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  }
  if (tokens.expiry_date) {
    patch.token_expiry = new Date(tokens.expiry_date).toISOString();
  }
  if (tokens.scope) {
    patch.scope = tokens.scope;
  }

  const { data, error } = await supabase
    .from('gmail_accounts')
    .update(patch)
    .eq('id', accountId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPrimaryGmailAccount(userId) {
  const { data, error } = await supabase
    .from('gmail_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function insertAuditEvent(userId, eventType, metadata = {}) {
  const { error } = await supabase.from('audit_events').insert({
    user_id: userId,
    event_type: eventType,
    metadata
  });

  if (error) {
    throw error;
  }
}

export async function insertAiRun(userId, run) {
  const { error } = await supabase.from('ai_runs').insert({
    user_id: userId,
    feature: run.feature,
    model_used: run.modelUsed || null,
    prompt_version: run.promptVersion || null,
    input_tokens: run.inputTokens || null,
    output_tokens: run.outputTokens || null,
    latency_ms: run.latencyMs || null,
    status: run.status,
    error_message: run.errorMessage || null
  });

  if (error) {
    throw error;
  }
}

