"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteExercise, saveExercise, saveLessonVersion } from "@/app/actions/admin";
import { EXERCISE_TYPES, EXERCISE_TYPE_LABEL } from "@/lib/domain/exercises";
import type { AdminExercise } from "@/lib/data/admin";
import { BLOCK_LABEL, type BlockKind } from "@/content/schema";
import { Button, Notice } from "../ui";

type Block = { kind: BlockKind; title: string; text: string; reference?: string; translation?: string };
type Content = { references?: string[]; context?: string; blocks?: Block[]; takeaways?: string[]; reflection?: string | null };

const inputCls = "min-h-11 w-full rounded-xl border-2 border-line bg-paper px-3 font-semibold";
const areaCls = "w-full rounded-xl border-2 border-line bg-paper p-3 font-semibold";

export function LessonEditor({ versionId, title, objective, content, editable }: { versionId: string; title: string; objective: string; content: Content; editable: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title,
    objective,
    references: (content.references ?? []).join("\n"),
    context: content.context ?? "",
    blocks: (content.blocks ?? []) as Block[],
    takeaways: [0, 1, 2].map((i) => content.takeaways?.[i] ?? ""),
    reflection: content.reflection ?? "",
  });
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await saveLessonVersion(versionId, {
      title: form.title,
      objective: form.objective,
      references: form.references.split("\n").map((s) => s.trim()).filter(Boolean),
      context: form.context,
      blocks: form.blocks.map((b) => ({ ...b, reference: b.reference || undefined, translation: b.translation || undefined })),
      takeaways: form.takeaways,
      reflection: form.reflection.trim() || null,
    });
    setPending(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Salvo." } : { tone: "error", text: res.error });
    if (res.ok) router.refresh();
  }

  const setBlock = (i: number, patch: Partial<Block>) => setForm((f) => ({ ...f, blocks: f.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <fieldset disabled={!editable} className="flex flex-col gap-4 disabled:opacity-80">
        <label className="flex flex-col gap-1 text-sm font-extrabold">
          Título
          <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-extrabold">
          Objetivo
          <input className={inputCls} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-extrabold">
          Referências bíblicas (uma por linha)
          <textarea className={areaCls} rows={3} value={form.references} onChange={(e) => setForm({ ...form, references: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-extrabold">
          Contexto breve
          <textarea className={areaCls} rows={3} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} />
        </label>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-extrabold">Blocos de explicação</p>
          {form.blocks.map((blk, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border-2 border-line p-3">
              <div className="flex gap-2">
                <select className={inputCls} value={blk.kind} onChange={(e) => setBlock(i, { kind: e.target.value as BlockKind })} aria-label="Tipo do bloco">
                  {Object.entries(BLOCK_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, blocks: f.blocks.filter((_, j) => j !== i) }))}>
                  Remover
                </Button>
              </div>
              <input className={inputCls} placeholder="Título do bloco" value={blk.title} onChange={(e) => setBlock(i, { title: e.target.value })} aria-label="Título do bloco" />
              <textarea className={areaCls} rows={3} placeholder="Texto" value={blk.text} onChange={(e) => setBlock(i, { text: e.target.value })} aria-label="Texto do bloco" />
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={inputCls} placeholder="Referência (opcional)" value={blk.reference ?? ""} onChange={(e) => setBlock(i, { reference: e.target.value })} aria-label="Referência do bloco" />
                {blk.kind === "citacao" && (
                  <input className={inputCls} placeholder="Tradução e licença" value={blk.translation ?? ""} onChange={(e) => setBlock(i, { translation: e.target.value })} aria-label="Tradução" />
                )}
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setForm((f) => ({ ...f, blocks: [...f.blocks, { kind: "explicacao", title: "", text: "" }] }))}>
            Adicionar bloco
          </Button>
        </div>
        {form.takeaways.map((t, i) => (
          <label key={i} className="flex flex-col gap-1 text-sm font-extrabold">
            Aprendizado {i + 1}
            <input className={inputCls} value={t} onChange={(e) => setForm((f) => ({ ...f, takeaways: f.takeaways.map((x, j) => (j === i ? e.target.value : x)) }))} />
          </label>
        ))}
        <label className="flex flex-col gap-1 text-sm font-extrabold">
          Reflexão pessoal (opcional, sem nota)
          <input className={inputCls} value={form.reflection} onChange={(e) => setForm({ ...form, reflection: e.target.value })} />
        </label>
      </fieldset>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
      {editable && (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar rascunho"}
        </Button>
      )}
    </form>
  );
}

const TEMPLATES: Record<string, { data: unknown; solution: unknown }> = {
  multiple_choice: { data: { options: [{ id: "o1", text: "" }, { id: "o2", text: "" }, { id: "o3", text: "" }] }, solution: { optionId: "o1" } },
  true_false: { data: {}, solution: { value: true } },
  fill_blank: { data: { before: "", after: "", options: [{ id: "o1", text: "" }, { id: "o2", text: "" }] }, solution: { optionId: "o1" } },
  matching: {
    data: { left: [{ id: "l1", text: "" }, { id: "l2", text: "" }], right: [{ id: "r1", text: "" }, { id: "r2", text: "" }] },
    solution: { pairs: { l1: "r1", l2: "r2" } },
  },
  ordering: { data: { items: [{ id: "i1", text: "" }, { id: "i2", text: "" }] }, solution: { order: ["i1", "i2"] } },
};

export function ExerciseEditor({ versionId, exercise, editable }: { versionId: string; exercise: AdminExercise | null; editable: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => ({
    type: exercise?.type ?? "multiple_choice",
    prompt: exercise?.prompt ?? "",
    data: JSON.stringify(exercise?.data ?? TEMPLATES.multiple_choice.data, null, 2),
    solution: JSON.stringify(exercise?.solution ?? TEMPLATES.multiple_choice.solution, null, 2),
    explanation: exercise?.explanation ?? "",
    reference: exercise?.reference ?? "",
  }));
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    let data: unknown, solution: unknown;
    try {
      data = JSON.parse(form.data);
      solution = JSON.parse(form.solution);
    } catch {
      setResult({ tone: "error", text: "JSON inválido em dados ou solução." });
      return;
    }
    setPending(true);
    const res = await saveExercise({ versionId, exerciseId: exercise?.id ?? null, type: form.type as (typeof EXERCISE_TYPES)[number], prompt: form.prompt, data, solution, explanation: form.explanation, reference: form.reference });
    setPending(false);
    setResult(res.ok ? { tone: "success", text: res.message ?? "Salvo." } : { tone: "error", text: res.error });
    if (res.ok) {
      router.refresh();
      if (!exercise) setOpen(false);
    }
  }

  async function remove() {
    if (!exercise || !window.confirm("Remover este exercício da versão de trabalho?")) return;
    setPending(true);
    const res = await deleteExercise({ versionId, exerciseId: exercise.id });
    setPending(false);
    if (res.ok) router.refresh();
    else setResult({ tone: "error", text: res.error });
  }

  if (!exercise && !open) {
    return editable ? (
      <Button type="button" variant="secondary" size="sm" icon="plus" onClick={() => setOpen(true)}>
        Novo exercício
      </Button>
    ) : null;
  }

  return (
    <details open={!exercise || open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)} className="rounded-xl border-2 border-line bg-paper p-3">
      <summary className="cursor-pointer font-extrabold">
        {exercise ? `${exercise.position}. ${EXERCISE_TYPE_LABEL[exercise.type as keyof typeof EXERCISE_TYPE_LABEL] ?? exercise.type} — ${exercise.prompt}` : "Novo exercício"}
        {exercise && <span className="ml-2 text-xs font-bold text-ink-faint">({exercise.key})</span>}
      </summary>
      <form onSubmit={save} className="mt-3 flex flex-col gap-3">
        <fieldset disabled={!editable} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Tipo
            <select
              className={inputCls}
              value={form.type}
              onChange={(e) => {
                const t = e.target.value;
                setForm((f) => ({ ...f, type: t, ...(exercise ? {} : { data: JSON.stringify(TEMPLATES[t].data, null, 2), solution: JSON.stringify(TEMPLATES[t].solution, null, 2) }) }));
              }}
            >
              {EXERCISE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EXERCISE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Enunciado
            <input className={inputCls} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-extrabold">
              Dados públicos (JSON — sem a resposta)
              <textarea className={`${areaCls} font-mono text-xs`} rows={8} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </label>
            <label className="flex flex-col gap-1 text-sm font-extrabold">
              Solução (JSON — nunca enviada antes da resposta)
              <textarea className={`${areaCls} font-mono text-xs`} rows={8} value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Explicação (feedback)
            <textarea className={areaCls} rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
          </label>
          <label className="flex flex-col gap-1 text-sm font-extrabold">
            Referência
            <input className={inputCls} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </label>
        </fieldset>
        {result && <Notice tone={result.tone}>{result.text}</Notice>}
        {editable && (
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Salvando…" : "Salvar exercício"}
            </Button>
            {exercise && (
              <Button type="button" size="sm" variant="danger" onClick={() => void remove()} disabled={pending}>
                Remover
              </Button>
            )}
          </div>
        )}
      </form>
    </details>
  );
}
