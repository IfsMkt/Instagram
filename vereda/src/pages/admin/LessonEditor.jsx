import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import { Alert, ConfirmDialog, Dialog, ErrorState, Loading } from '../../components/ui.jsx';
import { DemoBanner } from '../../components/Layout.jsx';
import { BLOCK_KINDS, EXERCISE_TYPES, validateExercise } from '../../../base44/shared/engine.js';
import { describeAnswer } from '../../components/exercises.jsx';
import { useAdminContent, admin } from './useAdmin.js';
import { ErrorDetails, MoveButtons, StatusActions, StatusBadge } from './AdminParts.jsx';
import { useApp } from '../../state/AppState.jsx';

const lines = (s) =>
  String(s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
const LETTERS = 'abcdefgh';
const rotate = (arr) => (arr.length > 1 ? [...arr.slice(1), arr[0]] : arr);

// ------------------------------------------------------------------ exercício

function toForm(ex) {
  const base = { type: ex?.type || 'multipla_escolha', prompt: ex?.prompt || '', explanation: ex?.explanation || '', reference: ex?.reference || '' };
  const t = base.type;
  if (t === 'multipla_escolha' || t === 'completar') return { ...base, options: ex?.options?.map((o) => o.text) || ['', ''], correct: Math.max(0, ex?.options?.findIndex((o) => o.id === ex.answer) ?? 0) };
  if (t === 'verdadeiro_falso') return { ...base, vf: ex?.answer === false ? 'false' : 'true' };
  if (t === 'ordenar') {
    const byId = Object.fromEntries((ex?.items || []).map((i) => [i.id, i.text]));
    return { ...base, orderText: (ex?.answer || []).map((id) => byId[id]).join('\n') };
  }
  if (t === 'associar') {
    const r = Object.fromEntries((ex?.right || []).map((i) => [i.id, i.text]));
    return { ...base, pairsText: (ex?.left || []).map((l) => `${l.text} | ${r[ex.answer[l.id]]}`).join('\n') };
  }
  return base;
}

function fromForm(f) {
  const base = { type: f.type, prompt: f.prompt.trim(), explanation: f.explanation.trim(), reference: f.reference.trim() };
  if (f.type === 'multipla_escolha' || f.type === 'completar') {
    const options = (f.options || []).map((text, i) => ({ id: LETTERS[i], text: text.trim() }));
    return { ...base, options, answer: LETTERS[f.correct || 0] };
  }
  if (f.type === 'verdadeiro_falso') return { ...base, answer: f.vf !== 'false' };
  if (f.type === 'ordenar') {
    const items = lines(f.orderText).map((text, i) => ({ id: `i${i + 1}`, text }));
    return { ...base, items: rotate(items), answer: items.map((i) => i.id) };
  }
  if (f.type === 'associar') {
    const pairs = lines(f.pairsText).map((l) => l.split('|').map((x) => x.trim()));
    const left = pairs.map(([t], i) => ({ id: `l${i + 1}`, text: t || '' }));
    const right = pairs.map(([, t], i) => ({ id: `r${i + 1}`, text: t || '' }));
    return { ...base, left, right: rotate(right), answer: Object.fromEntries(left.map((l, i) => [l.id, right[i].id])) };
  }
  return base;
}

function ExerciseForm({ exercise, lessonId, onSaved, onClose }) {
  const [f, setF] = useState(() => toForm(exercise));
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const draft = fromForm(f);
  const problems = validateExercise(draft);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await admin('save_exercise', { id: exercise?.id, lesson_id: lessonId, data: draft });
      onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <Dialog title={exercise ? 'Editar exercício' : 'Novo exercício'} onClose={onClose}>
      <form className="stack" onSubmit={save}>
        <ErrorDetails error={error} />
        <label className="field">
          <span>Tipo</span>
          <select className="select" value={f.type} onChange={(e) => setF({ ...toForm({ type: e.target.value }), prompt: f.prompt, explanation: f.explanation, reference: f.reference })}>
            {Object.entries(EXERCISE_TYPES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{f.type === 'completar' ? 'Frase (use ___ no lugar da lacuna)' : f.type === 'verdadeiro_falso' ? 'Afirmação' : 'Enunciado'}</span>
          <textarea className="textarea" rows={3} value={f.prompt} onChange={(e) => set({ prompt: e.target.value })} />
        </label>

        {(f.type === 'multipla_escolha' || f.type === 'completar') && (
          <fieldset>
            <legend>Alternativas (marque a correta)</legend>
            <div className="stack">
              {f.options.map((opt, i) => (
                <div key={i} className="row">
                  <input type="radio" name="correct" checked={f.correct === i} onChange={() => set({ correct: i })} aria-label={`Alternativa ${i + 1} é a correta`} style={{ width: 22, height: 22 }} />
                  <input className="input grow" value={opt} onChange={(e) => set({ options: f.options.map((o, j) => (j === i ? e.target.value : o)) })} aria-label={`Alternativa ${i + 1}`} />
                  <button type="button" className="icon-btn" disabled={f.options.length <= 2} aria-label={`Remover alternativa ${i + 1}`} onClick={() => set({ options: f.options.filter((_, j) => j !== i), correct: f.correct === i ? 0 : f.correct > i ? f.correct - 1 : f.correct })}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
              ))}
              {f.options.length < 6 && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => set({ options: [...f.options, ''] })}>
                  <Icon name="plus" size={16} /> Alternativa
                </button>
              )}
            </div>
          </fieldset>
        )}
        {f.type === 'verdadeiro_falso' && (
          <fieldset>
            <legend>Resposta correta</legend>
            <label className="row">
              <input type="radio" name="vf" checked={f.vf === 'true'} onChange={() => set({ vf: 'true' })} /> Verdadeiro
            </label>
            <label className="row">
              <input type="radio" name="vf" checked={f.vf === 'false'} onChange={() => set({ vf: 'false' })} /> Falso
            </label>
          </fieldset>
        )}
        {f.type === 'ordenar' && (
          <label className="field">
            <span>Itens na ordem correta (um por linha)</span>
            <textarea className="textarea" value={f.orderText} onChange={(e) => set({ orderText: e.target.value })} />
            <span className="hint">Na lição, os itens aparecem embaralhados automaticamente.</span>
          </label>
        )}
        {f.type === 'associar' && (
          <label className="field">
            <span>Pares (um por linha, no formato “esquerda | direita”)</span>
            <textarea className="textarea" value={f.pairsText} onChange={(e) => set({ pairsText: e.target.value })} placeholder={'Caim | Cultivava o solo\nAbel | Era pastor de ovelhas'} />
          </label>
        )}

        <label className="field">
          <span>Explicação (por que a resposta está certa)</span>
          <textarea className="textarea" rows={3} value={f.explanation} onChange={(e) => set({ explanation: e.target.value })} />
        </label>
        <label className="field">
          <span>Referência bíblica pertinente</span>
          <input className="input" value={f.reference} onChange={(e) => set({ reference: e.target.value })} />
        </label>
        {problems.length > 0 ? (
          <Alert kind="warn">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Alert>
        ) : (
          <p className="small muted">Resposta correta: {describeAnswer(draft)}</p>
        )}
        <Alert kind="info">Use apenas perguntas com resposta verificável no texto. Questões abertas ou com interpretações divergentes não devem ter uma única resposta correta.</Alert>
        <button className="btn btn-primary btn-block" disabled={busy || problems.length > 0}>
          {busy ? 'Salvando…' : 'Salvar exercício (volta para rascunho)'}
        </button>
      </form>
    </Dialog>
  );
}

