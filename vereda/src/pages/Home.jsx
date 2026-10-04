import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { MascotSays } from '../components/Mascot.jsx';
import Icon from '../components/Icon.jsx';
import { ErrorState, Loading, Progress } from '../components/ui.jsx';
import { useApp } from '../state/AppState.jsx';
import { greeting, plural } from '../lib/format.js';

function dayOfYear(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86400000);
}

/** Card do dia: referência e resumo de uma lição publicada, com uma pergunta de reflexão. */
function DailyCard({ lessons, today }) {
  const card = useMemo(() => {
    const pool = lessons.flatMap((l) => (l.blocks || []).filter((b) => b.kind === 'biblia_resumo').map((b) => ({ block: b, lesson: l })));
    if (!pool.length) return null;
    return pool[dayOfYear(today) % pool.length];
  }, [lessons, today]);
  if (!card) return null;
  return (
    <section className="card" aria-labelledby="daily-card-title">
      <div className="eyebrow">Para hoje</div>
      <h2 id="daily-card-title">{card.block.title}</h2>
      <span className="kind-tag kind-biblia_resumo">Resumo do texto bíblico</span>
      <p>{card.block.body}</p>
      {card.lesson.reflection_prompt && (
        <>
          <span className="kind-tag kind-reflexao">Reflexão</span>
          <p style={{ marginBottom: 0 }}>{card.lesson.reflection_prompt}</p>
        </>
      )}
    </section>
  );
}

export default function Home() {
  const app = useApp();
  const { profile, data } = app;
  if (data.status === 'loading' || data.status === 'idle') return <Loading />;
  if (data.status === 'error') return <ErrorState error={data.error} onRetry={app.reloadData} />;

  const { streak, nextLesson, currentUnit, xpToday, goalXp, dueItems, journey, today } = app;
  const hasContent = journey.some((u) => !u.comingSoon);
  const goalPct = Math.min(1, xpToday / goalXp);
  let message = 'Que bom ter você aqui. Vamos dar mais um passo?';
  if (streak.lost) message = 'Hoje é uma nova oportunidade de continuar.';
  else if (streak.studiedToday && xpToday >= goalXp) message = 'Meta do dia concluída. Se quiser, revise ou faça mais uma lição.';
  else if (streak.studiedToday) message = 'Bom trabalho hoje! Continue no seu ritmo.';
  else if (streak.days > 0) message = `Você estudou ${plural(streak.days, 'dia', 'dias')} seguidos. Vamos continuar hoje?`;
  if (!nextLesson && hasContent && journey.filter((u) => !u.comingSoon).every((u) => u.completed)) message = 'Você concluiu todas as lições disponíveis! Novas unidades estão a caminho.';

  return (
    <div className="stack">
      <header>
        <p className="muted" style={{ margin: 0, fontWeight: 700 }}>
          {greeting()},
        </p>
        <h1 style={{ marginBottom: 6 }}>{profile.display_name}</h1>
      </header>
      <MascotSays mood={streak.studiedToday ? 'feliz' : 'calma'}>{message}</MascotSays>

      {!hasContent ? (
        <div className="card soft">
          <h2>Conteúdo em preparação</h2>
          <p className="muted" style={{ margin: 0 }}>
            As lições estão em revisão editorial e aparecerão aqui assim que forem publicadas.
          </p>
        </div>
      ) : nextLesson ? (
        <Link className="btn btn-primary btn-block" to={`/licao/${nextLesson.id}`} style={{ minHeight: 60, fontSize: '1.08rem' }}>
          Continuar minha jornada <Icon name="chevronRight" />
        </Link>
      ) : (
        <Link className="btn btn-secondary btn-block" to="/jornada">
          Ver minha jornada
        </Link>
      )}

      <div className="grid-2">
        <section className="card" aria-labelledby="goal-title" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="ring" style={{ '--p': goalPct }} role="img" aria-label={`Meta diária: ${xpToday} de ${goalXp} XP`}>
            <div>
              {Math.min(xpToday, 999)}
              <br />
              <span className="small muted">/{goalXp}</span>
            </div>
          </div>
          <div>
            <h2 id="goal-title" style={{ fontSize: '1rem', marginBottom: 2 }}>
              Meta diária
            </h2>
            <p className="small muted" style={{ margin: 0 }}>
              {xpToday >= goalXp ? (
                <>
                  <Icon name="check" size={14} /> Alcançada
                </>
              ) : (
                `${profile.daily_minutes} min · ${goalXp} XP`
              )}
            </p>
          </div>
        </section>
        <section className="card" aria-labelledby="streak-title">
          <div className="row" style={{ color: 'var(--gold-700)' }}>
            <Icon name="flame" size={26} />
            <strong style={{ fontFamily: 'var(--font-title)', fontSize: '1.6rem' }}>{streak.days}</strong>
          </div>
          <h2 id="streak-title" style={{ fontSize: '1rem', margin: '4px 0 0' }}>
            {streak.days === 1 ? 'dia de estudo' : 'dias seguidos'}
          </h2>
          <p className="small muted" style={{ margin: 0 }}>
            {streak.studiedToday ? 'Você já estudou hoje' : 'Estude hoje para continuar'}
          </p>
        </section>
      </div>

      {currentUnit && (
        <section className="card" aria-labelledby="unit-title">
          <div className="eyebrow">Unidade atual</div>
          <h2 id="unit-title">{currentUnit.unit.title}</h2>
          <Progress value={currentUnit.completedCount / Math.max(1, currentUnit.total)} label={`Progresso da unidade ${currentUnit.unit.title}`} />
          <p className="small muted" style={{ margin: '6px 0 0' }}>
            {currentUnit.completedCount} de {currentUnit.total} etapas concluídas
          </p>
        </section>
      )}

      {dueItems.length > 0 ? (
        <Link to="/revisao" className="card gold row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Icon name="review" size={28} />
          <span className="grow">
            <strong>Vamos lembrar?</strong>
            <br />
            <span className="small">{plural(dueItems.length, 'questão para revisar', 'questões para revisar')}</span>
          </span>
          <Icon name="chevronRight" />
        </Link>
      ) : (
        <Link to="/revisao" className="card soft row" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Icon name="review" size={24} />
          <span className="grow small">Revisar erros anteriores · nada pendente hoje</span>
          <Icon name="chevronRight" />
        </Link>
      )}

      <DailyCard lessons={data.content.lessons} today={today} />
    </div>
  );
}
