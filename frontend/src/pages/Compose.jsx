import { useState } from 'react';
import { Sparkles, Loader2, Send, CheckCircle, PenSquare } from 'lucide-react';
import { composeDraft } from '../api/aiApi.js';
import { sendComposedDraft } from '../api/gmailApi.js';
import DraftEditor from '../components/DraftEditor.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function Compose() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(''); // 'compose' or 'send'
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide drafting instructions first.');
      return;
    }
    setLoading(true);
    setLoadingType('compose');
    setError(null);

    try {
      const data = await composeDraft({ prompt, tone });
      setDraft(data.draft);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  }

  async function sendDraft() {
    if (!draft) return;
    if (draft.draft_type === 'compose' && !draft.to_email?.trim()) {
      setError('Please provide a recipient email address before sending.');
      return;
    }
    setLoading(true);
    setLoadingType('send');
    setError(null);
    try {
      await sendComposedDraft({
        draftId: draft.id,
        to_email: draft.to_email,
        subject: draft.subject,
        body: draft.body
      });
      setDraft({ ...draft, status: 'sent' });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  }

  return (
    <section className="page" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} /> Google API Sandbox
          </span>
          <h1 style={{ margin: '4px 0 0 0' }}>Compose AI Draft</h1>
          <p style={{ margin: '4px 0 0 0' }}>Drafts are generated and saved instantly to your Gmail draft folders for manual approval.</p>
        </div>
      </div>

      <ErrorState message={error} />

      <div style={{ display: 'grid', gridTemplateColumns: draft ? '1fr 1.2fr' : '1fr', gap: '32px', alignItems: 'start' }}>
        {/* Left Side: Draft Form details */}
        <form className="compose-panel" onSubmit={submit} style={{ gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Drafting Instruction
            </label>
            <textarea 
              rows={6} 
              value={prompt} 
              onChange={(event) => setPrompt(event.target.value)} 
              placeholder="Describe the email you want to write (e.g. Write a project proposal update to Vivek bogavivek15@gmail.com, mentioning that we completed all milestones ahead of schedule)..." 
              style={{ borderRadius: 'var(--radius-md)' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              Select Conversation Tone
            </label>
            <div className="tone-selector">
              {['professional', 'friendly', 'concise'].map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`tone-pill ${tone === item ? 'active' : ''}`}
                  onClick={() => setTone(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="primary-button" 
            type="submit" 
            disabled={loading || !prompt.trim()}
            style={{ height: '46px', alignSelf: 'flex-start' }}
          >
            {loading && loadingType === 'compose' ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            {loading && loadingType === 'compose' ? 'Synthesizing...' : 'Generate AI Draft'}
          </button>
        </form>

        {/* Right Side: Draft preview visual card wrapper */}
        {draft ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'scaleIn 0.3s ease-out' }}>
            <DraftEditor draft={draft} onChange={setDraft} />

            {draft.status === 'draft' ? (
              <button 
                className="danger-button" 
                type="button" 
                onClick={sendDraft} 
                disabled={loading}
                style={{ height: '46px', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '15px' }}
              >
                {loading && loadingType === 'send' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {loading && loadingType === 'send' ? 'Sending email...' : 'Approve & Send Draft'}
              </button>
            ) : draft.status === 'sent' ? (
              <div 
                className="state" 
                style={{ 
                  minHeight: '80px', 
                  background: 'var(--success-soft)', 
                  color: 'var(--success-color)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '12px',
                  justifyContent: 'center',
                  padding: '16px 24px',
                  marginTop: '0px'
                }}
              >
                <CheckCircle size={20} />
                <span style={{ fontWeight: '600' }}>Email draft sent successfully via Google Mail!</span>
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty visual panel showing placeholder hints when no draft exists */
          <div className="state state-empty" style={{ minHeight: '340px', justifyContent: 'center', display: 'flex', flexFlow: 'column', alignItems: 'center' }}>
            <div className="state-empty-icon">
              <PenSquare size={24} />
            </div>
            <strong>AI Editor Preview</strong>
            <span style={{ maxWidth: '300px' }}>Your generated draft output layout, recipient email, subject headers, and body will render here.</span>
          </div>
        )}
      </div>
    </section>
  );
}
