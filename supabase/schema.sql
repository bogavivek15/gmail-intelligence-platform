-- AI-Powered Gmail Intelligence Platform
-- Phase 2 Supabase schema.
--
-- MVP embedding decision:
-- - GEMINI_EMBEDDING_MODEL=gemini-embedding-001
-- - GEMINI_EMBEDDING_DIMENSION=768
-- - email_embeddings.embedding vector(768)

create extension if not exists pgcrypto;
create extension if not exists vector;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  google_email text not null,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint users_google_email_unique unique (google_email),
  constraint users_google_email_not_blank check (length(trim(google_email)) > 0)
);

create table if not exists public.gmail_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_email text not null,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint gmail_accounts_user_email_unique unique (user_id, gmail_email),
  constraint gmail_accounts_id_user_unique unique (id, user_id),
  constraint gmail_accounts_email_not_blank check (length(trim(gmail_email)) > 0)
);

create table if not exists public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  code_verifier text,
  redirect_after_login text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),

  constraint oauth_states_state_unique unique (state),
  constraint oauth_states_state_not_blank check (length(trim(state)) > 0)
);

create table if not exists public.sync_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_account_id uuid not null,
  last_history_id text,
  last_sync_at timestamptz,
  sync_status text not null default 'idle',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sync_state_account_user_fk
    foreign key (gmail_account_id, user_id)
    references public.gmail_accounts(id, user_id)
    on delete cascade,
  constraint sync_state_user_account_unique unique (user_id, gmail_account_id),
  constraint sync_state_status_check
    check (sync_status in ('idle', 'running', 'success', 'failed', 'partial'))
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_account_id uuid not null,
  job_type text not null,
  status text not null default 'queued',
  total_items int not null default 0,
  processed_items int not null default 0,
  failed_items int not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint sync_jobs_account_user_fk
    foreign key (gmail_account_id, user_id)
    references public.gmail_accounts(id, user_id)
    on delete cascade,
  constraint sync_jobs_status_check
    check (status in ('queued', 'running', 'success', 'failed', 'partial')),
  constraint sync_jobs_counts_non_negative
    check (total_items >= 0 and processed_items >= 0 and failed_items >= 0),
  constraint sync_jobs_job_type_not_blank check (length(trim(job_type)) > 0)
);

create table if not exists public.email_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_thread_id text not null,
  subject text,
  participants jsonb not null default '[]'::jsonb,
  message_count int not null default 0,
  latest_message_at timestamptz,
  thread_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_threads_user_gmail_thread_unique unique (user_id, gmail_thread_id),
  constraint email_threads_id_user_unique unique (id, user_id),
  constraint email_threads_message_count_non_negative check (message_count >= 0),
  constraint email_threads_gmail_thread_id_not_blank check (length(trim(gmail_thread_id)) > 0)
);

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  thread_id uuid not null,
  gmail_message_id text not null,
  gmail_thread_id text not null,
  message_id_header text,
  in_reply_to_header text,
  references_header text,
  sender_email text,
  sender_name text,
  to_emails jsonb not null default '[]'::jsonb,
  cc_emails jsonb not null default '[]'::jsonb,
  bcc_emails jsonb not null default '[]'::jsonb,
  subject text,
  snippet text,
  body_text text,
  body_html text,
  internal_date timestamptz,
  history_id text,
  raw_headers jsonb not null default '{}'::jsonb,
  size_estimate int,
  has_attachments boolean not null default false,
  body_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_messages_thread_user_fk
    foreign key (thread_id, user_id)
    references public.email_threads(id, user_id)
    on delete cascade,
  constraint email_messages_user_gmail_message_unique unique (user_id, gmail_message_id),
  constraint email_messages_id_user_unique unique (id, user_id),
  constraint email_messages_gmail_message_id_not_blank check (length(trim(gmail_message_id)) > 0),
  constraint email_messages_gmail_thread_id_not_blank check (length(trim(gmail_thread_id)) > 0),
  constraint email_messages_size_estimate_non_negative
    check (size_estimate is null or size_estimate >= 0)
);

create table if not exists public.email_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  gmail_label_id text not null,
  name text not null,
  type text,
  created_at timestamptz not null default now(),

  constraint email_labels_user_gmail_label_unique unique (user_id, gmail_label_id),
  constraint email_labels_id_user_unique unique (id, user_id),
  constraint email_labels_gmail_label_id_not_blank check (length(trim(gmail_label_id)) > 0),
  constraint email_labels_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.email_message_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_id uuid not null,
  label_id uuid not null,

  constraint email_message_labels_message_user_fk
    foreign key (message_id, user_id)
    references public.email_messages(id, user_id)
    on delete cascade,
  constraint email_message_labels_label_user_fk
    foreign key (label_id, user_id)
    references public.email_labels(id, user_id)
    on delete cascade,
  constraint email_message_labels_message_label_unique unique (message_id, label_id)
);

