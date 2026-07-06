import { Send, Sparkles, AlertTriangle, ShieldCheck, Mail } from 'lucide-react';
import { useState } from 'react';
import { sendChatMessage } from '../api/chatApi.js';
import ChatBox from '../components/ChatBox.jsx';
import ErrorState from '../components/ErrorState.jsx';

const PRESET_QUERIES = [
  "Do I have any urgent action items this week?",
  "What is the status of the final project proposal?",
  "List emails that require immediate response or follow-up."
];

export default function Chat() {
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function triggerSearch(queryText) {
    if (!queryText.trim() || loading) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const data = await sendChatMessage({ sessionId, message: queryText });
      setSessionId(data.session.id);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources
        }
      ]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    const query = input;
    setInput('');
    await triggerSearch(query);
  }

  return (
    <section className="page" style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 160px)', animation: 'scaleIn 0.3s ease-out' }}>
      <div className="page-header" style={{ marginBottom: '16px', paddingBottom: '16px' }}>
        <div>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={12} /> Semantic RAG Engine
          </span>
          <h1 style={{ margin: '4px 0 0 0' }}>Chat Assistant</h1>
          <p style={{ margin: '4px 0 0 0' }}>Answers are derived strictly from your synced emails.</p>
        </div>
      </div>

      <ErrorState message={error} />

      {messages.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', textAlign: 'center' }}>
          <div className="avatar" style={{ width: '56px', height: '56px', background: 'var(--brand-soft)', color: 'var(--brand-color)', border: 'none', marginBottom: '16px' }}>
            <Sparkles size={24} />
          </div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Ask Email Knowledge Base</h2>
          <p style={{ maxWidth: '440px', fontSize: '14px', margin: '0 0 32px 0', color: 'var(--text-secondary)' }}>
            Search across synced emails using natural language. The AI will pull matching message chunks and synthesize a hallucination-free response with citations.
          </p>

          <div style={{ width: '100%', maxWidth: '500px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-tertiary)', display: 'block', marginBottom: '12px', letterSpacing: '0.05em' }}>
              Suggested Queries
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {PRESET_QUERIES.map((query, index) => (
                <button
                  key={index}
                  type="button"
                  className="action-link"
                  onClick={() => triggerSearch(query)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', background: 'var(--surface-color)', display: 'flex', justifyContent: 'space-between', padding: '14px 20px', fontSize: '13.5px' }}
                >
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{query}</span>
                  <span style={{ color: 'var(--brand-color)', fontWeight: '700' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
          <ChatBox messages={messages} loading={loading} />
        </div>
      )}

      <form className="chat-form" onSubmit={submit} style={{ marginTop: 'auto' }}>
        <input 
          value={input} 
          onChange={(event) => setInput(event.target.value)} 
          placeholder="Ask a question (e.g. List all action items from bogavivek's emails)..." 
          disabled={loading}
          style={{ height: '46px', borderRadius: 'var(--radius-md)', paddingLeft: '16px' }}
          required
        />
        <button 
          className="primary-button" 
          type="submit" 
          disabled={loading || !input.trim()}
          style={{ height: '46px', width: '100px' }}
        >
          <Send size={16} />
          Send
        </button>
      </form>
    </section>
  );
}
