import { Calendar, FileText, Paperclip, Tag } from 'lucide-react';
import CategoryBadge from './CategoryBadge.jsx';

export default function EmailDetail({ message }) {
  const category = message.email_categories?.[0]?.category;

  const getAvatarColor = (name) => {
    if (!name) return '#6366F1';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#EC4899', '#3B82F6', '#10B981', '#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444'];
    return colors[Math.abs(hash) % colors.length];
  };

  const senderInitial = (message.sender_name || message.sender_email || 'U')[0].toUpperCase();
  const avatarBg = getAvatarColor(message.sender_name || message.sender_email);

  return (
    <article className="detail-panel">
      <div className="detail-header">
        <div className="detail-sender-row">
          <div 
            className="avatar" 
            style={{ 
              backgroundColor: avatarBg, 
              border: 'none', 
              color: '#ffffff', 
              fontWeight: '800',
              width: '48px',
              height: '48px',
              fontSize: '18px'
            }}
          >
            {senderInitial}
          </div>
          <div className="detail-sender-info">
            <h1 style={{ fontSize: '24px', margin: 0, background: 'none', WebkitTextFillColor: 'initial' }}>
              {message.subject || '(No subject)'}
            </h1>
            <p>
              From: <strong style={{ color: 'var(--text-primary)' }}>{message.sender_name || 'Unknown sender'}</strong> 
              {message.sender_email ? ` <${message.sender_email}>` : ''}
            </p>
          </div>
        </div>
        <CategoryBadge category={category} />
      </div>

      <div className="metadata-grid">
        <div className="metadata-item">
          <Calendar size={14} style={{ color: 'var(--text-tertiary)' }} />
          <dt>Date:</dt>
          <dd>{formatDate(message.internal_date)}</dd>
        </div>
        <div className="metadata-item">
          <FileText size={14} style={{ color: 'var(--text-tertiary)' }} />
          <dt>Gmail ID:</dt>
          <dd style={{ fontFamily: 'monospace' }}>{message.gmail_message_id}</dd>
        </div>
        <div className="metadata-item">
          <Paperclip size={14} style={{ color: 'var(--text-tertiary)' }} />
          <dt>Attachments:</dt>
          <dd>{message.has_attachments ? 'Yes' : 'No'}</dd>
        </div>
      </div>

      <div className="email-body">
        {message.body_text || message.snippet || 'No body text available.'}
      </div>
    </article>
  );
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '';
}
