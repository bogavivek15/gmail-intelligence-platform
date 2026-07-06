import { Edit3, FileText, Mail } from 'lucide-react';

export default function DraftEditor({ draft, onChange }) {
  if (!draft) {
    return null;
  }

  return (
    <section className="draft-editor">
      <div className="draft-editor-header">
        <Edit3 size={16} />
        Review & Refine AI Draft
      </div>

      {draft.draft_type === 'compose' ? (
        <div className="draft-field">
          <label>
            <Mail size={14} /> To Recipient
          </label>
          <input
            type="email"
            value={draft.to_email || ''}
            onChange={(event) => onChange?.({ ...draft, to_email: event.target.value })}
            placeholder="recipient@example.com"
            required
          />
        </div>
      ) : null}

      <div className="draft-field">
        <label>
          <FileText size={14} /> Subject
        </label>
        <input
          type="text"
          value={draft.subject || ''}
          onChange={(event) => onChange?.({ ...draft, subject: event.target.value })}
          placeholder="Email subject line"
        />
      </div>

      <div className="draft-field">
        <label>
          <Edit3 size={14} /> Email Body
        </label>
        <textarea
          rows={10}
          value={draft.body || ''}
          onChange={(event) => onChange?.({ ...draft, body: event.target.value })}
          placeholder="Email text body content..."
        />
        <div style={{ alignSelf: 'flex-end', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          {draft.body?.length || 0} characters
        </div>
      </div>
    </section>
  );
}
