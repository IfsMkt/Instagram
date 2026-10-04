// Caderno pessoal: anotações, reflexões e referências favoritas (privados).
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { Alert, ConfirmDialog, Dialog, Empty, ErrorState, Loading } from '../components/ui.jsx';
import { useApp } from '../state/AppState.jsx';
import { backend } from '../api/backend.js';
import { formatDate } from '../lib/format.js';

const TABS = [
  ['anotacao', 'Anotações'],
  ['reflexao', 'Reflexões'],
  ['favoritos', 'Favoritos'],
];

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

function NoteForm({ initial, kind, onSave, onCancel }) {
  const [form, setForm] = useState({ title: initial?.title || '', reference: initial?.reference || '', body: initial?.body || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (!form.body.trim()) return setError(new Error('Escreva algo antes de salvar.'));
    setBusy(true);
    try {
      await onSave({ ...form, title: form.title.trim(), reference: form.reference.trim(), body: form.body.trim() });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }
  return (
    <Dialog title={initial ? 'Editar registro' : kind === 'reflexao' ? 'Nova reflexão' : 'Nova anotação'} onClose={onCancel}>
      <form className="stack" onSubmit={submit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <label className="field">
          <span>Título (opcional)</span>
          <input className="input" value={form.title} onChange={set('title')} maxLength={120} />
        </label>
        <label className="field">
          <span>Referência bíblica (opcional)</span>
          <input className="input" value={form.reference} onChange={set('reference')} placeholder="Ex.: Gênesis 1:1" maxLength={80} />
        </label>
        {initial?.prompt && <p className="small muted">Pergunta: {initial.prompt}</p>}
        <label className="field">
          <span>Texto</span>
          <textarea className="textarea" value={form.body} onChange={set('body')} rows={7} maxLength={8000} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Dialog>
  );
}

function FavoriteForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ reference: initial?.reference || '', label: initial?.label || '', note: initial?.note || '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit(e) {
    e.preventDefault();
    if (!form.reference.trim()) return setError(new Error('Informe a referência, por exemplo "Salmo 23".'));
    setBusy(true);
    try {
      await onSave({ reference: form.reference.trim(), label: form.label.trim(), note: form.note.trim() });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }
  return (
    <Dialog title={initial ? 'Editar favorito' : 'Novo favorito'} onClose={onCancel}>
      <form className="stack" onSubmit={submit}>
        {error && <Alert kind="error">{error.message}</Alert>}
        <label className="field">
          <span>Referência bíblica</span>
          <input className="input" value={form.reference} onChange={set('reference')} placeholder="Ex.: Salmo 23" maxLength={80} />
        </label>
        <label className="field">
          <span>Nome (opcional)</span>
          <input className="input" value={form.label} onChange={set('label')} maxLength={120} />
        </label>
        <label className="field">
          <span>Por que esta passagem é especial? (opcional)</span>
          <textarea className="textarea" value={form.note} onChange={set('note')} rows={4} maxLength={2000} />
        </label>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Dialog>
  );
}

export default function Notebook() {
  const { toast } = useApp();
  const [tab, setTab] = useState('anotacao');
  const [query, setQuery] = useState('');
  const [state, setState] = useState({ status: 'loading' });
  const [editing, setEditing] = useState(null); // { type: 'note'|'fav', record? }
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: s.status === 'ready' ? 'ready' : 'loading' }));
    try {
      const [notes, favorites] = await Promise.all([backend.entities.Note.list('-updated_date'), backend.entities.Favorite.list('-created_date')]);
      setState({ status: 'ready', notes, favorites });
    } catch (error) {
      setState({ status: 'error', error });
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const q = norm(query.trim());
  const list = useMemo(() => {
    if (state.status !== 'ready') return [];
    if (tab === 'favoritos') return state.favorites.filter((f) => !q || norm(`${f.reference} ${f.label} ${f.note}`).includes(q));
    return state.notes.filter((n) => (n.kind || 'anotacao') === tab).filter((n) => !q || norm(`${n.title} ${n.reference} ${n.body} ${n.lesson_title}`).includes(q));
  }, [state, tab, q]);

  async function saveNote(data) {
    if (editing.record) await backend.entities.Note.update(editing.record.id, data);
    else await backend.entities.Note.create({ ...data, kind: tab === 'reflexao' ? 'reflexao' : 'anotacao' });
    setEditing(null);
    toast('Salvo no seu caderno.');
    load();
  }
  async function saveFav(data) {
    if (editing.record) await backend.entities.Favorite.update(editing.record.id, data);
    else await backend.entities.Favorite.create(data);
    setEditing(null);
    toast('Favorito salvo.');
    load();
  }
  async function confirmDelete() {
    setBusy(true);
    try {
      if (deleting.type === 'fav') await backend.entities.Favorite.delete(deleting.record.id);
      else await backend.entities.Note.delete(deleting.record.id);
      toast('Registro excluído.');
      setDeleting(null);
      load();
    } catch (e) {
      toast(`Não foi possível excluir: ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Caderno</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing({ type: tab === 'favoritos' ? 'fav' : 'note' })}>
          <Icon name="plus" size={18} /> Novo
        </button>
      </div>
      <p className="small muted row" style={{ marginTop: -6 }}>
        <Icon name="shield" size={16} /> Seus registros são privados: só você pode vê-los.
      </p>
      <div className="tabs" role="tablist" aria-label="Seções do caderno">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} id={`tab-${k}`} aria-controls="painel-caderno">
            {label}
          </button>
        ))}
      </div>
      <label className="field" style={{ marginBottom: 14 }}>
        <span className="sr-only">Buscar no caderno</span>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: 13, color: 'var(--muted)' }} aria-hidden="true">
            <Icon name="search" size={20} />
          </span>
          <input className="input" type="search" placeholder="Buscar por palavra ou referência" value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 42 }} />
        </div>
      </label>

      <div id="painel-caderno" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' && <ErrorState error={state.error} onRetry={load} />}
        {state.status === 'ready' &&
          (list.length === 0 ? (
            q ? (
              <Empty title="Nada encontrado">Nenhum registro corresponde a “{query}”.</Empty>
            ) : tab === 'favoritos' ? (
              <Empty title="Nenhum favorito ainda" action={<button className="btn btn-secondary" onClick={() => setEditing({ type: 'fav' })}>Adicionar referência</button>}>
                Salve passagens que você quer reencontrar. Nas lições, use o botão “Salvar” ao lado das referências.
              </Empty>
            ) : tab === 'reflexao' ? (
              <Empty title="Nenhuma reflexão ainda">Ao final de cada lição há uma pergunta opcional de reflexão. O que você escrever aparece aqui.</Empty>
            ) : (
              <Empty title="Seu caderno está em branco" action={<button className="btn btn-secondary" onClick={() => setEditing({ type: 'note' })}>Escrever anotação</button>}>
                Anote ideias, dúvidas e descobertas.
              </Empty>
            )
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
              {list.map((r) => (
                <li key={r.id} className="card note-card">
                  {tab === 'favoritos' ? (
                    <>
                      <div className="row spread">
                        <strong className="row">
                          <Icon name="bookmark" size={18} /> {r.reference}
                        </strong>
                      </div>
                      {r.label && <div className="meta">{r.label}</div>}
                      {r.note && <p style={{ margin: '8px 0 0' }}>{r.note}</p>}
                    </>
                  ) : (
                    <>
                      {r.title && <h2 style={{ fontSize: '1.05rem', marginBottom: 2 }}>{r.title}</h2>}
                      <div className="meta">
                        {[r.reference, formatDate(r.updated_date || r.created_date, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}
                      </div>
                      {r.prompt && <p className="small muted" style={{ margin: '6px 0 0' }}>Pergunta: {r.prompt}</p>}
                      <p style={{ margin: '8px 0 0' }}>{r.body}</p>
                    </>
                  )}
                  <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing({ type: tab === 'favoritos' ? 'fav' : 'note', record: r })} aria-label={`Editar ${r.title || r.reference || 'registro'}`}>
                      <Icon name="edit" size={18} /> Editar
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--clay-700)' }} onClick={() => setDeleting({ type: tab === 'favoritos' ? 'fav' : 'note', record: r })} aria-label={`Excluir ${r.title || r.reference || 'registro'}`}>
                      <Icon name="trash" size={18} /> Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </div>

      {editing?.type === 'note' && <NoteForm initial={editing.record} kind={tab} onSave={saveNote} onCancel={() => setEditing(null)} />}
      {editing?.type === 'fav' && <FavoriteForm initial={editing.record} onSave={saveFav} onCancel={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog title="Excluir registro?" danger confirmLabel="Excluir" busy={busy} onCancel={() => setDeleting(null)} onConfirm={confirmDelete}>
          <p>Esta ação não pode ser desfeita.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
