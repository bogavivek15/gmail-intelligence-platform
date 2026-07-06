import { Inbox, KeyRound, MessageSquare, RefreshCcw, Sparkles, ArrowRight, MessageCircle, PenSquare, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { startGoogleLogin } from '../api/authApi.js';
import { getSyncStatus, syncGmail, getMessages } from '../api/gmailApi.js';
import { useAuth } from '../hooks/useAuth.js';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import CategoryBadge from '../components/CategoryBadge.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  console.log('Dashboard - user data:', user);
  
  const [status, setStatus] = useState(null);
  const [recentEmails, setRecentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);

  async function loadStatus() {
    setError(null);
    setErrorCode(null);
    try {
      const data = await getSyncStatus();
      setStatus(data);
      
      // Fetch latest 3 synced messages for the dashboard activity feed
      const emailsData = await getMessages({ limit: 3 });
      setRecentEmails(emailsData.messages || []);

      if (data?.state?.sync_status === 'running') {
        setSyncing(true);
        const processed = data?.state?.processed_items || 0;
        const total = data?.state?.total_items || 0;
        setSyncMessage(total > 0 ? `Syncing messages (${processed} of ${total} parsed)...` : 'Initializing email ingestion sync...');
      } else {
        setSyncing(false);
        setSyncMessage('');
      }
    } catch (requestError) {
      setError(requestError.message);
      setErrorCode(requestError.code || null);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage('Establishing Google API connection...');
    setError(null);
    setErrorCode(null);
    try {
      await syncGmail(50);
      setTimeout(loadStatus, 500);
    } catch (requestError) {
      setError(requestError.message);
      setErrorCode(requestError.code || null);
      setSyncing(false);
      setSyncMessage('');
    }
  }

  // Poll status while background sync runs
  useEffect(() => {
    let intervalId;
    if (syncing) {
      intervalId = setInterval(async () => {
        try {
          const data = await getSyncStatus();
          setStatus(data);
          const state = data?.state?.sync_status;
          
          if (state === 'running') {
            const processed = data?.state?.processed_items || 0;
            const total = data?.state?.total_items || 0;
            setSyncMessage(total > 0 ? `Syncing messages (${processed} of ${total} parsed)...` : 'Parsing inbox structure...');
          } else {
            setSyncing(false);
            setSyncMessage('');
            clearInterval(intervalId);
            // Refresh activity feed once completed
            const emailsData = await getMessages({ limit: 3 });
            setRecentEmails(emailsData.messages || []);
          }
        } catch (pollError) {
          console.error('Error polling sync status:', pollError);
        }
      }, 2000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [syncing]);

  useEffect(() => {
    setLoading(true);
    loadStatus().finally(() => setLoading(false));
  }, []);

  const progressPercent = status?.state?.total_items > 0 
    ? Math.round((status.state.processed_items / status.state.total_items) * 100)
    : 0;

  return (
    <section className="page" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow" style={{ display: 'inline-block' }}>Workspace overview</span>
          <h1 style={{ margin: '4px 0 0 0', background: 'none', WebkitTextFillColor: 'initial', color: 'var(--text-primary)' }}>
            Welcome back, {user?.name || 'User'}
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-tertiary)' }}>
            Inbox Sync status active for <strong style={{ color: 'var(--text-secondary)' }}>{user?.google_email}</strong>
          </p>
        </div>
        <button className="primary-button" type="button" onClick={handleSync} disabled={syncing}>
          <RefreshCcw className={syncing ? "animate-spin" : ""} size={16} />
          {syncing ? 'Syncing Inbox' : 'Sync Gmail'}
        </button>
      </div>

      <ErrorState message={error} />

      {errorCode === 'GMAIL_SCOPES_MISSING' ? (
        <div style={{ marginBottom: '24px' }}>
          <button className="secondary-button" type="button" onClick={startGoogleLogin}>
            <KeyRound size={16} />
            Reauthorize Gmail Connection
          </button>
        </div>
      ) : null}

      {syncing ? (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '32px', borderLeft: '4px solid var(--brand-start)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--brand-start)' }}>
              {syncMessage}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {progressPercent}%
            </span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      ) : null}

      {loading ? <LoadingState label="Recalculating workspace counts" /> : (
        <>
          <div className="metric-grid">
            <Metric 
              icon={<Inbox size={18} />} 
              label="Synced Emails" 
              value={status?.counts?.messages || 0} 
            />
            <Metric 
              icon={<MessageSquare size={18} />} 
              label="Active Threads" 
              value={status?.counts?.threads || 0} 
            />
            <Metric 
              icon={<Sparkles size={18} />} 
              label="Categorized" 
              value={status?.counts?.categories || 0} 
            />
            <Metric 
              icon={<Sparkles size={18} />} 
              label="AI Summaries" 
              value={status?.counts?.summaries || 0} 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', margin: '40px 0 0 0', alignItems: 'start' }}>
            {/* Left Side: Recent Activity Feed */}
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: 'var(--brand-start)' }} />
                Recent Synced Activity
              </h2>
              {recentEmails.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentEmails.map((email) => {
                    const category = email.email_categories?.[0]?.category;
                    return (
                      <Link 
                        key={email.id} 
                        to={`/emails/${email.id}`} 
                        className="email-card"
                        style={{ padding: '14px 18px', gridTemplateColumns: 'minmax(0, 1fr) auto' }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                            {email.sender_name || email.sender_email}
                          </span>
                          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {email.subject || '(No subject)'}
                          </strong>
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                            {email.snippet}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                          <CategoryBadge category={category} />
                        </div>
                      </Link>
                    );
                  })}
                  <Link 
                    to="/inbox" 
                    className="text-link" 
                    style={{ fontSize: '13px', alignSelf: 'flex-start', marginTop: '8px' }}
                  >
                    View all synced emails <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="state state-empty" style={{ minHeight: '140px' }}>
                  <span style={{ fontSize: '13px' }}>No synced emails. Start sync to populate activity feed.</span>
                </div>
              )}
            </div>

            {/* Right Side: Quick Action Panel list */}
            <div>
              <h2 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} style={{ color: 'var(--brand-start)' }} />
                Workspace Actions
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Link className="action-link" to="/inbox" style={{ padding: '16px 20px' }}>
                  <div className="action-link-content">
                    <div className="action-icon" style={{ width: '36px', height: '36px' }}><Inbox size={16} /></div>
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: '700' }}>Inbox Explorer</span>
                      <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                        Read synced emails and trigger AI runs
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                <Link className="action-link" to="/chat" style={{ padding: '16px 20px' }}>
                  <div className="action-link-content">
                    <div className="action-icon" style={{ width: '36px', height: '36px' }}><MessageCircle size={16} /></div>
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: '700' }}>Mail Knowledge Chat</span>
                      <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                        Ask AI over your secure vector indexes
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>

                <Link className="action-link" to="/compose" style={{ padding: '16px 20px' }}>
                  <div className="action-link-content">
                    <div className="action-icon" style={{ width: '36px', height: '36px' }}><PenSquare size={16} /></div>
                    <div>
                      <span style={{ display: 'block', fontSize: '14px', fontWeight: '700' }}>Compose AI Assistant</span>
                      <p style={{ margin: '1px 0 0 0', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                        Draft instant replies and send drafts
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      <div className="metric-icon-wrapper">
        {icon}
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
