import { useState } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function SourceList({ sources }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources?.length) {
    return null;
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button 
        type="button" 
        className="source-toggle" 
        onClick={() => setExpanded(!expanded)}
      >
        <FileText size={13} />
        {expanded ? 'Hide sources' : `Show ${sources.length} source email(s)`}
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {expanded ? (
        <div className="source-list">
          {sources.map((source, index) => (
            <article className="source-item" key={`${source.gmail_message_id || source.subject || index}-${index}`}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {source.subject || '(No subject)'}
              </strong>
              <span>
                From: {source.sender || source.sender_email || 'Unknown sender'}
                {source.date ? ` • ${new Date(source.date).toLocaleDateString()}` : ''}
              </span>
              {source.reason_used ? (
                <p><em>Reason: {source.reason_used}</em></p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
