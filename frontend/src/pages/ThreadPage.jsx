import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Sparkles, ArrowLeft, Loader2, Send, CheckCircle, HelpCircle } from 'lucide-react';
import { summarizeThread } from '../api/aiApi.js';
import { createReplyDraft, getThread, sendReplyDraft } from '../api/gmailApi.js';
import DraftEditor from '../components/DraftEditor.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import SummaryBox from '../components/SummaryBox.jsx';
import ThreadView from '../components/ThreadView.jsx';

export default function ThreadPage() {
  const { threadId } = useParams();
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [instruction, setInstruction] = useState('');
  const [draft, setDraft] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [workingType, setWorkingType] = useState(''); // 'summary', 'draft', or 'send'
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await getThread(threadId);
      setThread(data.thread);
      setMessages(data.messages || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function runSummary() {
    setWorking(true);
    setWorkingType('summary');
    setError(null);
    try {
      const data = await summarizeThread(threadId);
      setSummary(data.summary);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
      setWorkingType('');
    }
  }

  async function runReplyDraft() {
    if (!instruction.trim()) {
      setError('Please provide reply drafting instructions first.');
      return;
    }
    setWorking(true);
    setWorkingType('draft');
    setError(null);
    try {
      const selectedMessage = messages[messages.length - 1];
      const data = await createReplyDraft({
        threadId,
        messageId: selectedMessage?.id,
        instruction
      });
      setDraft(data.draft);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
      setWorkingType('');
    }
  }

  async function sendDraft() {
    if (!draft) return;
    setWorking(true);
    setWorkingType('send');
    setError(null);
    try {
      await sendReplyDraft({
        draftId: draft.id,
        subject: draft.subject,
        body: draft.body
      });
      setDraft({ ...draft, status: 'sent' });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
      setWorkingType('');
    }
  }

  useEffect(() => {
    load();
  }, [threadId]);

  return (
    <section className="page" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link className="text-link" to="/inbox" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={16} /> Back to Inbox
        </Link>
        {thread ? (
          <button 
            className="primary-button" 
            type="button" 
            onClick={runSummary} 
            disabled={working}
            style={{ height: '36px' }}
          >
            {working && workingType === 'summary' ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            {working && workingType === 'summary' ? 'Synthesizing...' : 'Summarize Thread'}
          </button>
        ) : null}
      </div>

      <ErrorState message={error} />

      {loading ? (
        <LoadingState label="Fetching thread messages timeline" />
      ) : thread ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {summary ? (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
              <SummaryBox title="AI Conversation Summary" summary={summary} />
            </div>
          ) : null}

          <ThreadView thread={thread} messages={messages} />

          <section className="compose-panel" style={{ marginTop: '16px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', margin: 0 }}>
              <Sparkles size={18} style={{ color: 'var(--brand-color)' }} />
              Draft Reply with AI Assistance
            </h2>
            <p style={{ margin: '4px 0 12px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Describe what you want to say in your reply. The AI will read the thread context to draft a tailored response.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea 
                rows={4} 
                value={instruction} 
                onChange={(event) => setInstruction(event.target.value)} 
                placeholder="Example: Agree to the proposal and suggest meeting this Friday at 2 PM to finalize..." 
                style={{ borderRadius: 'var(--radius-md)' }}
              />
              
              <button 
                className="primary-button" 
                type="button" 
                onClick={runReplyDraft} 
                disabled={working || !instruction.trim()}
                style={{ alignSelf: 'flex-start' }}
              >
                {working && workingType === 'draft' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Sparkles size={16} />
                )}
                {working && workingType === 'draft' ? 'Drafting response...' : 'Generate Context-Aware Draft'}
              </button>
            </div>

            <DraftEditor draft={draft} onChange={setDraft} />

            {draft?.status === 'draft' ? (
              <button 
                className="danger-button" 
                type="button" 
                onClick={sendDraft} 
                disabled={working}
                style={{ width: '100%', height: '46px', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}
              >
                {working && workingType === 'send' ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <Send size={16} />
                )}
                {working && workingType === 'send' ? 'Sending draft...' : 'Approve & Send Email Reply'}
              </button>
            ) : draft?.status === 'sent' ? (
              <div 
                className="state" 
                style={{ 
                  marginTop: '24px', 
                  minHeight: '80px', 
                  background: 'var(--success-soft)', 
                  color: 'var(--success-color)', 
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '12px',
                  justifyContent: 'center',
                  padding: '16px 24px'
                }}
              >
                <CheckCircle size={20} />
                <span style={{ fontWeight: '600' }}>Reply sent successfully via Google Mail!</span>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <ErrorState message="Could not retrieve conversation thread messages." />
      )}
    </section>
  );
}