create table if not exists public.email_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_id uuid not null,
  category text not null,
  confidence numeric,
  reason text,
  model_used text,
  prompt_version text,
  created_at timestamptz not null default now(),

  constraint email_categories_message_user_fk
    foreign key (message_id, user_id)
    references public.email_messages(id, user_id)
    on delete cascade,
  constraint email_categories_message_unique unique (message_id),
  constraint email_categories_category_check
    check (category in (
      'Newsletters',
      'Job / Recruitment',
      'Finance',
      'Notifications',
      'Personal',
      'Work / Professional'
    )),
  constraint email_categories_confidence_range
    check (confidence is null or (confidence >= 0 and confidence <= 1))
);

create table if not exists public.email_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_id uuid,
  thread_id uuid,
  summary_type text not null,
  summary text not null,
  action_items jsonb not null default '[]'::jsonb,
  model_used text,
  prompt_version text,
  created_at timestamptz not null default now(),

  constraint email_summaries_message_user_fk
    foreign key (message_id, user_id)
    references public.email_messages(id, user_id)
    on delete cascade,
  constraint email_summaries_thread_user_fk
    foreign key (thread_id, user_id)
    references public.email_threads(id, user_id)
    on delete cascade,
  constraint email_summaries_one_source_check check (num_nonnulls(message_id, thread_id) = 1),
  constraint email_summaries_summary_type_check check (summary_type in ('message', 'thread')),
  constraint email_summaries_summary_not_blank check (length(trim(summary)) > 0)
);

create table if not exists public.email_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_id uuid,
  thread_id uuid,
  chunk_text text not null,
  chunk_hash text not null,
  chunk_index int not null default 0,
  source_type text not null,
  embedding vector(768) not null,
  metadata jsonb not null default '{}'::jsonb,
  embedding_model text not null default 'gemini-embedding-001',
  created_at timestamptz not null default now(),

  constraint email_embeddings_message_user_fk
    foreign key (message_id, user_id)
    references public.email_messages(id, user_id)
    on delete cascade,
  constraint email_embeddings_thread_user_fk
    foreign key (thread_id, user_id)
    references public.email_threads(id, user_id)
    on delete cascade,
  constraint email_embeddings_user_chunk_hash_unique unique (user_id, chunk_hash),
  constraint email_embeddings_one_source_check check (num_nonnulls(message_id, thread_id) = 1),
  constraint email_embeddings_source_type_check check (source_type in ('message', 'thread')),
  constraint email_embeddings_chunk_text_not_blank check (length(trim(chunk_text)) > 0),
  constraint email_embeddings_chunk_hash_not_blank check (length(trim(chunk_hash)) > 0),
  constraint email_embeddings_chunk_index_non_negative check (chunk_index >= 0)
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chat_sessions_id_user_unique unique (id, user_id)
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_id uuid not null,
  role text not null,
  content text not null,
  sources jsonb not null default '[]'::jsonb,
  retrieved_context jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),

  constraint chat_messages_session_user_fk
    foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade,
  constraint chat_messages_role_check check (role in ('user', 'assistant', 'system')),
  constraint chat_messages_content_not_blank check (length(trim(content)) > 0)
);

create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  thread_id uuid,
  message_id uuid,
  draft_type text not null,
  prompt text,
  subject text,
  body text,
  status text not null default 'draft',
  gmail_draft_id text,
  to_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_drafts_thread_fk
    foreign key (thread_id)
    references public.email_threads(id)
    on delete set null,
  constraint email_drafts_message_fk
    foreign key (message_id)
    references public.email_messages(id)
    on delete set null,
  constraint email_drafts_draft_type_check check (draft_type in ('compose', 'reply')),
  constraint email_drafts_status_check check (status in ('draft', 'discarded', 'sent'))
);

create table if not exists public.ai_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  feature text not null,
  model_used text,
  prompt_version text,
  input_tokens int,
  output_tokens int,
  latency_ms int,
  status text,
  error_message text,
  created_at timestamptz not null default now(),

  constraint ai_runs_feature_not_blank check (length(trim(feature)) > 0),
  constraint ai_runs_status_check
    check (status is null or status in ('success', 'error', 'skipped')),
  constraint ai_runs_token_counts_non_negative
    check (
      (input_tokens is null or input_tokens >= 0)
      and (output_tokens is null or output_tokens >= 0)
      and (latency_ms is null or latency_ms >= 0)
    )
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  constraint audit_events_event_type_not_blank check (length(trim(event_type)) > 0)
);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_gmail_accounts_updated_at on public.gmail_accounts;
create trigger set_gmail_accounts_updated_at
before update on public.gmail_accounts
for each row execute function public.set_updated_at();

drop trigger if exists set_sync_state_updated_at on public.sync_state;
create trigger set_sync_state_updated_at
before update on public.sync_state
for each row execute function public.set_updated_at();

drop trigger if exists set_email_threads_updated_at on public.email_threads;
create trigger set_email_threads_updated_at
before update on public.email_threads
for each row execute function public.set_updated_at();

