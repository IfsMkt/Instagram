// "Vamos lembrar?" — revisão espaçada de questões erradas (1, 3, 7 e 14 dias).
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MascotSays } from '../components/Mascot.jsx';
import Icon from '../components/Icon.jsx';
import { ExerciseView, Feedback, initialResponse, isComplete } from '../components/exercises.jsx';
import { Alert, ErrorState, Loading, Progress } from '../components/ui.jsx';
import { useApp } from '../state/AppState.jsx';
import { backend, newId } from '../api/backend.js';
import { gradeExercise } from '../../base44/shared/engine.js';
import { formatDate, plural } from '../lib/format.js';

const SESSION_SIZE = 10;

function Session({ items, exercises, onFinish, onCancel }) {
  const app = useApp();
  const queue = useMemo(() => items.map((it) => ({ item: it, ex: exercises.find((e) => e.id === it.exercise_id) })).filter((q) => q.ex), [items, exercises]);
  const [idx, setIdx] = useState(0);
  const [responses, setResponses] = useState({});
  const [checked, setChecked] = useState({});
  const [sessionId] = useState(newId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!queue.length)
    return (
      <div className="stack">
        <Alert kind="info">As questões pendentes não estão disponíveis no momento (o conteúdo pode estar em revisão editorial).</Alert>
        <button className="btn btn-secondary btn-block" onClick={onCancel}>
          Voltar
        </button>
      </div>
    );

  const { item, ex } = queue[idx];
  const resp = responses[item.id] ?? initialResponse(ex);
  const isChecked = item.id in checked;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await backend.fn('submit-review', {
        client_session_id: sessionId,
        answers: queue.map((q) => ({ review_item_id: q.item.id, response: responses[q.item.id] })),
      });
      onFinish(res);
    } catch (e) {
      setError(e);
      setSaving(false);
    }
  }

  function primary() {
    if (!isChecked) {
      const ok = gradeExercise(ex, resp);
      setResponses((r) => ({ ...r, [item.id]: resp }));
      setChecked((c) => ({ ...c, [item.id]: ok }));
      app.sound(ok ? 'certo' : 'errado');
      return;
    }
    if (idx < queue.length - 1) setIdx(idx + 1);
    else submit();
  }

  return (
    <div className="stack">
      <div className="row">
        <button className="icon-btn" onClick={onCancel} aria-label="Sair da revisão">
          <Icon name="x" />
        </button>
        <div className="grow">
          <Progress value={(idx + (isChecked ? 1 : 0)) / queue.length} label="Progresso da revisão" />
        </div>
        <span className="small muted" style={{ fontWeight: 800 }}>
          {idx + 1}/{queue.length}
        </span>
      </div>
      <ExerciseView key={item.id} exercise={ex} response={resp} onChange={(r) => setResponses((s) => ({ ...s, [item.id]: r }))} checked={isChecked} />
      {isChecked && <Feedback exercise={ex} correct={checked[item.id]} />}
      {error && <Alert kind="error">Não foi possível salvar a revisão: {error.message}</Alert>}
      <button className="btn btn-primary btn-block" onClick={primary} disabled={saving || (!isChecked && !isComplete(ex, resp))}>
        {!isChecked ? 'Verificar' : idx < queue.length - 1 ? 'Continuar' : saving ? 'Salvando…' : error ? 'Tentar salvar novamente' : 'Concluir revisão'}
      </button>
    </div>
  );
}

