import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import Mascot from './Mascot.jsx';

export function Loading({ label = 'Carregando…' }) {
  return (
    <div className="state" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="muted">{label}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Algo não saiu como esperado' }) {
  return (
    <div className="state" role="alert">
      <Mascot size={80} mood="pensativa" />
      <h2>{title}</h2>
      <p className="muted">{error?.message || 'Tente novamente em instantes.'}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="state">
      <Mascot size={80} />
      <h2>{title}</h2>
      {children && <div className="muted">{children}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function Progress({ value, label, gold }) {
  const pct = Math.round(Math.max(0, Math.min(1, value || 0)) * 100);
  return (
    <div className={`progress${gold ? ' gold' : ''}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Alert({ kind = 'info', children }) {
  const icon = { error: 'alert', warn: 'alert', info: 'info' }[kind];
  return (
    <div className={`alert ${kind}`} role={kind === 'error' ? 'alert' : undefined}>
      <Icon name={icon} size={20} />
      <div>{children}</div>
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled }) {
  return (
    <span className="row">
      <span className="switch-text" aria-hidden="true">
        {checked ? 'Ligado' : 'Desligado'}
      </span>
      <button type="button" role="switch" className="switch" aria-checked={!!checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} />
    </span>
  );
}

/** Diálogo modal acessível (foco inicial, Esc fecha, foco retorna ao fechar). */
export function Dialog({ title, onClose, children, labelledBy = 'dialog-title' }) {
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement;
    const el = ref.current;
    const focusable = el?.querySelector('input, textarea, select, button:not([data-close])') || el;
    focusable?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab' && el) {
        const items = [...el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) (e.preventDefault(), lastEl.focus());
        else if (!e.shiftKey && document.activeElement === lastEl) (e.preventDefault(), firstEl.focus());
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={labelledBy} ref={ref} tabIndex={-1}>
        <div className="row spread" style={{ marginBottom: 8 }}>
          <h2 id={labelledBy} style={{ margin: 0 }}>
            {title}
          </h2>
          <button className="icon-btn" data-close onClick={onClose} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, children, confirmLabel = 'Confirmar', danger, onConfirm, onCancel, busy, disabled }) {
  return (
    <Dialog title={title} onClose={onCancel}>
      <div className="stack">
        <div>{children}</div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>
            Cancelar
          </button>
          <button className={`btn btn-sm ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy || disabled}>
            {busy ? 'Aguarde…' : confirmLabel}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
