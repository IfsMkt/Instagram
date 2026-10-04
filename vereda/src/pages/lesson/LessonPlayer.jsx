// Fluxo completo de uma lição: apresentação → blocos de conteúdo → exercícios
// com feedback → resumo → reflexão opcional → celebração.
// Modos: 'user' (salva no backend), 'guest' (visitante; salva localmente até o
// cadastro) e 'preview' (prévia administrativa; não salva nada).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import Mascot, { MascotSays } from '../../components/Mascot.jsx';
import { ExerciseView, Feedback, initialResponse, isComplete } from '../../components/exercises.jsx';
import { Alert, ConfirmDialog, Progress } from '../../components/ui.jsx';
import { BLOCK_KINDS, ACHIEVEMENTS, computeLessonXp, gradeExercise } from '../../../base44/shared/engine.js';
import { backend, newId } from '../../api/backend.js';
import { useApp } from '../../state/AppState.jsx';
import { setGuest } from '../../lib/guest.js';
import { plural } from '../../lib/format.js';

export function BlockKindTag({ kind, tradition }) {
  return (
    <span className={`kind-tag kind-${kind}`}>
      {BLOCK_KINDS[kind] || kind}
      {kind === 'interpretacao' && tradition ? ` · ${tradition}` : ''}
    </span>
  );
}

function Intro({ lesson, unit, mode }) {
  const { toast } = useApp() || {};
  const [saved, setSaved] = useState({});
  const saveFav = async (reference) => {
    try {
      await backend.entities.Favorite.create({ reference, label: lesson.title, lesson_id: lesson.id });
      setSaved((s) => ({ ...s, [reference]: true }));
      toast?.('Referência salva no seu caderno.');
    } catch (e) {
      toast?.(`Não foi possível salvar: ${e.message}`);
    }
  };
  return (
    <div className="stack block-card">
      <div>
        {unit && <div className="eyebrow">{unit.title}</div>}
        <h1>{lesson.title}</h1>
        <p className="muted row" style={{ gap: 6 }}>
          <Icon name="calendar" size={18} /> Cerca de {lesson.duration_min || 5} minutos
          {lesson.kind === 'revisao_unidade' && <span className="badge gold">Revisão da unidade</span>}
        </p>
      </div>
      <div className="card sage">
        <div className="eyebrow">Objetivo</div>
        <p style={{ margin: 0, fontWeight: 600 }}>{lesson.objective}</p>
      </div>
      <div className="card">
        <div className="eyebrow">Referências bíblicas</div>
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }} className="stack">
          {(lesson.references || []).map((r) => (
            <li key={r} className="row spread">
              <strong>{r}</strong>
              {mode === 'user' && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => saveFav(r)} disabled={saved[r]} aria-label={`Salvar ${r} nos favoritos`}>
                  <Icon name="bookmark" size={18} /> {saved[r] ? 'Salvo' : 'Salvar'}
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="hint" style={{ marginBottom: 0 }}>
          Abra sua Bíblia nessas passagens, se quiser. Aqui você verá resumos, não citações literais.
        </p>
      </div>
      <div className="card soft">
        <span className="kind-tag kind-contexto">Contexto</span>
        <p style={{ margin: 0 }}>{lesson.context}</p>
      </div>
    </div>
  );
}

function BlockStep({ block }) {
  return (
    <article className="card block-card" aria-labelledby="block-title">
      <BlockKindTag kind={block.kind} tradition={block.tradition} />
      <h2 id="block-title">{block.title}</h2>
      <p style={{ margin: 0 }}>{block.body}</p>
      {block.kind === 'biblia_resumo' && <p className="hint" style={{ marginBottom: 0 }}>Resumo com nossas palavras — não é citação literal do texto bíblico.</p>}
      {block.kind === 'interpretacao' && <p className="hint" style={{ marginBottom: 0 }}>Interpretações podem variar entre tradições cristãs.</p>}
    </article>
  );
}

function Summary({ lesson, outcome, saving, error, onRetry }) {
  return (
    <div className="stack block-card">
      <h1>Resumo do aprendizado</h1>
      <div className="card">
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {(lesson.summary || []).map((s) => (
            <li key={s} style={{ marginBottom: 6 }}>
              {s}
            </li>
          ))}
        </ul>
      </div>
      {outcome && (
        <p className="muted" style={{ fontWeight: 700 }}>
          Você acertou {outcome.correct} de {outcome.total} questões.
        </p>
      )}
      {saving && (
        <p className="muted" role="status">
          Salvando seu progresso…
        </p>
      )}
      {error && (
        <Alert kind="error">
          Não conseguimos salvar seu progresso: {error.message}{' '}
          <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ marginTop: 8 }}>
            Tentar novamente
          </button>
        </Alert>
      )}
    </div>
  );
}

