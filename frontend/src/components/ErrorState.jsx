import { AlertTriangle } from 'lucide-react';

export default function ErrorState({ message }) {
  if (!message) {
    return null;
  }

  return (
    <div className="state state-error" role="alert">
      <AlertTriangle size={20} style={{ color: 'var(--danger-color)' }} />
      <span style={{ fontSize: '14.5px', fontWeight: '600' }}>{message}</span>
    </div>
  );
}
