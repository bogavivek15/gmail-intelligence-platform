import { useState } from 'react';
import { MessageSquare, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function ThreadView({ thread, messages }) {
  // Store collapsed state per message index/ID to handle long conversation threads elegantly
  const [collapsedMessages, setCollapsedMessages] = useState(
    messages.reduce((acc, msg, idx) => {
      // Keep only the latest message expanded by default
      acc[msg.id] = idx < messages.length - 1;
      return acc;
    }, {})
  );

  const toggleCollapse = (id) => {
    setCollapsedMessages((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getAvatarColor = (name) => {
    if (!name) return '#6366F1';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444'];
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <section className="thread-view">
      <div className="detail-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{ background: 'var(--brand-soft)', color: 'var(--brand-color)', border: 'none' }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', margin: 0, background: 'none', WebkitTextFillColor: 'initial' }}>
              {thread.subject || '(No subject)'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '13.5px' }}>{messages.length} message(s) in this thread</p>
          </div>
        </div>
      </div>

      {thread.thread_summary ? (
        <div className="summary-inline">
          <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--brand-color)' }}>AI Thread Context:</strong>
          {thread.thread_summary}
        </div>
      ) : null}

      <div className="thread-messages">
        {messages.map((message) => {
          const isCollapsed = collapsedMessages[message.id];
          const senderInitial = (message.sender_name || message.sender_email || 'U')[0].toUpperCase();
          const avatarBg = getAvatarColor(message.sender_name || message.sender_email);

          return (
            <article className="thread-message" key={message.id}>
              <div 
                className="thread-message-header" 
                onClick={() => toggleCollapse(message.id)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div className="thread-message-sender">
                  <div 
                    className="avatar" 
                    style={{ 
                      backgroundColor: avatarBg, 
                      border: 'none', 
                      color: '#ffffff', 
                      width: '32px', 
                      height: '32px', 
                      fontSize: '12px' 
                    }}
                  >
                    {senderInitial}
                  </div>
                  <div>
                    <span className="thread-message-sender-name">{message.sender_name || message.sender_email}</span>
                    <div className="thread-message-date">
                      <Clock size={10} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {message.internal_date ? new Date(message.internal_date).toLocaleString() : ''}
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
              </div>

              {!isCollapsed ? (
                <p style={{ margin: '12px 0 0 0', fontSize: '14.5px', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
                  {message.body_text || message.snippet || 'No body text available.'}
                </p>
              ) : (
                <p 
                  onClick={() => toggleCollapse(message.id)}
                  style={{ 
                    margin: '8px 0 0 0', 
                    fontSize: '13px', 
                    color: 'var(--text-tertiary)', 
                    cursor: 'pointer', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis' 
                  }}
                >
                  {message.snippet || message.body_text?.slice(0, 100)}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