function Reflection({ lesson, text, setText, mode }) {
  return (
    <div className="stack block-card">
      <span className="kind-tag kind-reflexao">Reflexão pessoal · opcional</span>
      <h1>{lesson.reflection_prompt}</h1>
      <p className="muted">
        Não existe resposta certa ou errada, e ela não vale pontos. {mode === 'user' ? 'Se escrever, sua reflexão fica salva no seu caderno, visível só para você.' : mode === 'guest' ? 'Se escrever, guardaremos sua reflexão no seu caderno quando você criar sua conta.' : 'Na prévia, nada é salvo.'}
      </p>
      <label className="field">
        <span className="sr-only">Sua reflexão</span>
        <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva com calma, se quiser…" maxLength={4000} rows={6} />
      </label>
    </div>
  );
}

function Leaves() {
  const leaves = useMemo(() => Array.from({ length: 14 }, (_, i) => ({ left: `${(i * 37) % 100}%`, delay: `${(i % 7) * 0.25}s`, gold: i % 3 === 0 })), []);
  return (
    <div aria-hidden="true">
      {leaves.map((l, i) => (
        <span key={i} className={`leaf${l.gold ? ' gold' : ''}`} style={{ left: l.left, animationDelay: l.delay }} />
      ))}
    </div>
  );
}

const XP_REASON_TEXT = {
  primeira_conclusao: 'pela primeira conclusão desta lição',
  repeticao: 'pela revisão desta lição',
  repeticao_ja_pontuada_hoje: 'Você já recebeu XP por repetir esta lição hoje. Repetir continua ajudando a fixar o conteúdo!',
  limite_de_repeticoes: 'Esta lição já atingiu o limite de XP por repetições. Repetir continua ajudando a fixar o conteúdo!',
};

