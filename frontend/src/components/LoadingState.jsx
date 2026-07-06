import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'Loading intelligence' }) {
  return (
    <div className="state state-loading animate-pulse" aria-live="polite">
      <Loader2 className="animate-spin text-brand" size={32} style={{ color: 'var(--brand-color)' }} />
      <span style={{ fontSize: '15px', fontWeight: '500' }}>{label}...</span>
    </div>
  );
}
