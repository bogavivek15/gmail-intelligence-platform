import { useState } from 'react';
import { Search, RefreshCw, Sparkles } from 'lucide-react';
import EmailList from '../components/EmailList.jsx';
import ErrorState from '../components/ErrorState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import { useEmails } from '../hooks/useEmails.js';

const categories = [
  { value: '', label: 'All Mail' },
  { value: 'Work / Professional', label: 'Work' },
  { value: 'Personal', label: 'Personal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Job / Recruitment', label: 'Recruitment' },
  { value: 'Newsletters', label: 'Newsletters' },
  { value: 'Notifications', label: 'Notifications' }
];

export default function Inbox() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const { messages, count, loading, error, reload } = useEmails({ limit: 25, search, category });

  return (
    <section className="page" style={{ animation: 'scaleIn 0.3s ease-out' }}>
      <div className="page-header">
        <div>
          <span className="eyebrow">Smart Mailbox</span>
          <h1 style={{ margin: '4px 0 0 0' }}>Inbox Workspace</h1>
          <p style={{ margin: '4px 0 0 0' }}>{count} message(s) index matches your current filters</p>
        </div>
        <button 
          className="secondary-button" 
          type="button" 
          onClick={reload}
          style={{ height: '40px' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
        {/* Search input field with embedded icon */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search 
            size={18} 
            style={{ 
              position: 'absolute', 
              left: '16px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--text-tertiary)' 
            }} 
          />
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Search matching sender name, email header, subject line, or body snippet..." 
            style={{ paddingLeft: '48px', height: '48px', borderRadius: 'var(--radius-md)' }}
          />
        </div>

        {/* Horizontal scrollable category pills list */}
        <div 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            overflowX: 'auto', 
            paddingBottom: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          {categories.map((item) => (
            <button
              key={item.value || 'all'}
              type="button"
              className={`tone-pill ${category === item.value ? 'active' : ''}`}
              onClick={() => setCategory(item.value)}
              style={{ border: '1px solid var(--border-color)', margin: 0 }}
            >
              {item.value ? <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> : null}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorState message={error} />
      
      {loading ? (
        <LoadingState label="Searching and rendering emails" />
      ) : (
        <EmailList messages={messages} />
      )}
    </section>
  );
}