function Done({ mode, result, outcome, onRepeat, onExit }) {
  const app = useApp();
  const ach = (result?.new_achievements || []).map((k) => ACHIEVEMENTS.find((a) => a.key === k)).filter(Boolean);
  return (
    <div className="stack celebrate center" style={{ paddingTop: 10 }}>
      {!app?.profile?.reduced_motion && <Leaves />}
      <Mascot size={120} mood="feliz" />
      <h1>Lição concluída!</h1>
      {mode === 'preview' ? (
        <p className="muted">Fim da prévia. Nenhum progresso foi registrado.</p>
      ) : (
        <>
          <div className="card gold" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-title)', fontSize: '2rem', fontWeight: 700 }}>+{(result || outcome).xp_awarded} XP</div>
            <p style={{ margin: 0 }} className="small">
              {(result || outcome).xp_awarded > 0 ? `XP ${XP_REASON_TEXT[(result || outcome).xp_reason] || ''}` : XP_REASON_TEXT[(result || outcome).xp_reason]}
            </p>
            <p className="small" style={{ margin: '6px 0 0' }}>
              XP mede as atividades que você realizou — não mede fé.
            </p>
          </div>
          {mode === 'guest' && (
            <Alert kind="info">Crie sua conta para guardar este progresso, começar sua sequência de estudos e continuar a jornada.</Alert>
          )}
          {result && (
            <div className="grid-2">
              <div className="stat">
                <strong>{plural(result.stats.streak_current, 'dia', 'dias')}</strong>
                <span>de estudo seguidos</span>
              </div>
              <div className="stat">
                <strong>
                  {result.daily.xp_today}/{result.daily.goal_xp} XP
                </strong>
                <span>{result.daily.xp_today >= result.daily.goal_xp ? 'Meta do dia alcançada' : 'Meta do dia'}</span>
              </div>
            </div>
          )}
          {result?.unit_completed && <Alert kind="warn">Você concluiu todas as etapas desta unidade. Que bela caminhada!</Alert>}
          {ach.length > 0 && (
            <div className="card" style={{ textAlign: 'left' }}>
              <h2>Nova conquista</h2>
              <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }} className="stack">
                {ach.map((a) => (
                  <li key={a.key} className="row">
                    <span className="badge gold">
                      <Icon name="star" size={16} /> {a.title}
                    </span>
                    <span className="small muted">{a.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
      <div className="stack" style={{ marginTop: 8 }}>
        {mode === 'guest' ? (
          <>
            <Link className="btn btn-primary btn-block" to="/entrar?modo=cadastro">
              Criar conta e salvar progresso
            </Link>
            <Link className="btn btn-secondary btn-block" to="/entrar">
              Já tenho conta
            </Link>
          </>
        ) : (
          <>
            <button className="btn btn-primary btn-block" onClick={onExit}>
              {mode === 'preview' ? 'Voltar à administração' : 'Continuar a jornada'}
            </button>
            {mode === 'user' && (
              <button className="btn btn-secondary btn-block" onClick={onRepeat}>
                Repetir lição
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function LessonPlayer({ lesson, unit, exercises, mode = 'user', exitTo = '/jornada' }) {
  const app = useApp();
  const navigate = useNavigate();
  const steps = useMemo(
    () => [
      { type: 'intro' },
      ...(lesson.blocks || []).map((block) => ({ type: 'block', block })),
      ...exercises.map((exercise) => ({ type: 'exercise', exercise })),
      { type: 'summary' },
      ...(lesson.reflection_prompt ? [{ type: 'reflection' }] : []),
      { type: 'done' },
    ],
    [lesson, exercises]
  );
  const [attempt, setAttempt] = useState(() => ({ id: newId(), startedAt: new Date().toISOString() }));
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [checked, setChecked] = useState({});
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [reflection, setReflection] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const headingRef = useRef(null);
  const feedbackRef = useRef(null);

  const current = steps[step];
  const exerciseSteps = steps.filter((s) => s.type === 'exercise').length;

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo?.(0, 0);
  }, [step]);

  const outcome = useMemo(() => {
    const correct = exercises.filter((ex) => checked[ex.id]).length;
    const calc = computeLessonXp({ firstCompletion: true, correct, total: exercises.length });
    return { correct, total: exercises.length, xp_awarded: calc.xp, xp_reason: calc.reason };
  }, [checked, exercises]);

  const answersPayload = () => exercises.map((ex) => ({ exercise_id: ex.id, response: responses[ex.id] }));

  async function submit() {
    if (mode === 'preview') return;
    if (mode === 'guest') {
      setGuest({ trial: { lesson_id: lesson.id, answers: answersPayload(), client_attempt_id: attempt.id, started_at: attempt.startedAt, completed_at: new Date().toISOString(), completed: true, correct: outcome.correct, total: outcome.total } });
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await backend.fn('complete-lesson', { lesson_id: lesson.id, answers: answersPayload(), client_attempt_id: attempt.id, started_at: attempt.startedAt });
      setResult(res);
    } catch (e) {
      setSaveError(e);
    } finally {
      setSaving(false);
    }
  }

  async function finishReflection() {
    const text = reflection.trim();
    if (text && mode === 'user') {
      setSavingNote(true);
      try {
        await backend.entities.Note.create({ kind: 'reflexao', title: lesson.title, body: text, prompt: lesson.reflection_prompt, reference: (lesson.references || [])[0] || '', lesson_id: lesson.id, lesson_title: lesson.title });
        app?.toast('Reflexão salva no seu caderno.');
      } catch (e) {
        app?.toast(`Não foi possível salvar a reflexão: ${e.message}`);
        setSavingNote(false);
        return;
      }
      setSavingNote(false);
    }
    if (text && mode === 'guest') setGuest({ reflection: { text, prompt: lesson.reflection_prompt, lesson_id: lesson.id, lesson_title: lesson.title, reference: (lesson.references || [])[0] || '' } });
    goNext();
  }

  function goNext() {
    const next = steps[step + 1];
    if (next?.type === 'done') app?.sound('concluiu');
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  function verify() {
    const ex = current.exercise;
    const resp = responses[ex.id] ?? initialResponse(ex);
    const ok = gradeExercise(ex, resp);
    setResponses((s) => ({ ...s, [ex.id]: resp }));
    setChecked((c) => ({ ...c, [ex.id]: ok }));
    app?.sound(ok ? 'certo' : 'errado');
  }

  function onPrimary() {
    if (current.type === 'exercise') {
      const ex = current.exercise;
      if (!(ex.id in checked)) return verify();
      const nextStep = steps[step + 1];
      if (nextStep?.type === 'summary') submit();
      return goNext();
    }
    if (current.type === 'reflection') return finishReflection();
    if (current.type === 'done') return navigate(exitTo);
    return goNext();
  }

  function repeat() {
    setAttempt({ id: newId(), startedAt: new Date().toISOString() });
    setResponses({});
    setChecked({});
    setResult(null);
    setReflection('');
    setStep(0);
    app?.reloadData();
  }

  useEffect(() => {
    if (current.type === 'exercise' && current.exercise.id in checked) feedbackRef.current?.scrollIntoView?.({ block: 'end', behavior: 'smooth' });
  }, [checked]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (current.type === 'done' && mode === 'user') app?.reloadData();
  }, [current.type]); // eslint-disable-line react-hooks/exhaustive-deps

  let primaryLabel = 'Continuar';
  let primaryDisabled = false;
  if (current.type === 'intro') primaryLabel = 'Começar';
  if (current.type === 'exercise') {
    const ex = current.exercise;
    if (!(ex.id in checked)) {
      primaryLabel = 'Verificar';
      primaryDisabled = !isComplete(ex, responses[ex.id] ?? initialResponse(ex));
    }
  }
  if (current.type === 'summary') primaryDisabled = mode === 'user' && (saving || !!saveError || !result);
  if (current.type === 'reflection') {
    primaryLabel = reflection.trim() ? (mode === 'user' ? 'Salvar no caderno e concluir' : mode === 'guest' ? 'Guardar e concluir' : 'Concluir') : 'Pular e concluir';
    primaryDisabled = savingNote;
  }

  const progress = step / (steps.length - 1);
  const exerciseNumber = current.type === 'exercise' ? steps.slice(0, step + 1).filter((s) => s.type === 'exercise').length : 0;

  return (
    <div className="lesson-shell">
      {mode !== 'user' && (
        <div className="demo-banner" style={{ margin: '0 -16px' }}>
          {mode === 'preview' ? `Prévia administrativa · status: ${lesson.status || 'rascunho'} · nada é salvo` : 'Você está experimentando como visitante'}
        </div>
      )}
      {mode === 'user' && lesson.status && lesson.status !== 'publicado' && (
        <div className="demo-banner" style={{ margin: '0 -16px' }}>
          Prévia de demonstração: conteúdo em rascunho, ainda sem revisão editorial
        </div>
      )}
      <header className="lesson-top">
        {current.type !== 'done' ? (
          <button className="icon-btn" onClick={() => setConfirmExit(true)} aria-label="Sair da lição">
            <Icon name="x" />
          </button>
        ) : (
          <span style={{ width: 44 }} />
        )}
        <div className="grow">
          <Progress value={progress} label="Progresso na lição" />
        </div>
        {exerciseNumber > 0 && (
          <span className="small muted" style={{ fontWeight: 800, minWidth: 40, textAlign: 'right' }}>
            {exerciseNumber}/{exerciseSteps}
          </span>
        )}
      </header>

      <main className="lesson-body" id="conteudo">
        <h2 className="sr-only" tabIndex={-1} ref={headingRef}>
          {lesson.title} — etapa {step + 1} de {steps.length}
        </h2>
        {current.type === 'intro' && <Intro lesson={lesson} unit={unit} mode={mode} />}
        {current.type === 'block' && <BlockStep block={current.block} key={step} />}
        {current.type === 'exercise' && (
          <ExerciseView
            key={current.exercise.id}
            exercise={current.exercise}
            response={responses[current.exercise.id] ?? initialResponse(current.exercise)}
            onChange={(r) => setResponses((s) => ({ ...s, [current.exercise.id]: r }))}
            checked={current.exercise.id in checked}
          />
        )}
        {current.type === 'exercise' && current.exercise.id in checked && (
          <div ref={feedbackRef} style={{ marginTop: 16, scrollMarginBottom: 110 }}>
            <Feedback exercise={current.exercise} correct={checked[current.exercise.id]} />
          </div>
        )}
        {current.type === 'summary' && <Summary lesson={lesson} outcome={result || outcome} saving={saving} error={saveError} onRetry={submit} />}
        {current.type === 'reflection' && <Reflection lesson={lesson} text={reflection} setText={setReflection} mode={mode} />}
        {current.type === 'done' && <Done mode={mode} result={result} outcome={outcome} onRepeat={repeat} onExit={() => navigate(exitTo)} />}
        {current.type === 'intro' && step === 0 && mode === 'guest' && (
          <div style={{ marginTop: 16 }}>
            <MascotSays size={60}>Vamos juntos! São só alguns minutos.</MascotSays>
          </div>
        )}
      </main>

      {current.type !== 'done' && (
        <footer className="lesson-footer">
          <button className="btn btn-primary btn-block" onClick={onPrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </button>
        </footer>
      )}

      {confirmExit && (
        <ConfirmDialog
          title="Sair da lição?"
          confirmLabel="Sair"
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => navigate(mode === 'guest' ? '/bem-vindo' : exitTo)}
        >
          <p>As respostas desta tentativa não serão salvas. Você pode voltar quando quiser.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
