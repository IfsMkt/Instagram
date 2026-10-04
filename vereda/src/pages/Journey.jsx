import { Link } from 'react-router-dom';
import Icon, { UNIT_ICONS } from '../components/Icon.jsx';
import { ErrorState, Loading, Empty } from '../components/ui.jsx';
import { useApp } from '../state/AppState.jsx';

const STATE_TEXT = { concluida: 'Concluída', disponivel: 'Disponível', bloqueada: 'Bloqueada' };

function Node({ item, index }) {
  const { lesson, state } = item;
  const isReview = lesson.kind === 'revisao_unidade';
  const icon = state === 'concluida' ? 'check' : state === 'bloqueada' ? 'lock' : isReview ? 'review' : 'star';
  const cls = `node ${state === 'disponivel' ? 'available' : state === 'bloqueada' ? 'locked' : 'done'}${isReview ? ' review-node' : ''}`;
  const label = `${isReview ? 'Revisão final' : `Lição ${index + 1}`}: ${lesson.title} — ${STATE_TEXT[state]}`;
  return (
    <div className="node-wrap">
      {state === 'bloqueada' ? (
        <span className={cls} role="img" aria-label={label}>
          <Icon name={icon} size={30} />
        </span>
      ) : (
        <Link className={cls} to={`/licao/${lesson.id}`} aria-label={`${label}${state === 'concluida' ? ' (repetir)' : ''}`}>
          <Icon name={icon} size={30} strokeWidth={2.4} />
        </Link>
      )}
      <div className="node-label" aria-hidden="true">
        {lesson.title}
        <small>
          {isReview ? 'Revisão final · ' : ''}
          {STATE_TEXT[state]}
        </small>
      </div>
    </div>
  );
}

export default function Journey() {
  const app = useApp();
  if (app.data.status === 'loading' || app.data.status === 'idle') return <Loading />;
  if (app.data.status === 'error') return <ErrorState error={app.data.error} onRetry={app.reloadData} />;
  const { journey } = app;
  if (!journey.length)
    return <Empty title="A jornada está sendo preparada">As unidades aparecerão aqui depois da revisão editorial.</Empty>;

  return (
    <div>
      <div className="page-header">
        <h1>Jornada</h1>
      </div>
      {journey.map((u, ui) => (
        <section key={u.unit.id} aria-labelledby={`unit-${u.unit.id}`}>
          <div className={`unit-card${u.comingSoon ? ' soon' : ''}`} style={{ marginTop: ui ? 10 : 0 }}>
            <div className="row spread">
              <div className="eyebrow">Unidade {ui + 1}</div>
              {u.comingSoon ? (
                <span className="badge">Em breve</span>
              ) : u.completed ? (
                <span className="badge gold">
                  <Icon name="check" size={14} /> Concluída
                </span>
              ) : (
                <span className="badge sage">
                  {u.completedCount}/{u.total}
                </span>
              )}
            </div>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ marginTop: 4 }}>
                <Icon name={UNIT_ICONS[u.unit.icon] || 'book'} size={26} />
              </span>
              <div>
                <h2 id={`unit-${u.unit.id}`}>{u.unit.title}</h2>
                <p>{u.unit.description}</p>
              </div>
            </div>
          </div>
          {u.comingSoon ? (
            <p className="small muted center" style={{ margin: '10px 0 18px' }}>
              Lições em preparação. Esta unidade ainda não tem conteúdo disponível.
            </p>
          ) : (
            <ol className="path" aria-label={`Etapas da unidade ${u.unit.title}`}>
              {u.lessons.map((item, i) => (
                <li key={item.lesson.id}>
                  <Node item={item} index={i} />
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  );
}
