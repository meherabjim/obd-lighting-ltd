export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner-dot" /><span className="spinner-dot" /><span className="spinner-dot" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {hint ? <p className="empty-hint">{hint}</p> : null}
      {action}
    </div>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="error-note" role="alert">
      <span>{typeof error === 'string' ? error : error.message}</span>
      {onRetry ? <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>Try again</button> : null}
    </div>
  );
}
