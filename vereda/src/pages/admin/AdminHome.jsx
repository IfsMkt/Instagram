import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Icon, { UNIT_ICONS } from '../../components/Icon.jsx';
import { Alert, ConfirmDialog, Dialog, ErrorState, Loading } from '../../components/ui.jsx';
import { DemoBanner } from '../../components/Layout.jsx';
import { TRANSLATION_POLICY } from '../../../base44/shared/seed/index.js';
import { useAdminContent, admin } from './useAdmin.js';
import { ErrorDetails, MoveButtons, StatusActions, StatusBadge } from './AdminParts.jsx';

function UnitDialog({ unit, onSave, onClose }) {
  const [form, setForm] = useState({ title: unit?.title || '', description: unit?.description || '', icon: unit?.icon || 'livro' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  return (
    <Dialog title={unit ? 'Editar unidade' : 'Nova unidade'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSave(form);
          } catch (err) {
            setError(err);
            setBusy(false);
          }
        }}
      >
        <ErrorDetails error={error} />
        {unit?.status && unit.status !== 'rascunho' && <Alert kind="warn">Salvar alterações devolve a unidade para rascunho e exige nova revisão.</Alert>}
        <label className="field">
          <span>Título</span>
          <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="field">
          <span>Ícone</span>
          <select className="select" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
            {Object.keys(UNIT_ICONS).map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          Salvar
        </button>
      </form>
    </Dialog>
  );
}

function NewLessonDialog({ unit, onClose }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('licao');
  const [error, setError] = useState(null);
  return (
    <Dialog title={`Nova etapa em “${unit.title}”`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const l = await admin('save_lesson', { unit_id: unit.id, data: { title, kind } });
            navigate(`/admin/licao/${l.id}`);
          } catch (err) {
            setError(err);
          }
        }}
      >
        <ErrorDetails error={error} />
        <label className="field">
          <span>Título</span>
          <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="licao">Lição</option>
            <option value="revisao_unidade">Revisão final da unidade</option>
          </select>
        </label>
        <button className="btn btn-primary btn-block" disabled={!title.trim()}>
          Criar e editar
        </button>
      </form>
    </Dialog>
  );
}