// ------------------------------------------------------------------ lição

function lessonToForm(l) {
  return {
    title: l.title || '',
    kind: l.kind || 'licao',
    duration_min: l.duration_min || 5,
    objective: l.objective || '',
    references: (l.references || []).join('\n'),
    context: l.context || '',
    blocks: (l.blocks || []).map((b) => ({ ...b })),
    summary: (l.summary || []).join('\n'),
    reflection_prompt: l.reflection_prompt || '',
    sources: (l.sources || []).map((s) => `${s.label} | ${s.detail || ''}`).join('\n'),
    editorial_notes: l.editorial_notes || '',
  };
}

function formToLesson(f) {
  return {
    title: f.title.trim(),
    kind: f.kind,
    duration_min: Number(f.duration_min) || 5,
    objective: f.objective.trim(),
    references: lines(f.references),
    context: f.context.trim(),
    blocks: f.blocks.map((b) => ({ kind: b.kind, title: (b.title || '').trim(), body: (b.body || '').trim(), ...(b.kind === 'interpretacao' ? { tradition: (b.tradition || '').trim() } : {}) })),
    summary: lines(f.summary),
    reflection_prompt: f.reflection_prompt.trim(),
    sources: lines(f.sources).map((l) => {
      const [label, detail] = l.split('|').map((x) => x.trim());
      return { label, detail: detail || '' };
    }),
    editorial_notes: f.editorial_notes.trim(),
  };
}

