import { Sparkles, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';

export default function SummaryBox({ title = 'AI Summary', summary }) {
  if (!summary) {
    return null;
  }

  const record = summary.summary || summary.thread_summary || summary.answer || (typeof summary === 'string' ? summary : '');

  // Render text-only strings gracefully
  if (typeof summary === 'string') {
    return (
      <section className="summary-box">
        <div className="summary-box-header">
          <h2><Sparkles size={18} /> {title}</h2>
        </div>
        <div className="summary-box-body">
          <p style={{ margin: 0 }}>{record}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="summary-box">
      <div className="summary-box-header">
        <h2><Sparkles size={20} /> {title}</h2>
      </div>
      <div className="summary-box-body">
        <p style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '500' }}>{record}</p>
      </div>

      {(summary.required_action || summary.urgency || (Array.isArray(summary.next_steps) && summary.next_steps.length)) ? (
        <div className="summary-meta-grid">
          {summary.required_action ? (
            <div className="summary-meta-item">
              <strong><Calendar size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Required Action</strong>
              <span>{summary.required_action}</span>
            </div>
          ) : null}

          {summary.urgency ? (
            <div className="summary-meta-item">
              <strong><AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Urgency</strong>
              <span style={{ color: summary.urgency.toLowerCase() === 'high' ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                {summary.urgency}
              </span>
            </div>
          ) : null}

          {Array.isArray(summary.next_steps) && summary.next_steps.length ? (
            <div className="summary-meta-item" style={{ gridColumn: 'span 2' }}>
              <strong><ArrowRight size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} /> Recommended Next Steps</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '16px', color: 'var(--text-secondary)' }}>
                {summary.next_steps.map((item, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
