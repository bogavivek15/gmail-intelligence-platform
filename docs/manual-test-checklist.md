# Manual Test Checklist

## Setup

- [ ] Apply `supabase/schema.sql` in Supabase SQL Editor
- [ ] Fill root `.env`
- [ ] Google OAuth redirect URI is `http://localhost:3001/auth/google/callback`
- [ ] Google OAuth test user is added
- [ ] Backend starts with `npm run dev`
- [ ] Frontend starts with `npm run dev`
- [ ] `GET /health` returns `status: ok`

## OAuth And Session

- [ ] Login page opens
- [ ] Connect Gmail redirects to Google consent screen
- [ ] OAuth callback returns to frontend dashboard
- [ ] `/auth/me` returns current user
- [ ] Logout clears session

## Gmail Sync

- [ ] Dashboard Sync Gmail starts sync
- [ ] `sync_jobs` row is created
- [ ] `sync_state` is updated
- [ ] Gmail labels are stored
- [ ] Email threads are stored
- [ ] Email messages are stored
- [ ] Message-label links are stored
- [ ] Email embeddings are created with `vector(768)`
- [ ] Re-running sync does not duplicate messages

## Frontend Email Views

- [ ] Inbox lists synced emails
- [ ] Search field filters results
- [ ] Category filter works after categorization
- [ ] Email detail opens
- [ ] Thread detail opens
- [ ] Thread messages appear in chronological order

## AI

- [ ] Email summary returns JSON-backed summary
- [ ] Thread summary returns thread-aware summary
- [ ] Categorization uses NVIDIA NIM or Gemini fallback
- [ ] Compose creates editable draft
- [ ] Thread reply creates editable draft
- [ ] Send reviewed reply requires explicit button click

## RAG Chat

- [ ] Chat embeds the user question
- [ ] Chat retrieves email chunks through `match_email_embeddings`
- [ ] Chat answer includes sources
- [ ] Unanswerable question returns `I could not find this information in the synced emails.`
- [ ] Chat messages are stored in Supabase

## Security

- [ ] OAuth tokens are not visible in frontend network responses
- [ ] Service role key is not exposed to frontend
- [ ] Protected routes reject unauthenticated requests
- [ ] Requests cannot pass arbitrary `user_id`
- [ ] Logs do not include OAuth tokens or full email bodies

## Known Manual Gaps

- [ ] Gmail History API delta sync is documented as future work
- [ ] KMS token encryption is documented as future work
- [ ] Attachment intelligence is documented as future work
- [ ] Background worker queue is documented as future work

