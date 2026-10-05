"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { addFavorite, deleteFavorite, deleteNote, saveNote } from "@/app/actions/notebook";
import { Icon } from "../art/Icon";
import { Sheep } from "../art/Sheep";
import { Button, cx, Notice } from "../ui";

type Note = { id: string; kind: "note" | "reflection"; title: string; body: string; reference: string; created_at: string; updated_at: string };
type Favorite = { id: string; reference: string; note: string; created_at: string };

const TABS = [
  { id: "anotacoes", label: "Anotações", icon: "pen" as const },
  { id: "reflexoes", label: "Reflexões", icon: "heart" as const },
  { id: "favoritos", label: "Favoritos", icon: "star" as const },
];

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });

export function Notebook({ tab, query, notes, favorites, loadError }: { tab: string; query: string; notes: Note[]; favorites: Favorite[]; loadError: string | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Note | "new" | null>(null);
  const [toast, setToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [confirm, setConfirm] = useState<{ type: "note" | "favorite"; id: string; label: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const list = tab === "reflexoes" ? notes.filter((n) => n.kind === "reflection") : notes.filter((n) => n.kind === "note");

  function hrefFor(t: string, q = query) {
    const p = new URLSearchParams();
    if (t !== "anotacoes") p.set("aba", t);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/caderno${s ? `?${s}` : ""}`;
  }

  async function doDelete() {
    if (!confirm || busy) return;
    setBusy(true);
    const res = confirm.type === "note" ? await deleteNote({ id: confirm.id }) : await deleteFavorite({ id: confirm.id });
    setBusy(false);
    setConfirm(null);
    setToast(res.ok ? { tone: "success", text: res.message ?? "Excluído." } : { tone: "error", text: res.error });
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5">
      <header className="flex items-center gap-3">
        <h1 className="flex-1 text-3xl font-extrabold">Meu caderno</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-lilac-soft px-3 py-1 text-xs font-extrabold text-lilac-dark">
          <Icon name="lock" size={14} /> Privado
        </span>
      </header>

      <form action="/caderno" role="search" className="relative">
        {tab !== "anotacoes" && <input type="hidden" name="aba" value={tab} />}
        <label htmlFor="busca" className="sr-only">
          Buscar por texto ou referência
        </label>
        <Icon name="search" size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          id="busca"
          name="q"
          defaultValue={query}
          maxLength={80}
          placeholder="Buscar por texto ou referência (ex.: Salmos 23)"
          className="min-h-13 w-full rounded-2xl border-2 border-line bg-paper py-3 pl-12 pr-24 font-semibold focus:border-green focus:outline-none"
        />
        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-green px-3 py-2 text-sm font-extrabold text-white">
          Buscar
        </button>
      </form>
      {query && (
        <p className="text-sm font-bold text-ink-soft">
          Resultados para “{query}”.{" "}
          <Link href={hrefFor(tab, "")} className="text-green-dark underline">
            Limpar busca
          </Link>
        </p>
      )}

      <nav aria-label="Seções do caderno" className="grid grid-cols-3 gap-2">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={hrefFor(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={cx(
              "flex min-h-12 items-center justify-center gap-1.5 rounded-2xl border-2 text-sm font-extrabold",
              tab === t.id ? "border-green bg-green-soft text-green-dark" : "border-line bg-paper text-ink-soft",
            )}
          >
            <Icon name={t.icon} size={18} /> {t.label}
          </Link>
        ))}
      </nav>

      {loadError && <Notice tone="error">{loadError}</Notice>}
      {toast && (
        <Notice tone={toast.tone} className="animate-rise">
          {toast.text}
        </Notice>
      )}

      {tab !== "favoritos" ? (
        <>
          {editing ? (
            <NoteForm
              note={editing === "new" ? null : editing}
              kind={tab === "reflexoes" ? "reflection" : "note"}
              onCancel={() => setEditing(null)}
              onSaved={(msg) => {
                setEditing(null);
                setToast({ tone: "success", text: msg });
                router.refresh();
              }}
            />
          ) : (
            <Button icon="plus" onClick={() => setEditing("new")} block>
              {tab === "reflexoes" ? "Nova reflexão" : "Nova anotação"}
            </Button>
          )}
          {list.length === 0 && !editing ? (
            <Empty text={query ? "Nada encontrado com esse termo." : tab === "reflexoes" ? "Suas reflexões das lições aparecem aqui." : "Anote ideias, dúvidas e descobertas da sua jornada."} />
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((n) => (
                <li key={n.id} className="rounded-3xl border-2 border-line bg-paper p-4">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      {n.title && <h2 className="font-extrabold">{n.title}</h2>}
                      {n.reference && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-extrabold text-blue-dark">
                          <Icon name="book" size={14} /> {n.reference}
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => setEditing(n)} aria-label={`Editar ${n.title || "anotação"}`} className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-cream-deep">
                      <Icon name="pen" size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ type: "note", id: n.id, label: n.title || "esta anotação" })}
                      aria-label={`Excluir ${n.title || "anotação"}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-coral-dark hover:bg-coral-soft"
                    >
                      <Icon name="trash" size={20} />
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap font-semibold text-ink">{n.body}</p>
                  <p className="mt-2 text-xs font-bold text-ink-faint">{dateFmt.format(new Date(n.updated_at))}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <FavoriteForm
            onSaved={(msg) => {
              setToast({ tone: "success", text: msg });
              router.refresh();
            }}
            onError={(msg) => setToast({ tone: "error", text: msg })}
          />
          {favorites.length === 0 ? (
            <Empty text={query ? "Nenhum favorito com esse termo." : "Toque na estrela de uma referência durante a lição para guardá-la aqui."} />
          ) : (
            <ul className="flex flex-col gap-2">
              {favorites.map((f) => (
                <li key={f.id} className="flex items-center gap-3 rounded-2xl border-2 border-line bg-paper p-3">
                  <Icon name="star" size={22} className="shrink-0 fill-yellow text-yellow-dark" />
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{f.reference}</p>
                    {f.note && <p className="text-sm font-semibold text-ink-soft">{f.note}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: "favorite", id: f.id, label: f.reference })}
                    aria-label={`Remover ${f.reference} dos favoritos`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-coral-dark hover:bg-coral-soft"
                  >
                    <Icon name="trash" size={20} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {confirm && <ConfirmDialog label={confirm.label} busy={busy} onCancel={() => setConfirm(null)} onConfirm={() => void doDelete()} />}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-6 text-center">
      <Sheep mood="calm" size={80} label="" />
      <p className="font-bold text-ink-soft">{text}</p>
    </div>
  );
}

function ConfirmDialog({ label, busy, onCancel, onConfirm }: { label: string; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="confirmar-titulo"
      className="m-auto w-[min(92vw,26rem)] rounded-3xl border-2 border-line bg-paper p-6 backdrop:bg-ink/40"
    >
      <h2 id="confirmar-titulo" className="text-xl font-extrabold">
        Excluir “{label}”?
      </h2>
      <p className="mt-2 font-semibold text-ink-soft">Essa ação não pode ser desfeita.</p>
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" block onClick={onCancel} autoFocus>
          Cancelar
        </Button>
        <Button variant="danger" block onClick={onConfirm} disabled={busy}>
          {busy ? "Excluindo…" : "Excluir"}
        </Button>
      </div>
    </dialog>
  );
}

function NoteForm({ note, kind, onCancel, onSaved }: { note: Note | null; kind: "note" | "reflection"; onCancel: () => void; onSaved: (msg: string) => void }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [reference, setReference] = useState(note?.reference ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    const res = await saveNote({ id: note?.id ?? null, title, reference, body, kind: note?.kind ?? kind });
    setSaving(false);
    if (res.ok) onSaved(res.message ?? "Salvo.");
    else setError(res.error);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-3xl border-2 border-green/40 bg-green-soft/40 p-4 animate-rise">
      <h2 className="text-lg font-extrabold">{note ? "Editar" : kind === "reflection" ? "Nova reflexão" : "Nova anotação"}</h2>
      {error && <Notice tone="error">{error}</Notice>}
      <label className="flex flex-col gap-1 text-sm font-extrabold">
        Título (opcional)
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 font-semibold focus:border-green focus:outline-none" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-extrabold">
        Referência (opcional)
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          maxLength={80}
          placeholder="Ex.: João 3:16"
          className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 font-semibold focus:border-green focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-extrabold">
        Texto
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          rows={5}
          required
          className="rounded-2xl border-2 border-line bg-paper p-3 font-semibold focus:border-green focus:outline-none"
        />
      </label>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} block>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving || !body.trim()} block>
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}

function FavoriteForm({ onSaved, onError }: { onSaved: (msg: string) => void; onError: (msg: string) => void }) {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const res = await addFavorite({ reference, note });
    setSaving(false);
    if (res.ok) {
      setReference("");
      setNote("");
      onSaved(res.message ?? "Salvo.");
    } else onError(res.error);
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-3xl bg-yellow-soft/60 p-4 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm font-extrabold">
        Referência
        <input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={80} required placeholder="Ex.: Salmos 23:1" className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 font-semibold focus:border-green focus:outline-none" />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-sm font-extrabold">
        Nota (opcional)
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} className="min-h-12 rounded-2xl border-2 border-line bg-paper px-3 font-semibold focus:border-green focus:outline-none" />
      </label>
      <Button type="submit" disabled={saving || reference.trim().length < 2} icon="star">
        {saving ? "Salvando…" : "Favoritar"}
      </Button>
    </form>
  );
}
