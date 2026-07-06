-- Supabase Seed Mock Emails SQL Script
-- Mitigates Google OAuth restrictions for evaluators/judges by providing pre-populated email and vector data.
-- Targets PostgreSQL with pgvector extension loaded.

-- Wrap in a transaction to ensure atomic execution
BEGIN;

-- Define variables for IDs to maintain consistency
DO $$
DECLARE
  v_user_id uuid := 'd0000000-0000-0000-0000-000000000001';
  v_account_id uuid := 'd0000000-0000-0000-0000-000000000002';
  v_inbox_label_id uuid := 'd0000000-0000-0000-0000-000000000021';
  v_unread_label_id uuid := 'd0000000-0000-0000-0000-000000000022';
  v_work_label_id uuid := 'd0000000-0000-0000-0000-000000000023';

  v_thread_1_id uuid := 'd0000000-0000-0000-0000-000000000011';
  v_thread_2_id uuid := 'd0000000-0000-0000-0000-000000000012';
  v_thread_3_id uuid := 'd0000000-0000-0000-0000-000000000013';

  v_msg_1_id uuid := 'd0000000-0000-0000-0000-000000000101';
  v_msg_2_id uuid := 'd0000000-0000-0000-0000-000000000102';
  v_msg_3_id uuid := 'd0000000-0000-0000-0000-000000000103';
  v_msg_4_id uuid := 'd0000000-0000-0000-0000-000000000104';
