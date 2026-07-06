import { Link } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import CategoryBadge from './CategoryBadge.jsx';

export default function EmailCard({ message }) {
  const category = message.email_categories?.[0]?.category;

  // Generate a consistent color based on the sender name
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
    <article className="email-card">
      <div 
        className="avatar animate-pulse" 
        style={{ backgroundColor: avatarBg, border: 'none', color: '#ffffff', fontWeight: '800' }}
      >
        {senderInitial}
      </div>

      <div className="email-card-main">
        <div className="email-card-header">
          <span className="email-sender">{message.sender_name || message.sender_email || 'Unknown sender'}</span>
        </div>
        <Link className="email-subject" to={`/emails/${message.id}`}>
          {message.subject || '(No subject)'}
        </Link>
        <p className="email-snippet">{message.snippet || message.body_text?.slice(0, 120)}</p>
      </div>

      <div className="email-card-side">
        <span className="email-date">{formatDate(message.internal_date)}</span>
        <CategoryBadge category={category} />
        <Link className="text-link" to={`/threads/${message.thread_id}`} style={{ fontSize: '12px' }}>
          Thread <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const now = new Date();
  
  // If today, show time. Otherwise show short date.
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}
