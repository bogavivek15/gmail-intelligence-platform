# AI-Powered Gmail Intelligence Platform

A production-minded MVP for syncing Gmail into Supabase PostgreSQL + pgvector and using Gemini/NVIDIA NIM for email intelligence.

---

## 🎯 Kaggle Capstone Alignment
This project is submitted under the **"Concierge Agents / Agents for Business"** track as a secure, enterprise-ready **Email Intelligence Framework**. The architecture is modeled around core agentic capabilities:
- **Agent Control Plane & Action State Engine:** Framed by the Node.js/Express backend, which orchestrates agent decision loops (Gemini and NVIDIA NIM), handles secure session state, governs multi-tenant data boundary verification, and logs diagnostic telemetries inside `ai_runs` and `audit_events`.
- **Custom Agent Skill & Tool Ecosystem:** Implemented via Google Gmail API integration and pgvector database RPC utilities. The agent exposes tools to sync, chunk, categorize, query semantic memory, and generate/dispatch draft-first replies on behalf of the user.

---

## Implemented Features

- **Google OAuth Flow:** Backend-orchestrated Google OAuth 2.0 connection with state verification and PKCE security parameters.
- **Secure Authentication:** Signed HTTP-only session cookies holding JWT tokens to prevent client-side script token access.
- **Relational & Vector Database:** A normalized Supabase schema representing users, Gmail accounts, sync status, message threads, labels, categorization runs, semantic embeddings, chat sessions, and auditing logs.
- **Gmail Sync Pipeline:** Syncs the latest emails with robust nextPageToken pagination, recursive MIME parsing, label maps, upsert handling, and exponential backoff retry execution.
- **NVIDIA NIM Categorization:** Direct semantic classification using an NVIDIA NIM model (`eta/llama-3.1-8b-instruct`), utilizing Google Gemini 2.5 Flash as an inline fallback loop on failure.
- **Semantic RAG Chat:** Multi-turn chat grounded exclusively in the user's vector embeddings (`gemini-embedding-001`), returning sources list and strictly outputting *"I could not find this information in the synced emails."* if relevant context is missing.
- **Draft-First Response Safety:** Synthesizes draft replies respecting threading headers (`In-Reply-To`, `References`) without auto-sending. Users must review generated drafts before final dispatch.
- **Interactive UI:** Premium React + Vite dashboard displaying sync progress, mailboxes, threads, chat boxes, and email compositions.

---

## Not Implemented (Future Roadmap)

- **Gmail Push Notifications:** Real-time sync triggers via Gmail Watch/PubSub subscriptions.
- **Full History API Sync:** True delta synchronization based on transaction history histories instead of paginated lists.
- **Asynchronous Job Queues:** Offloading background sync tasks to worker queues (e.g., BullMQ or Celery) instead of in-process setImmediate execution.
- **Secret Encryption:** Encrypting user refresh tokens at rest using KMS (Key Management Service) or Supabase Vault.
- **Direct Row-Level Security (RLS) Policies:** Hardening Supabase tables for direct frontend queries (currently bypassed securely via service-role only access on the backend).

---

## Tech Stack & Architecture mapping

| Component | Technology | Agentic Architecture Role |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind/CSS | **User Interaction Console & Review Boundary** |
| **Backend** | Node.js, Express | **Agent Control Plane & Action State Engine** |
| **Database** | Supabase, pgvector | **Semantic Memory Bank & Structured State Store** |
| **Gmail API** | Google Cloud APIs | **Custom External Action Skills / Tools** |
| **Primary AI** | Google Gemini (2.5 Flash) | **RAG Reasoner, Summarizer, and Compose Agent** |
| **Secondary AI** | NVIDIA NIM (Llama 3.1 8B) | **Structured Categorizer & Router Agent** |

---

## Prerequisites

- Node.js 20.19+ or 22.12+
- Supabase project with SQL Editor access
- Google Cloud Console Web Application Client (OAuth 2.0 Credentials)
- Google Gemini API Key
- NVIDIA NIM API Key

---

## Environment Configuration

Copy `.env.example` to `.env` in the project root and fill all required values:

```bash
copy .env.example .env
```

> [!IMPORTANT]
> Ensure `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_CLIENT_SECRET` remain strictly backend-side and are never exposed to the frontend repository files. `JWT_SECRET` and `COOKIE_SECRET` must be high-entropy strings of at least 32 characters.

---

## Supabase Setup & Judge OAuth Bypass

### 1. Database Initialization
1. Create a project in the **Supabase Dashboard**.
2. Open the **SQL Editor** from the left navigation panel.
3. Open [schema.sql](file:///c:/Users/bogav/OneDrive/Desktop/repeatless/gmail-intelligence-platform/supabase/schema.sql), copy its contents, and execute them in the SQL Editor.
4. Verify that the `pgcrypto` and `vector` extensions have successfully initialized.

### 2. OAuth Bypass for Evaluation (Recommended)
Since Google OAuth client applications restrict login strictly to pre-registered sandbox users, judges can run the system immediately using our offline seed data:
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Open [seed_mock_emails.sql](file:///c:/Users/bogav/OneDrive/Desktop/repeatless/gmail-intelligence-platform/supabase/seed_mock_emails.sql), copy its contents, and execute them to seed the database.
3. This creates a mock identity (`judge@repeatless.com`) and populates the inbox tables with:
   - Realistic emails (a roadmap update from manager **'M Samith'** discussing frontend React shifts, a DevOps newsletter on Kubernetes, and an AWS invoice alert).
   - Pre-populated **768-dimensional float arrays** corresponding to text chunks in the `email_embeddings` table to ensure vector similarity logic runs out-of-the-box.
4. Navigate to the following bypass route in your browser to sign in instantly as the mock Judge and establish a secure HTTP session:
   ```text
   http://localhost:3001/auth/bypass-login
   ```
5. You will be logged in and redirected straight to the frontend dashboard (`http://localhost:5173/dashboard`) with your session cookie set.

---

## Google OAuth Setup (Alternative Sandbox Run)

Create an OAuth web client in the Google Cloud Console.

1. **Redirect URI:** Add `http://localhost:3001/auth/google/callback` to the authorized redirect URIs list.
2. **Scopes:** Request the following read/write scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
3. **Test Users:** Under OAuth consent screen setup, add your personal Gmail test email as an authorized sandbox user.

---

## Installation & Running Locally

### Backend Setup
```bash
cd backend
npm install
npm run dev
```
- **Health Check:** `Invoke-RestMethod http://localhost:3001/health` (should return status `"ok"`).
- **Run Tests:** `npm test` (verifies parser algorithms, text chunkers, and JSON repair scripts).

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Navigate to:
```text
http://localhost:5173
```

---

## Judge Demonstration Guide

1. Start both the backend and frontend servers.
2. Perform the **OAuth Bypass** step to seed mock data and authenticate instantly.
3. Inspect the **Dashboard** metrics showing synced counts.
4. Browse the **Inbox** to inspect mock email threads.
5. Open an email thread (e.g. Samith's Roadmap discussion) to view summaries, categories, and generate draft replies.
6. Open the **RAG Chat** interface and test source grounding:
   - Ask: *"What date is the Postgres data migration scheduled?"* (Should return July 25th, citing Samith's email).
   - Ask: *"How much do I owe AWS?"* (Should return $142.50, citing AWS Billing).
   - Ask: *"What is the weather in New York?"* (Should return *"I could not find this information in the synced emails."* to demonstrate zero-hallucination compliance).
7. Generate a **Compose Draft** or reply to an email to verify that drafts are stored and created in Gmail without auto-sending.