BEGIN
  -- Clean up any existing data associated with the evaluator session to support re-runnability
  DELETE FROM public.email_embeddings WHERE user_id = v_user_id;
  DELETE FROM public.email_categories WHERE user_id = v_user_id;
  DELETE FROM public.email_message_labels WHERE user_id = v_user_id;
  DELETE FROM public.email_labels WHERE user_id = v_user_id;
  DELETE FROM public.email_messages WHERE user_id = v_user_id;
  DELETE FROM public.email_threads WHERE user_id = v_user_id;
  DELETE FROM public.gmail_accounts WHERE user_id = v_user_id;
  DELETE FROM public.users WHERE id = v_user_id;

  -- 1. Insert Mock User
  INSERT INTO public.users (id, google_email, name, avatar_url, created_at, updated_at)
  VALUES (
    v_user_id,
    'judge@repeatless.com',
    'Capstone Judge',
    'https://lh3.googleusercontent.com/a/default-user',
    NOW(),
    NOW()
  );

  -- 2. Insert Mock Gmail Account
  INSERT INTO public.gmail_accounts (id, user_id, gmail_email, access_token, refresh_token, token_expiry, scope, created_at, updated_at)
  VALUES (
    v_account_id,
    v_user_id,
    'judge@repeatless.com',
    'mock_access_token_value',
    'mock_refresh_token_value',
    NOW() + INTERVAL '1 year',
    'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
    NOW(),
    NOW()
  );

  -- 3. Insert Labels
  INSERT INTO public.email_labels (id, user_id, gmail_label_id, name, type, created_at)
  VALUES 
    (v_inbox_label_id, v_user_id, 'INBOX', 'INBOX', 'system', NOW()),
    (v_unread_label_id, v_user_id, 'UNREAD', 'UNREAD', 'system', NOW()),
    (v_work_label_id, v_user_id, 'Label_Work', 'Work', 'user', NOW());

  -- 4. Insert Threads
  INSERT INTO public.email_threads (id, user_id, gmail_thread_id, subject, participants, message_count, latest_message_at, created_at, updated_at)
  VALUES
    (
      v_thread_1_id, 
      v_user_id, 
      '18f731a1b8cde901', 
      'RE: Q3 Product Roadmap and Team Frontend Shift', 
      '[{"name": "M Samith", "email": "samith.m@acme.com"}, {"name": "Capstone Judge", "email": "judge@repeatless.com"}]'::jsonb,
      2,
      NOW() - INTERVAL '2 hours',
      NOW() - INTERVAL '1 day',
      NOW()
    ),
    (
      v_thread_2_id, 
      v_user_id, 
      '18f731c3d8cde902', 
      'Weekly Technology Roundup - Issue #142', 
      '[{"name": "DevOps Digest", "email": "newsletter@devopsdigest.com"}]'::jsonb,
      1,
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      NOW()
    ),
    (
      v_thread_3_id, 
      v_user_id, 
      '18f731f5e8cde903', 
      'AWS Billing Notification: Invoice Ready for Payment', 
      '[{"name": "Amazon Web Services", "email": "billing@aws.amazon.com"}]'::jsonb,
      1,
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days',
      NOW()
    );

  -- 5. Insert Messages
  -- Thread 1: Samith's original message
  INSERT INTO public.email_messages (
    id, user_id, thread_id, gmail_message_id, gmail_thread_id, 
    sender_email, sender_name, to_emails, cc_emails, bcc_emails, 
    subject, snippet, body_text, body_html, internal_date, history_id, 
    raw_headers, size_estimate, has_attachments, body_hash, created_at, updated_at
  ) VALUES (
    v_msg_1_id,
    v_user_id,
    v_thread_1_id,
    '18f731a1b8cde901',
    '18f731a1b8cde901',
    'samith.m@acme.com',
    'M Samith',
    '[{"name": "Capstone Judge", "email": "judge@repeatless.com"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'RE: Q3 Product Roadmap and Team Frontend Shift',
    'Hi Team, quick update on the Q3 roadmap. We are planning a framework transition from legacy templates to React + Vite for the core platform. Please review the proposal.',
    'Hi Team,\n\nFollowing up on our engineering alignment session yesterday, here is the official outline for our Q3 product roadmap. The primary initiative is transitioning the frontend from our outdated templating engine to a modern React + Vite application structure to support dynamic state tracking.\n\nWe have scheduled the Postgres data migration pipeline for the weekend of July 25th. Let me know if you foresee any conflicts.\n\nBest,\nSamith\nDirector of Platform Architecture',
    '<p>Hi Team,</p><p>Following up on our engineering alignment session yesterday...</p>',
    NOW() - INTERVAL '4 hours',
    '1094021',
    '{"From": "M Samith <samith.m@acme.com>", "To": "judge@repeatless.com"}'::jsonb,
    1450,
    false,
    'bodyhash_roadmap_01',
    NOW() - INTERVAL '1 day',
    NOW()
  );

  -- Thread 1: Reply from the user (Judge)
  INSERT INTO public.email_messages (
    id, user_id, thread_id, gmail_message_id, gmail_thread_id, 
    sender_email, sender_name, to_emails, cc_emails, bcc_emails, 
    subject, snippet, body_text, body_html, internal_date, history_id, 
    raw_headers, size_estimate, has_attachments, body_hash, created_at, updated_at
  ) VALUES (
    v_msg_2_id,
    v_user_id,
    v_thread_1_id,
    '18f731a1b8cde90a',
    '18f731a1b8cde901',
    'judge@repeatless.com',
    'Capstone Judge',
    '[{"name": "M Samith", "email": "samith.m@acme.com"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'RE: Q3 Product Roadmap and Team Frontend Shift',
    'Thanks Samith. I have reviewed the roadmap. The proposed Postgres data migration on July 25th looks clean. I will double-check schema changes.',
    'Thanks Samith. I have reviewed the roadmap.\n\nThe proposed Postgres data migration on July 25th looks clean. I will double-check the schema dependencies and RLS policies on our Supabase instance beforehand. Do we have the draft schemas ready in staging?\n\nCheers,\nJudge',
    '<p>Thanks Samith. I have reviewed the roadmap...</p>',
    NOW() - INTERVAL '2 hours',
    '1094045',
    '{"From": "Capstone Judge <judge@repeatless.com>", "To": "samith.m@acme.com"}'::jsonb,
    890,
    false,
    'bodyhash_roadmap_02',
    NOW() - INTERVAL '2 hours',
    NOW()
  );

  -- Thread 2: Newsletter
  INSERT INTO public.email_messages (
    id, user_id, thread_id, gmail_message_id, gmail_thread_id, 
    sender_email, sender_name, to_emails, cc_emails, bcc_emails, 
    subject, snippet, body_text, body_html, internal_date, history_id, 
    raw_headers, size_estimate, has_attachments, body_hash, created_at, updated_at
  ) VALUES (
    v_msg_3_id,
    v_user_id,
    v_thread_2_id,
    '18f731c3d8cde902',
    '18f731c3d8cde902',
    'newsletter@devopsdigest.com',
    'DevOps Digest',
    '[{"name": "Capstone Judge", "email": "judge@repeatless.com"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'Weekly Technology Roundup - Issue #142',
    'Google Gemini 2.5 Flash, Kubernetes v1.31 Release, and the emergence of pgvector HNSW index configurations. Catch up on this week’s tech updates.',
    'Welcome to DevOps Digest Issue #142!\n\nThis week, we are diving deep into:\n1. Google Gemini 2.5 Flash: The model brings massive latency optimizations for real-time RAG flows.\n2. Kubernetes v1.31: Introducing native support for volume mounting optimizations.\n3. pgvector & HNSW: Why developers are migrating from IVFFlat to HNSW for large-scale production vector indexing.\n\nSubscribe for more architectural tips next week.',
    '<p>Welcome to DevOps Digest Issue #142...</p>',
    NOW() - INTERVAL '1 day',
    '1095031',
    '{"From": "DevOps Digest <newsletter@devopsdigest.com>", "To": "judge@repeatless.com"}'::jsonb,
    2100,
    false,
    'bodyhash_newsletter_01',
    NOW() - INTERVAL '1 day',
    NOW()
  );

  -- Thread 3: Billing Alert
  INSERT INTO public.email_messages (
    id, user_id, thread_id, gmail_message_id, gmail_thread_id, 
    sender_email, sender_name, to_emails, cc_emails, bcc_emails, 
    subject, snippet, body_text, body_html, internal_date, history_id, 
    raw_headers, size_estimate, has_attachments, body_hash, created_at, updated_at
  ) VALUES (
    v_msg_4_id,
    v_user_id,
    v_thread_3_id,
    '18f731f5e8cde903',
    '18f731f5e8cde903',
    'billing@aws.amazon.com',
    'Amazon Web Services',
    '[{"name": "Capstone Judge", "email": "judge@repeatless.com"}]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    'AWS Billing Notification: Invoice Ready for Payment',
    'Your AWS invoice for June 2026 is ready. Total due: $142.50. Payment will be automatically charged to your default card on July 15, 2026.',
    'Dear AWS Customer,\n\nYour monthly Amazon Web Services invoice is now available for the billing period of June 1, 2026, through June 30, 2026.\n\nAccount Summary:\nAccount ID: 9812-4412-0941\nInvoice ID: INV-9908124\nTotal Amount Due: $142.50 USD\n\nPayment Date: July 15, 2026. The amount will be automatically charged to your visa card on file.\n\nSincerely,\nThe AWS Billing Team',
    '<p>Dear AWS Customer, your monthly AWS invoice...</p>',
    NOW() - INTERVAL '2 days',
    '1091012',
    '{"From": "Amazon Web Services <billing@aws.amazon.com>", "To": "judge@repeatless.com"}'::jsonb,
    1820,
    false,
    'bodyhash_billing_01',
    NOW() - INTERVAL '2 days',
    NOW()
  );

  -- 6. Link Message Labels
  -- Message 1: INBOX, UNREAD, WORK
  INSERT INTO public.email_message_labels (user_id, message_id, label_id) VALUES 
    (v_user_id, v_msg_1_id, v_inbox_label_id),
    (v_user_id, v_msg_1_id, v_unread_label_id),
    (v_user_id, v_msg_1_id, v_work_label_id);
    
  -- Message 2: SENT (no inbox label, user reply)
  -- Message 3: INBOX, UNREAD (newsletter)
  INSERT INTO public.email_message_labels (user_id, message_id, label_id) VALUES 
    (v_user_id, v_msg_3_id, v_inbox_label_id),
    (v_user_id, v_msg_3_id, v_unread_label_id);

  -- Message 4: INBOX, WORK (billing alert)
  INSERT INTO public.email_message_labels (user_id, message_id, label_id) VALUES 
    (v_user_id, v_msg_4_id, v_inbox_label_id),
    (v_user_id, v_msg_4_id, v_work_label_id);

  -- 7. Insert AI Categories
  INSERT INTO public.email_categories (user_id, message_id, category, confidence, reason, model_used, prompt_version, created_at)
  VALUES
    (v_user_id, v_msg_1_id, 'Work / Professional', 0.95, 'Discusses Q3 roadmap timelines and React frontend transition.', 'eta/llama-3.1-8b-instruct', '1.0.0', NOW()),
    (v_user_id, v_msg_2_id, 'Work / Professional', 0.98, 'Confirming staging schema changes for Q3 Postgres migration.', 'eta/llama-3.1-8b-instruct', '1.0.0', NOW()),
    (v_user_id, v_msg_3_id, 'Newsletters', 0.99, 'Weekly DevOps Digest tech digest covering Gemini, Kubernetes, and pgvector.', 'eta/llama-3.1-8b-instruct', '1.0.0', NOW()),
    (v_user_id, v_msg_4_id, 'Finance', 0.97, 'AWS invoice billing notification detailing June consumption amount of $142.50.', 'eta/llama-3.1-8b-instruct', '1.0.0', NOW());

  -- 8. Insert Chunks & Vector Embeddings
  -- Each embedding uses a deterministic sequence generated using sin(i) to populate 768 float values.
  -- This creates syntax-valid, queryable vectors that pgvector indexing and cosine distance <=> match perfectly.

  -- Message 1 Chunks (Roadmap discussion)
  INSERT INTO public.email_embeddings (
    user_id, message_id, thread_id, chunk_text, chunk_hash, chunk_index, source_type, embedding, metadata, embedding_model, created_at
  ) VALUES (
    v_user_id,
    v_msg_1_id,
    NULL,
    'Subject: RE: Q3 Product Roadmap and Team Frontend Shift\nSender: M Samith <samith.m@acme.com>\nDate: ' || (NOW() - INTERVAL '4 hours')::text || '\n\nOutline for our Q3 product roadmap. The primary initiative is transitioning the frontend from our legacy templating engine to a modern React + Vite application structure.',
    'md5_chunk_hash_001',
    0,
    'message',
    (SELECT ARRAY(SELECT (sin(i)::float8 * 0.1) FROM generate_series(1, 768) i)::vector(768)),
    '{"sender": "M Samith", "sender_email": "samith.m@acme.com", "subject": "RE: Q3 Product Roadmap and Team Frontend Shift", "gmail_message_id": "18f731a1b8cde901", "gmail_thread_id": "18f731a1b8cde901"}'::jsonb,
    'gemini-embedding-001',
    NOW()
  );

  INSERT INTO public.email_embeddings (
    user_id, message_id, thread_id, chunk_text, chunk_hash, chunk_index, source_type, embedding, metadata, embedding_model, created_at
  ) VALUES (
    v_user_id,
    v_msg_1_id,
    NULL,
    'We have scheduled the Postgres data migration pipeline for the weekend of July 25th. Let me know if you foresee any conflicts. - Samith, Director of Platform Architecture',
    'md5_chunk_hash_002',
    1,
    'message',
    (SELECT ARRAY(SELECT (cos(i)::float8 * 0.1) FROM generate_series(1, 768) i)::vector(768)),
    '{"sender": "M Samith", "sender_email": "samith.m@acme.com", "subject": "RE: Q3 Product Roadmap and Team Frontend Shift", "gmail_message_id": "18f731a1b8cde901", "gmail_thread_id": "18f731a1b8cde901"}'::jsonb,
    'gemini-embedding-001',
    NOW()
  );

  -- Message 2 Chunks (Judge reply)
  INSERT INTO public.email_embeddings (
    user_id, message_id, thread_id, chunk_text, chunk_hash, chunk_index, source_type, embedding, metadata, embedding_model, created_at
  ) VALUES (
    v_user_id,
    v_msg_2_id,
    NULL,
    'Subject: RE: Q3 Product Roadmap and Team Frontend Shift\nSender: Capstone Judge <judge@repeatless.com>\nDate: ' || (NOW() - INTERVAL '2 hours')::text || '\n\nProposed Postgres data migration on July 25th looks clean. I will double-check the schema dependencies and RLS policies on our Supabase instance beforehand. Do we have staging schema files ready?',
    'md5_chunk_hash_003',
    0,
    'message',
    (SELECT ARRAY(SELECT (sin(i * 2)::float8 * 0.08) FROM generate_series(1, 768) i)::vector(768)),
    '{"sender": "Capstone Judge", "sender_email": "judge@repeatless.com", "subject": "RE: Q3 Product Roadmap and Team Frontend Shift", "gmail_message_id": "18f731a1b8cde90a", "gmail_thread_id": "18f731a1b8cde901"}'::jsonb,
    'gemini-embedding-001',
    NOW()
  );

  -- Message 3 Chunks (DevOps Digest Newsletter)
  INSERT INTO public.email_embeddings (
    user_id, message_id, thread_id, chunk_text, chunk_hash, chunk_index, source_type, embedding, metadata, embedding_model, created_at
  ) VALUES (
    v_user_id,
    v_msg_3_id,
    NULL,
    'Subject: Weekly Technology Roundup - Issue #142\nSender: DevOps Digest <newsletter@devopsdigest.com>\n\nArticles:\n1. Google Gemini 2.5 Flash: bringing massive latency optimizations for real-time RAG flows.\n2. Kubernetes v1.31: natively supporting volume mounting optimizations.\n3. pgvector & HNSW: Why developers are migrating to HNSW for large-scale production vector indexing.',
    'md5_chunk_hash_004',
    0,
    'message',
    (SELECT ARRAY(SELECT (cos(i * 2)::float8 * 0.08) FROM generate_series(1, 768) i)::vector(768)),
    '{"sender": "DevOps Digest", "sender_email": "newsletter@devopsdigest.com", "subject": "Weekly Technology Roundup - Issue #142", "gmail_message_id": "18f731c3d8cde902", "gmail_thread_id": "18f731c3d8cde902"}'::jsonb,
    'gemini-embedding-001',
    NOW()
  );

  -- Message 4 Chunks (AWS Invoice)
  INSERT INTO public.email_embeddings (
    user_id, message_id, thread_id, chunk_text, chunk_hash, chunk_index, source_type, embedding, metadata, embedding_model, created_at
  ) VALUES (
    v_user_id,
    v_msg_4_id,
    NULL,
    'Subject: AWS Billing Notification: Invoice Ready for Payment\nSender: Amazon Web Services <billing@aws.amazon.com>\n\nAccount Summary:\nAccount ID: 9812-4412-0941\nInvoice ID: INV-9908124\nTotal Amount Due: $142.50 USD\nPayment Date: July 15, 2026. Will be charged to credit card automatically.',
    'md5_chunk_hash_005',
    0,
    'message',
    (SELECT ARRAY(SELECT (sin(i * 3)::float8 * 0.05) FROM generate_series(1, 768) i)::vector(768)),
    '{"sender": "Amazon Web Services", "sender_email": "billing@aws.amazon.com", "subject": "AWS Billing Notification: Invoice Ready for Payment", "gmail_message_id": "18f731f5e8cde903", "gmail_thread_id": "18f731f5e8cde903"}'::jsonb,
    'gemini-embedding-001',
    NOW()
  );

END $$;

-- Commit transactions
COMMIT;
