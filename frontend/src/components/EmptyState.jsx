import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No content found', detail = 'Sync database or try another search filter.' }) {
  return (
    <div className="state state-empty">
      <div className="state-empty-icon">
        <Inbox size={24} />
      </div>
      <strong>{title}</strong>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
