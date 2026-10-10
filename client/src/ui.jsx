import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Icon from './icons.jsx';

/* ---------- helpers ---------- */
export function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const mo = Math.floor(days / 30);
  if (mo < 12) return `${mo} mo ago`;
  return `${Math.floor(mo / 12)} yr ago`;
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || '?';

export function useDocTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Campus Lost & Found` : 'Campus Lost & Found';
  }, [title]);
}

/* ---------- toast + confirm ---------- */
const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const idRef = useRef(0);

  const toast = useCallback((message, kind = 'success') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    []
  );

  const close = (v) => {
    dialog.resolve(v);
    setDialog(null);
  };

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <UICtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon name={t.kind === 'error' ? 'alert' : 'checkCircle'} size={18} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true">
            <div className={`dialog-icon ${dialog.danger ? 'danger' : ''}`}>
              <Icon name={dialog.danger ? 'trash' : 'info'} size={22} />
            </div>
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="dialog-actions">
              <button className="btn btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button className={`btn ${dialog.danger ? 'btn-danger' : 'btn-primary'}`} autoFocus onClick={() => close(true)}>
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UICtx.Provider>
  );
}

/* ---------- small pieces ---------- */
export function Spinner() {
  return <span className="spinner" aria-label="Loading" />;
}

export function Avatar({ name, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}

export function TypeBadge({ type }) {
  return (
    <span className={`badge ${type}`}>
      <span className="dot" />
      {type === 'lost' ? 'Lost' : 'Found'}
    </span>
  );
}

export function StatusBadge({ status }) {
  return status === 'resolved' ? (
    <span className="badge resolved"><Icon name="check" size={12} strokeWidth={3} /> Resolved</span>
  ) : (
    <span className="badge open">Open</span>
  );
}

export function Alert({ children, kind = 'error', onClose }) {
  if (!children) return null;
  return (
    <div className={`alert ${kind}`} role="alert">
      <Icon name={kind === 'error' ? 'alert' : 'info'} size={18} />
      <span>{children}</span>
      {onClose && <button onClick={onClose} aria-label="Dismiss"><Icon name="x" size={16} /></button>}
    </div>
  );
}

export function Empty({ icon = 'search', title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function CardSkeletons({ n = 6 }) {
  return (
    <div className="grid">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card item-card skeleton-card">
          <div className="sk sk-img" />
          <div className="card-body">
            <div className="sk sk-line w60" />
            <div className="sk sk-line w90" />
            <div className="sk sk-line w40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return <div className="page-loader"><Spinner /></div>;
}