export default function Review() {
  const app = useApp();
  const [mode, setMode] = useState('idle'); // idle | loading | session | result
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (app.data.status === 'loading' || app.data.status === 'idle') return <Loading />;
  if (app.data.status === 'error') return <ErrorState error={app.data.error} onRetry={app.reloadData} />;

  const { dueItems, data, today } = app;
  const lessonsById = Object.fromEntries(data.content.lessons.map((l) => [l.id, l]));
  const upcoming = data.reviewItems.filter((i) => i.status === 'ativo' && i.due_date > today).sort((a, b) => a.due_date.localeCompare(b.due_date));
  const mastered = data.reviewItems.filter((i) => i.status === 'dominado').length;
  const reinforce = data.progress.filter((p) => p.completed && (p.best_score ?? 1) < 0.7 && lessonsById[p.lesson_id]);

  async function start() {
    setMode('loading');
    setError(null);
    try {
      const items = dueItems.slice(0, SESSION_SIZE);
      const { exercises } = await backend.fn('content', { exercise_ids: items.map((i) => i.exercise_id) });
      setSession({ items, exercises });
      setMode('session');
    } catch (e) {
      setError(e);
      setMode('idle');
    }
  }

  if (mode === 'loading') return <Loading label="Separando suas questões…" />;
  if (mode === 'session') return <Session items={session.items} exercises={session.exercises} onCancel={() => setMode('idle')} onFinish={(r) => (setResult(r), setMode('result'), app.reloadData())} />;

  if (mode === 'result')
    return (
      <div className="stack">
        <MascotSays mood="feliz">Revisão concluída! Lembrar é parte do aprender.</MascotSays>
        <div className="card gold center">
          <strong style={{ fontFamily: 'var(--font-title)', fontSize: '1.8rem' }}>+{result.xp_awarded} XP</strong>
          <p className="small" style={{ margin: 0 }}>
            Você acertou {result.correct} de {result.total}.{result.xp_awarded === 0 && result.correct > 0 ? ' O XP diário de revisões já foi atingido hoje.' : ''}
          </p>
        </div>
        <div className="card">
          <h2>Próximos passos</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {result.results.map((r) => (
              <li key={r.review_item_id}>
                {r.correct ? '✓ Acertou' : '✗ Errou'} —{' '}
                {r.status === 'dominado' ? 'questão dominada, não volta mais à revisão' : r.next_due === today ? 'disponível para revisar de novo hoje' : `próxima revisão em ${formatDate(r.next_due)}`}
              </li>
            ))}
          </ul>
        </div>
        <button className="btn btn-primary btn-block" onClick={() => setMode('idle')}>
          Voltar
        </button>
      </div>
    );

  return (
    <div className="stack">
      <div className="page-header">
        <h1>Vamos lembrar?</h1>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>
        Questões que você errou voltam em intervalos de 1, 3, 7 e 14 dias. Se errar de novo, a revisão é antecipada.
      </p>
      {error && <Alert kind="error">{error.message}</Alert>}

      {dueItems.length > 0 ? (
        <div className="card gold stack">
          <div className="row">
            <Icon name="review" size={30} />
            <div>
              <h2 style={{ margin: 0 }}>{plural(dueItems.length, 'questão para hoje', 'questões para hoje')}</h2>
              <p className="small" style={{ margin: 0 }}>
                {dueItems.length > SESSION_SIZE ? `Faremos ${SESSION_SIZE} por vez.` : 'Leva só alguns minutos.'}
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={start}>
            Começar revisão
          </button>
        </div>
      ) : (
        <MascotSays mood="feliz">
          {data.reviewItems.length ? 'Tudo em dia por aqui! Volte quando houver revisões marcadas.' : 'Ainda não há nada para revisar. As questões que você errar nas lições aparecerão aqui.'}
        </MascotSays>
      )}

      {upcoming.length > 0 && (
        <section className="card">
          <h2>Próximas revisões</h2>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }} className="stack">
            {Object.entries(upcoming.reduce((acc, i) => ((acc[i.due_date] ||= []).push(i), acc), {})).map(([date, list]) => (
              <li key={date} className="row spread">
                <span className="row">
                  <Icon name="calendar" size={18} /> {formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="badge">{plural(list.length, 'questão', 'questões')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {reinforce.length > 0 && (
        <section className="card">
          <h2>Conteúdos para reforçar</h2>
          <p className="small muted">Lições em que você acertou menos de 70%. Repetir não apaga seu histórico.</p>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }} className="stack">
            {reinforce.map((p) => (
              <li key={p.id} className="row spread">
                <span>
                  <strong>{lessonsById[p.lesson_id].title}</strong>
                  <br />
                  <span className="small muted">Melhor resultado: {Math.round(p.best_score * 100)}%</span>
                </span>
                <Link className="btn btn-secondary btn-sm" to={`/licao/${p.lesson_id}`}>
                  Refazer
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mastered > 0 && (
        <p className="small muted center">
          <Icon name="check" size={14} /> {plural(mastered, 'questão dominada', 'questões dominadas')} depois das revisões.
        </p>
      )}
    </div>
  );
}
