import { Navigate, useSearchParams } from 'react-router-dom';
import { Mail, MessageSquare, ShieldCheck, Sparkles, KeyRound, Search, Terminal } from 'lucide-react';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function Login() {
  const { user, loading, error, login } = useAuth();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('oauth_error');

  if (loading) {
    return <LoadingState label="Checking authentication credentials" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section className="landing-container">
      {/* 🚀 Brand Header & Badge */}
      <div className="landing-badge">
        <Sparkles size={14} /> Next-Gen Email Workspace
      </div>

      <h1 className="landing-title">
        Supercharge Your Inbox <br /> With Gmail Intelligence
      </h1>

      <p className="landing-subtitle">
        Connect Gmail securely to sync email threads into Supabase vector databases, auto-categorize incoming messages, generate draft replies, and chat with your mailbox knowledge base safely.
      </p>

      {/* ⚡ Call To Action */}
      <div className="landing-cta-row">
        <button className="google-cta-button" type="button" onClick={login}>
          {/* Custom Multi-Colored Google SVG Logo */}
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Connect Google Mail Account
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-tertiary)', fontSize: '13px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--accent-emerald)' }} />
          <span>Official Google OAuth 2.0 Sandbox connection</span>
        </div>
      </div>

      <ErrorState message={oauthError || error} />

      {/* 🖥️ Visual Browser Mockup (Simulated App Dashboard Preview) */}
      <div className="browser-mockup">
        <div className="browser-header">
          <div className="browser-dot red"></div>
          <div className="browser-dot yellow"></div>
          <div className="browser-dot green"></div>
          <div className="browser-address-bar">workspace.gmail.intelligence/dashboard</div>
        </div>

        <div className="browser-body">
          <div className="mockup-sidebar">
            <div className="mockup-sidebar-header">
              <Sparkles size={14} style={{ color: 'var(--brand-start)' }} />
              Workspace AI
            </div>
            <div className="mockup-nav-item active">Inbox Index</div>
            <div className="mockup-nav-item">RAG Search</div>
            <div className="mockup-nav-item">Compose Draft</div>
            <div className="mockup-nav-item">System Log</div>
          </div>

          <div className="mockup-main">
            <div className="mockup-metrics">
              <div className="mockup-metric">
                <span>Emails Synced</span>
                <strong>142</strong>
              </div>
              <div className="mockup-metric">
                <span>AI Summarized</span>
                <strong>89</strong>
              </div>
              <div className="mockup-metric">
                <span>Vector Embeddings</span>
                <strong>412</strong>
              </div>
            </div>

            <div className="mockup-emails">
              <div className="mockup-email">
                <div className="mockup-email-info">
                  <span className="mockup-email-sender">Bogav Vivek</span>
                  <span className="mockup-email-subject">Completed final project milestones on schedule</span>
                </div>
                <span className="mockup-email-badge" style={{ color: '#10B981', background: 'rgba(16,185,129,0.15)' }}>Work</span>
              </div>

              <div className="mockup-email">
                <div className="mockup-email-info">
                  <span className="mockup-email-sender">Google Dev Console</span>
                  <span className="mockup-email-subject">OAuth consent verification scope status alert</span>
                </div>
                <span className="mockup-email-badge" style={{ color: '#FBBF24', background: 'rgba(251,191,36,0.15)' }}>Notify</span>
              </div>

              <div className="mockup-email">
                <div className="mockup-email-info">
                  <span className="mockup-email-sender">Acme Newsletter</span>
                  <span className="mockup-email-subject">Weekly AI updates and framework updates</span>
                </div>
                <span className="mockup-email-badge" style={{ color: '#22D3EE', background: 'rgba(34,211,238,0.15)' }}>News</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 Feature Cards Grid */}
      <div className="features-grid-landing">
        <div className="feature-card-landing">
          <div className="feature-card-icon">
            <Search size={22} />
          </div>
          <h3>Semantic RAG Search</h3>
          <p>Ask natural questions like "What did Vivek send in the proposal?" and get source-grounded answers with instant email citations.</p>
        </div>

        <div className="feature-card-landing">
          <div className="feature-card-icon">
            <Mail size={22} />
          </div>
          <h3>Synthesis Summaries</h3>
          <p>Distill nested conversation threads and long emails into actionable bullet points, next-steps, and urgency metrics automatically.</p>
        </div>

        <div className="feature-card-landing">
          <div className="feature-card-icon">
            <MessageSquare size={22} />
          </div>
          <h3>Context-Aware Drafts</h3>
          <p>Generate draft replies inside your Gmail account. AI reads previous email history to construct a highly context-aware response.</p>
        </div>
      </div>
    </section>
  );
}