drop trigger if exists set_email_messages_updated_at on public.email_messages;
create trigger set_email_messages_updated_at
before update on public.email_messages
for each row execute function public.set_updated_at();

drop trigger if exists set_chat_sessions_updated_at on public.chat_sessions;
create trigger set_chat_sessions_updated_at
before update on public.chat_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_email_drafts_updated_at on public.email_drafts;
create trigger set_email_drafts_updated_at
before update on public.email_drafts
for each row execute function public.set_updated_at();

create index if not exists idx_gmail_accounts_user_id
  on public.gmail_accounts(user_id);

create index if not exists idx_oauth_states_expires_at
  on public.oauth_states(expires_at);

create index if not exists idx_sync_state_user_id
  on public.sync_state(user_id);

create index if not exists idx_sync_jobs_user_status
  on public.sync_jobs(user_id, status);

create index if not exists idx_email_threads_user_id
  on public.email_threads(user_id);

create index if not exists idx_email_threads_gmail_thread_id
  on public.email_threads(gmail_thread_id);

create index if not exists idx_email_threads_user_latest_message_at
  on public.email_threads(user_id, latest_message_at desc);

create index if not exists idx_email_messages_user_id
  on public.email_messages(user_id);

create index if not exists idx_email_messages_thread_id
  on public.email_messages(thread_id);

create index if not exists idx_email_messages_gmail_message_id
  on public.email_messages(gmail_message_id);

create index if not exists idx_email_messages_gmail_thread_id
  on public.email_messages(gmail_thread_id);

create index if not exists idx_email_messages_sender_email
  on public.email_messages(sender_email);

create index if not exists idx_email_messages_internal_date_desc
  on public.email_messages(internal_date desc);

create index if not exists idx_email_messages_body_hash
  on public.email_messages(body_hash);

create index if not exists idx_email_labels_user_id
  on public.email_labels(user_id);

create index if not exists idx_email_message_labels_user_id
  on public.email_message_labels(user_id);

create index if not exists idx_email_message_labels_message_id
  on public.email_message_labels(message_id);

create index if not exists idx_email_message_labels_label_id
  on public.email_message_labels(label_id);

create index if not exists idx_email_categories_user_id
  on public.email_categories(user_id);

create index if not exists idx_email_categories_category
  on public.email_categories(category);

create index if not exists idx_email_summaries_user_id
  on public.email_summaries(user_id);

create index if not exists idx_email_summaries_message_id
  on public.email_summaries(message_id);

create index if not exists idx_email_summaries_thread_id
  on public.email_summaries(thread_id);

create index if not exists idx_email_embeddings_user_id
  on public.email_embeddings(user_id);

create index if not exists idx_email_embeddings_chunk_hash
  on public.email_embeddings(chunk_hash);

create index if not exists idx_email_embeddings_message_id
  on public.email_embeddings(message_id);

create index if not exists idx_email_embeddings_thread_id
  on public.email_embeddings(thread_id);

create index if not exists idx_email_embeddings_embedding_hnsw
  on public.email_embeddings
  using hnsw (embedding vector_cosine_ops);

create index if not exists idx_chat_sessions_user_id
  on public.chat_sessions(user_id);

create index if not exists idx_chat_messages_session_created_at
  on public.chat_messages(session_id, created_at);

create index if not exists idx_email_drafts_user_status
  on public.email_drafts(user_id, status);

create index if not exists idx_ai_runs_user_feature_created_at
  on public.ai_runs(user_id, feature, created_at desc);

create index if not exists idx_audit_events_user_event_created_at
  on public.audit_events(user_id, event_type, created_at desc);

create or replace function public.match_email_embeddings(
  query_embedding vector(768),
  match_user_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  chunk_text text,
  metadata jsonb,
  similarity double precision,
  message_id uuid,
  thread_id uuid
)
language sql
stable
as $$
  select
    e.id,
    e.chunk_text,
    e.metadata,
    1 - (e.embedding <=> query_embedding) as similarity,
    e.message_id,
    e.thread_id
  from public.email_embeddings e
  where e.user_id = match_user_id
  order by e.embedding <=> query_embedding
  limit least(greatest(coalesce(match_count, 5), 1), 50);
$$;

alter table public.users enable row level security;
alter table public.gmail_accounts enable row level security;
alter table public.oauth_states enable row level security;
alter table public.sync_state enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.email_threads enable row level security;
alter table public.email_messages enable row level security;
alter table public.email_labels enable row level security;
alter table public.email_message_labels enable row level security;
alter table public.email_categories enable row level security;
alter table public.email_summaries enable row level security;
alter table public.email_embeddings enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.email_drafts enable row level security;
alter table public.ai_runs enable row level security;
alter table public.audit_events enable row level security;

-- MVP security posture:
-- The Express backend should use the Supabase service role key only on the server.
-- No frontend code should query these tables directly in the MVP.
-- RLS is enabled without broad policies so direct anon/authenticated access remains closed.
revoke execute on function public.match_email_embeddings(vector, uuid, integer) from anon, authenticated;