export default function LessonEditor() {
  const { id } = useParams();
  const { toast } = useApp();
  const navigate = useNavigate();
  const [state, reload] = useAdminContent();
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exDialog, setExDialog] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const lesson = state.status === 'ready' ? state.lessons.find((l) => l.id === id) : null;
  useEffect(() => {
    if (lesson && !form) setForm(lessonToForm(lesson));
  }, [lesson]); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <div className="page no-nav"><ErrorState error={state.error} onRetry={reload} /></div>;
  if (!lesson) return <div className="page no-nav"><ErrorState title="Lição não encontrada" error={{ message: 'Ela pode ter sido excluída.' }} /></div>;
  if (!form) return <Loading />;

  const unit = state.units.find((u) => u.id === lesson.unit_id);
  const exercises = state.exercises.filter((e) => e.lesson_id === id);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBlock = (i, patch) => setForm((f) => ({ ...f, blocks: f.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));
  const moveBlock = (i, dir) =>
    setForm((f) => {
      const blocks = [...f.blocks];
      [blocks[i], blocks[i + dir]] = [blocks[i + dir], blocks[i]];
      return { ...f, blocks };
    });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await admin('save_lesson', { id, data: formToLesson(form) });
      toast('Lição salva como rascunho.');
      await reload();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  const run = async (fn) => {
    setError(null);
    try {
      await fn();
      await reload();
      return true;
    } catch (err) {
      setError(err);
      return false;
    }
  };

  return (
    <div className="app-shell">
      <DemoBanner />
      <main className="page no-nav stack" id="conteudo">
        <div>
          <Link to="/admin" className="small">
            ← Administração
          </Link>
          <div className="row wrap spread">
            <h1 style={{ margin: 0 }}>{lesson.title}</h1>
            <StatusBadge status={lesson.status} />
          </div>
          <p className="small muted">
            {unit?.title}
            {lesson.reviewed_by ? ` · revisada por ${lesson.reviewed_by}` : ''}
          </p>
          <div className="row wrap">
            <Link className="btn btn-secondary btn-sm" to={`/admin/licao/${id}/previa`}>
              <Icon name="eye" size={18} /> Prévia
            </Link>
            <StatusActions entity="Lesson" record={lesson} onDone={reload} onError={setError} />
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clay-700)' }} onClick={() => setDeleting({ type: 'lesson' })}>
              <Icon name="trash" size={18} /> Excluir lição
            </button>
          </div>
        </div>
        <ErrorDetails error={error} />
        {lesson.status !== 'rascunho' && <Alert kind="warn">Esta lição está {lesson.status}. Salvar alterações (inclusive em exercícios) a devolve para rascunho e a retira da trilha até nova revisão.</Alert>}

        <form className="card stack" onSubmit={save}>
          <h2>Conteúdo da lição</h2>
          <label className="field">
            <span>Título</span>
            <input className="input" value={form.title} onChange={set('title')} />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Tipo</span>
              <select className="select" value={form.kind} onChange={set('kind')}>
                <option value="licao">Lição</option>
                <option value="revisao_unidade">Revisão final da unidade</option>
              </select>
            </label>
            <label className="field">
              <span>Duração (min)</span>
              <input className="input" type="number" min={2} max={15} value={form.duration_min} onChange={set('duration_min')} />
            </label>
          </div>
          <label className="field">
            <span>Objetivo de aprendizado</span>
            <textarea className="textarea" rows={2} value={form.objective} onChange={set('objective')} />
          </label>
          <label className="field">
            <span>Referências bíblicas (uma por linha)</span>
            <textarea className="textarea" rows={3} value={form.references} onChange={set('references')} />
          </label>
          <label className="field">
            <span>Contexto (explicação breve)</span>
            <textarea className="textarea" rows={4} value={form.context} onChange={set('context')} />
          </label>

          <fieldset>
            <legend>Blocos de conteúdo</legend>
            <p className="hint">Identifique cada bloco: resumo do texto bíblico (nunca entre aspas como citação), contexto histórico, explicação, interpretação (com a tradição) ou palavra difícil.</p>
            <div className="stack">
              {form.blocks.map((b, i) => (
                <div key={i} className="card soft stack">
                  <div className="row spread">
                    <strong>Bloco {i + 1}</strong>
                    <span className="row" style={{ gap: 0 }}>
                      <MoveButtons index={i} total={form.blocks.length} onMove={moveBlock} label={`bloco ${i + 1}`} />
                      <button type="button" className="icon-btn" aria-label={`Remover bloco ${i + 1}`} onClick={() => setForm((f) => ({ ...f, blocks: f.blocks.filter((_, j) => j !== i) }))}>
                        <Icon name="trash" size={18} />
                      </button>
                    </span>
                  </div>
                  <label className="field">
                    <span>Tipo de texto</span>
                    <select className="select" value={b.kind} onChange={(e) => setBlock(i, { kind: e.target.value })}>
                      {Object.entries(BLOCK_KINDS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  {b.kind === 'interpretacao' && (
                    <label className="field">
                      <span>Tradição</span>
                      <input className="input" value={b.tradition || ''} onChange={(e) => setBlock(i, { tradition: e.target.value })} placeholder="Ex.: Católica; protestante" />
                    </label>
                  )}
                  <label className="field">
                    <span>Título</span>
                    <input className="input" value={b.title || ''} onChange={(e) => setBlock(i, { title: e.target.value })} />
                  </label>
                  <label className="field">
                    <span>Texto</span>
                    <textarea className="textarea" value={b.body || ''} onChange={(e) => setBlock(i, { body: e.target.value })} />
                  </label>
                </div>
              ))}
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm((f) => ({ ...f, blocks: [...f.blocks, { kind: 'conceito', title: '', body: '' }] }))}>
                <Icon name="plus" size={16} /> Adicionar bloco
              </button>
            </div>
          </fieldset>

          <label className="field">
            <span>Resumo do aprendizado (um ponto por linha)</span>
            <textarea className="textarea" rows={3} value={form.summary} onChange={set('summary')} />
          </label>
          <label className="field">
            <span>Pergunta de reflexão pessoal (opcional, sem nota)</span>
            <input className="input" value={form.reflection_prompt} onChange={set('reflection_prompt')} />
          </label>
          <label className="field">
            <span>Fontes (uma por linha, “rótulo | detalhe”)</span>
            <textarea className="textarea" rows={3} value={form.sources} onChange={set('sources')} />
          </label>
          <label className="field">
            <span>Notas editoriais internas</span>
            <textarea className="textarea" rows={2} value={form.editorial_notes} onChange={set('editorial_notes')} />
          </label>
          <button className="btn btn-primary btn-block" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar lição (como rascunho)'}
          </button>
        </form>

        <section className="card stack" aria-labelledby="ex-title">
          <div className="row spread">
            <h2 id="ex-title" style={{ margin: 0 }}>
              Exercícios ({exercises.length})
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setExDialog({})}>
              <Icon name="plus" size={18} /> Novo
            </button>
          </div>
          <p className="hint" style={{ marginTop: 0 }}>
            Cada lição deve ter de 4 a 6 exercícios.
          </p>
          <ul className="admin-list">
            {exercises.map((ex, i) => {
              const problems = validateExercise(ex);
              return (
                <li key={ex.id} className="admin-item">
                  <MoveButtons index={i} total={exercises.length} onMove={(idx, dir) => {
                    const ids = exercises.map((x) => x.id);
                    [ids[idx], ids[idx + dir]] = [ids[idx + dir], ids[idx]];
                    run(() => admin('reorder', { entity: 'Exercise', ids }));
                  }} label={`exercício ${i + 1}`} />
                  <span className="title">
                    {i + 1}. {ex.prompt}
                    <br />
                    <span className="small muted">
                      {EXERCISE_TYPES[ex.type]} · {ex.reference}
                    </span>
                    {problems.length > 0 && <span className="badge clay">{problems.length} problema(s)</span>}
                  </span>
                  <span className="row">
                    <button className="btn btn-ghost btn-sm" onClick={() => setExDialog({ exercise: ex })}>
                      <Icon name="edit" size={18} /> Editar
                    </button>
                    <button className="icon-btn" aria-label={`Excluir exercício ${i + 1}`} onClick={() => setDeleting({ type: 'exercise', exercise: ex })}>
                      <Icon name="trash" size={18} />
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {exDialog && (
          <ExerciseForm
            exercise={exDialog.exercise}
            lessonId={id}
            onClose={() => setExDialog(null)}
            onSaved={() => {
              setExDialog(null);
              toast('Exercício salvo. A lição voltou para rascunho.');
              reload();
            }}
          />
        )}
        {deleting && (
          <ConfirmDialog
            title={deleting.type === 'lesson' ? 'Excluir lição?' : 'Excluir exercício?'}
            danger
            confirmLabel="Excluir"
            onCancel={() => setDeleting(null)}
            onConfirm={() => {
              const d = deleting;
              setDeleting(null);
              if (d.type === 'lesson') run(() => admin('delete_lesson', { id })).then((ok) => ok && navigate('/admin'));
              else run(() => admin('delete_exercise', { id: d.exercise.id }));
            }}
          >
            <p>{deleting.type === 'lesson' ? 'A lição e todos os seus exercícios serão removidos. Lições publicadas precisam ser retiradas de publicação antes.' : 'O exercício será removido e a lição voltará para rascunho.'}</p>
          </ConfirmDialog>
        )}
      </main>
    </div>
  );
}
