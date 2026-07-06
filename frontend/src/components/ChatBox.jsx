import { useEffect, useRef } from 'react';
import { Sparkles, User } from 'lucide-react';
import SourceList from './SourceList.jsx';

export default function ChatBox({ messages, loading }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="chat-box" style={{ flex: 1 }}>
      {messages.map((message, index) => {
        const isUser = message.role === 'user';
        return (
          <div 
            key={index} 
            style={{ 
              display: 'flex', 
              gap: '12px', 
              alignSelf: isUser ? 'flex-end' : 'flex-start',
              flexDirection: isUser ? 'row-reverse' : 'row',
              width: '100%',
              maxWidth: '85%'
            }}
          >
            <div className="avatar" style={{ 
              flexShrink: 0, 
              background: isUser ? 'var(--brand-color)' : 'var(--surface-alt)',
              color: '#ffffff'
            }}>
              {isUser ? <User size={16} /> : <Sparkles size={16} />}
            </div>
            <article className={`chat-message chat-message-${message.role}`} style={{ maxWidth: '100%', width: 'auto' }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{message.content}</p>
              <SourceList sources={message.sources} />
            </article>
          </div>
        );
      })}

      {loading ? (
        <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start', width: '100%' }}>
          <div className="avatar" style={{ flexShrink: 0, background: 'var(--surface-alt)', color: '#ffffff' }}>
            <Sparkles size={16} />
          </div>
          <div className="chat-message chat-message-assistant" style={{ width: '80px' }}>
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  );
}