export default function AdminHome() {
  const [state, reload] = useAdminContent();
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [seeding, setSeeding] = useState(false);

  if (state.status === 'loading') return <Loading label="Carregando conteúdo…" />;
  if (state.status === 'error') return <div className="page no-nav"><ErrorState error={state.error} onRetry={reload} /></div>;

  const { units, lessons, exercises } = state;
  const run = async (fn) => {
    setError(null);
    try {
      await fn();
      await reload();
    } catch (e) {
      setError(e);
    }
  };
  const move = (list, entity) => (index, dir) => {
    const ids = list.map((x) => x.id);
    [ids[index], ids[index + dir]] = [ids[index + dir], ids[index]];
    run(() => admin('reorder', { entity, ids }));
  };
  const counts = lessons.reduce((acc, l) => ((acc[l.status || 'rascunho'] = (acc[l.status || 'rascunho'] || 0) + 1), acc), {});

  return (
    <div className="app-shell">
      <DemoBanner />
      <main className="page no-nav stack" id="conteudo">
        <div className="page-header">
          <div>
            <Link to="/perfil" className="small">
              ← Voltar ao app
            </Link>
            <h1>Administração de conteúdo</h1>
          </div>
        </div>

        <div className="card soft stack">
          <h2 className="row">
            <Icon name="shield" /> Regras editoriais
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20 }} className="small">
            <li>Todo conteúdo novo ou editado entra como <strong>rascunho</strong>.</li>
            <li>Só conteúdo <strong>revisado</strong> pode ser publicado; o revisor fica registrado.</li>
            <li>Editar algo revisado ou publicado o devolve para rascunho.</li>
            <li>Lições precisam de objetivo, referências, contexto, blocos identificados, resumo e de 4 a 6 exercícios válidos.</li>
            <li>Interpretações devem indicar a tradição. Perguntas sem resposta explícita no texto não viram exercícios objetivos.</li>
          </ul>
          <p className="small" style={{ margin: 0 }}>
            <strong>Política de citações:</strong> {TRANSLATION_POLICY.note}
          </p>
          <p className="small muted" style={{ margin: 0 }}>
            Lições: {counts.rascunho || 0} em rascunho · {counts.revisado || 0} revisadas · {counts.publicado || 0} publicadas
          </p>
        </div>

        <ErrorDetails error={error} />

        {units.length === 0 && (
          <div className="card stack">
            <h2>Nenhum conteúdo ainda</h2>
            <p className="muted">Importe as duas unidades iniciais e os títulos das demais. Tudo entra como rascunho.</p>
            <button
              className="btn btn-primary"
              disabled={seeding}
              onClick={() => (setSeeding(true), run(() => admin('seed')).finally(() => setSeeding(false)))}
            >
              Importar conteúdo inicial (rascunho)
            </button>
          </div>
        )}

        {units.map((u, ui) => {
          const ls = lessons.filter((l) => l.unit_id === u.id);
          return (
            <section key={u.id} className="card stack" aria-labelledby={`au-${u.id}`}>
              <div className="row wrap">
                <MoveButtons index={ui} total={units.length} onMove={move(units, 'Unit')} label={`unidade ${u.title}`} />
                <h2 id={`au-${u.id}`} className="grow" style={{ margin: 0 }}>
                  {ui + 1}. {u.title}
                </h2>
                <StatusBadge status={u.status} />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {u.description}
                {ls.length === 0 && ' · aparece como “Em breve” se publicada'}
              </p>
              {u.reviewed_by && <p className="small muted" style={{ margin: 0 }}>Revisada por {u.reviewed_by}</p>}
              <div className="row wrap">
                <button className="btn btn-ghost btn-sm" onClick={() => setDialog({ type: 'unit', unit: u })}>
                  <Icon name="edit" size={18} /> Editar
                </button>
                <StatusActions entity="Unit" record={u} onDone={reload} onError={setError} />
                <button className="btn btn-ghost btn-sm" onClick={() => setDialog({ type: 'lesson', unit: u })}>
                  <Icon name="plus" size={18} /> Nova etapa
                </button>
                {ls.length === 0 && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clay-700)' }} onClick={() => setDialog({ type: 'delete-unit', unit: u })}>
                    <Icon name="trash" size={18} /> Excluir
                  </button>
                )}
              </div>
              {ls.length > 0 && (
                <ul className="admin-list">
                  {ls.map((l, li) => (
                    <li key={l.id} className="admin-item">
                      <MoveButtons index={li} total={ls.length} onMove={move(ls, 'Lesson')} label={`etapa ${l.title}`} />
                      <span className="title">
                        {li + 1}. {l.title}
                        <br />
                        <span className="small muted">
                          {l.kind === 'revisao_unidade' ? 'Revisão final · ' : ''}
                          {exercises.filter((e) => e.lesson_id === l.id).length} exercícios
                          {l.reviewed_by ? ` · revisada por ${l.reviewed_by}` : ''}
                        </span>
                      </span>
                      <StatusBadge status={l.status} />
                      <span className="row wrap" style={{ width: '100%', justifyContent: 'flex-end' }}>
                        <Link className="btn btn-ghost btn-sm" to={`/admin/licao/${l.id}`}>
                          <Icon name="edit" size={18} /> Editar
                        </Link>
                        <Link className="btn btn-ghost btn-sm" to={`/admin/licao/${l.id}/previa`}>
                          <Icon name="eye" size={18} /> Prévia
                        </Link>
                        <StatusActions entity="Lesson" record={l} onDone={reload} onError={setError} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {units.length > 0 && (
          <button className="btn btn-secondary btn-block" onClick={() => setDialog({ type: 'unit' })}>
            <Icon name="plus" size={18} /> Nova unidade
          </button>
        )}

        {dialog?.type === 'unit' && (
          <UnitDialog
            unit={dialog.unit}
            onClose={() => setDialog(null)}
            onSave={async (data) => {
              await admin('save_unit', { id: dialog.unit?.id, data });
              setDialog(null);
              reload();
            }}
          />
        )}
        {dialog?.type === 'lesson' && <NewLessonDialog unit={dialog.unit} onClose={() => setDialog(null)} />}
        {dialog?.type === 'delete-unit' && (
          <ConfirmDialog title="Excluir unidade?" danger confirmLabel="Excluir" onCancel={() => setDialog(null)} onConfirm={() => (setDialog(null), run(() => admin('delete_unit', { id: dialog.unit.id })))}>
            <p>A unidade “{dialog.unit.title}” será removida.</p>
          </ConfirmDialog>
        )}
      </main>
    </div>
  );
}
