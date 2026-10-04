import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import { Alert, ConfirmDialog } from '../../components/ui.jsx';
import { STATUS_LABEL, admin } from './useAdmin.js';

export function StatusBadge({ status = 'rascunho' }) {
  const icon = { rascunho: 'edit', revisado: 'eye', publicado: 'check' }[status];
  return (
    <span className={`badge status-${status}`}>
      <Icon name={icon} size={14} /> {STATUS_LABEL[status]}
    </span>
  );
}

export function ErrorDetails({ error }) {
  if (!error) return null;
  return (
    <Alert kind="error">
      {error.message}
      {Array.isArray(error.details) && error.details.length > 0 && (
        <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          {error.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
    </Alert>
  );
}

/** Botões de fluxo editorial: rascunho → revisado → publicado. */
export function StatusActions({ entity, record, onDone, onError }) {
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const status = record.status || 'rascunho';
  const what = entity === 'Unit' ? 'unidade' : 'lição';

  async function apply(next) {
    setBusy(true);
    try {
      await admin('set_status', { entity, id: record.id, status: next });
      setConfirm(null);
      onDone();
    } catch (e) {
      setConfirm(null);
      onError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {status === 'rascunho' && (
        <button className="btn btn-secondary btn-sm" onClick={() => setConfirm('revisado')}>
          Marcar como revisada
        </button>
      )}
      {status === 'revisado' && (
        <>
          <button className="btn btn-primary btn-sm" onClick={() => setConfirm('publicado')}>
            Publicar
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => apply('rascunho')}>
            Voltar para rascunho
          </button>
        </>
      )}
      {status === 'publicado' && (
        <button className="btn btn-ghost btn-sm" onClick={() => setConfirm('rascunho')}>
          Retirar de publicação
        </button>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm === 'revisado' ? `Confirmar revisão da ${what}` : confirm === 'publicado' ? `Publicar ${what}?` : `Retirar ${what} de publicação?`}
          confirmLabel={confirm === 'revisado' ? 'Confirmo a revisão' : confirm === 'publicado' ? 'Publicar' : 'Retirar'}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => apply(confirm)}
        >
          {confirm === 'revisado' && (
            <p>
              Confirme que o conteúdo foi revisado quanto à precisão bíblica, ao contexto histórico, à identificação de interpretações e tradições e à ausência de citações literais não licenciadas. Seu e-mail ficará registrado como revisor.
            </p>
          )}
          {confirm === 'publicado' && <p>{entity === 'Unit' ? 'A unidade ficará visível na jornada. Lições só aparecem se também estiverem publicadas.' : 'A lição ficará visível para estudantes (se a unidade estiver publicada).'}</p>}
          {confirm === 'rascunho' && <p>O conteúdo deixará de aparecer para estudantes. O progresso já registrado é mantido.</p>}
        </ConfirmDialog>
      )}
    </>
  );
}

export function MoveButtons({ index, total, onMove, label }) {
  return (
    <span className="row" style={{ gap: 0 }}>
      <button className="icon-btn" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`Mover ${label} para cima`}>
        <Icon name="up" />
      </button>
      <button className="icon-btn" disabled={index === total - 1} onClick={() => onMove(index, 1)} aria-label={`Mover ${label} para baixo`}>
        <Icon name="down" />
      </button>
    </span>
  );
}
