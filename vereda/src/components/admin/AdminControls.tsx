"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/types";
import { Button, Notice } from "../ui";
import type { IconName } from "../art/Icon";

/** Botão que executa uma Server Action (já vinculada aos argumentos) e mostra o resultado. */
export function ActionButton({
  action,
  label,
  confirmText,
  variant = "secondary",
  size = "sm",
  icon,
  disabled,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  confirmText?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
  icon?: IconName;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  async function run() {
    if (pending) return;
    if (confirmText && !window.confirm(confirmText)) return;
    setPending(true);
    setResult(null);
    const res = await action();
    setPending(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Feito." } : { tone: "error", text: res.error });
    if (res.ok) router.refresh();
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <Button type="button" variant={variant} size={size} onClick={() => void run()} disabled={pending || disabled} icon={icon}>
        {pending ? "Aguarde…" : label}
      </Button>
      {result && (
        <span role="status" className={result.tone === "success" ? "text-xs font-bold text-green-dark" : "text-xs font-bold text-coral-dark"}>
          {result.text}
        </span>
      )}
    </span>
  );
}

/** Formulário de metadados (personagem/trilha/unidade). */
export function EntityForm({
  fields,
  initial,
  onSave,
  published,
}: {
  fields: { name: string; label: string; multiline?: boolean; options?: string[] }[];
  initial: Record<string, string>;
  onSave: (changes: Record<string, string>) => Promise<ActionResult<unknown>>;
  published: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const changes: Record<string, string> = {};
    for (const f of fields) if (values[f.name] !== initial[f.name]) changes[f.name] = values[f.name];
    const res = await onSave(changes);
    setPending(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Salvo." } : { tone: "error", text: res.error });
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      {published && <Notice tone="info">Este item está publicado: as alterações ficam pendentes e só entram no ar ao publicar novamente.</Notice>}
      {fields.map((f) => (
        <label key={f.name} className="flex flex-col gap-1 text-sm font-extrabold">
          {f.label}
          {f.options ? (
            <select
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 font-semibold"
            >
              {f.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.multiline ? (
            <textarea
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              rows={3}
              className="rounded-xl border-2 border-line bg-paper p-3 font-semibold"
            />
          ) : (
            <input
              value={values[f.name] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              className="min-h-11 rounded-xl border-2 border-line bg-paper px-3 font-semibold"
            />
          )}
        </label>
      ))}
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
        {result && (
          <span role="status" className={result.tone === "success" ? "text-sm font-bold text-green-dark" : "text-sm font-bold text-coral-dark"}>
            {result.text}
          </span>
        )}
      </div>
    </form>
  );
}

/** Revisão/publicação em lote com confirmação explícita de quem revisou. */
export function BulkPanel({ onRun, scopeLabel }: { onRun: (action: "review" | "publish", confirmed: boolean) => Promise<ActionResult<unknown>>; scopeLabel: string }) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  async function run(action: "review" | "publish") {
    setPending(action);
    const res = await onRun(action, confirmed);
    setPending(null);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Feito." } : { tone: "error", text: res.error });
    if (res.ok) router.refresh();
  }
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-lilac/50 bg-lilac-soft/40 p-4">
      <p className="text-sm font-extrabold">Ações em lote — {scopeLabel}</p>
      <label className="flex items-start gap-2 text-sm font-semibold">
        <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-5 w-5" />
        Confirmo que eu, uma pessoa da equipe editorial, li este conteúdo na prévia e verifiquei referências, fatos e o tom.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={!confirmed || !!pending} onClick={() => void run("review")}>
          {pending === "review" ? "Aguarde…" : "Marcar rascunhos como revisados"}
        </Button>
        <Button size="sm" disabled={!confirmed || !!pending} onClick={() => void run("publish")}>
          {pending === "publish" ? "Aguarde…" : "Publicar itens revisados"}
        </Button>
      </div>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
    </div>
  );
}
