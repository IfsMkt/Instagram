"use client";

import { useId, useMemo, useState } from "react";
import type { IdText, PublicData, PublicExercise, Solution } from "@/lib/domain/exercises";
import { Icon } from "../art/Icon";
import { cx } from "../ui";

/** Embaralhamento estável por semente (a mesma ordem ao recarregar a página). */
export function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export type ExerciseProps = {
  exercise: PublicExercise;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled: boolean;
  /** Solução revelada após a resposta (null antes de responder). */
  solution: unknown | null;
  seed: string;
};

/** Diz se a resposta atual está completa o bastante para verificar. */
export function isAnswerReady(exercise: PublicExercise, value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const v = value as Record<string, unknown>;
  switch (exercise.type) {
    case "multiple_choice":
    case "fill_blank":
      return typeof v.optionId === "string";
    case "true_false":
      return typeof v.value === "boolean";
    case "matching":
      return Object.keys((v.pairs as object) ?? {}).length === (exercise.data as PublicData["matching"]).left.length;
    case "ordering":
      return Array.isArray(v.order);
  }
}

export function ExerciseView(props: ExerciseProps) {
  switch (props.exercise.type) {
    case "multiple_choice":
      return <ChoiceExercise {...props} />;
    case "fill_blank":
      return <FillBlankExercise {...props} />;
    case "true_false":
      return <TrueFalseExercise {...props} />;
    case "matching":
      return <MatchingExercise {...props} />;
    case "ordering":
      return <OrderingExercise {...props} />;
  }
}

const TYPE_HINT: Record<PublicExercise["type"], string> = {
  multiple_choice: "Escolha uma alternativa",
  true_false: "Verdadeiro ou falso?",
  fill_blank: "Complete a frase",
  matching: "Toque em um item da esquerda e depois no par da direita",
  ordering: "Use as setas para colocar na ordem certa",
};

export function ExerciseHint({ type }: { type: PublicExercise["type"] }) {
  return <p className="text-sm font-extrabold uppercase tracking-wide text-lilac-dark">{TYPE_HINT[type]}</p>;
}

function OptionCard({
  name,
  option,
  checked,
  onSelect,
  disabled,
  state,
  letter,
}: {
  name: string;
  option: IdText;
  checked: boolean;
  onSelect: () => void;
  disabled: boolean;
  state: "neutral" | "correct" | "wrong";
  letter: string;
}) {
  return (
    <label
      className={cx(
        "btn-3d flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-base font-bold transition-colors",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue",
        state === "correct" && "border-green bg-green-soft text-green-ink [--btn-shadow:var(--color-green)]",
        state === "wrong" && "border-coral bg-coral-soft text-coral-dark [--btn-shadow:var(--color-coral)]",
        state === "neutral" && checked && "border-blue bg-blue-soft text-blue-dark [--btn-shadow:var(--color-blue)]",
        state === "neutral" && !checked && "border-line bg-paper [--btn-shadow:var(--color-line)]",
        disabled && "cursor-default",
      )}
    >
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onSelect} disabled={disabled} />
      <span
        aria-hidden
        className={cx(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-extrabold",
          checked ? "border-current" : "border-line text-ink-soft",
        )}
      >
        {state === "correct" ? <Icon name="check" size={18} /> : state === "wrong" ? <Icon name="close" size={18} /> : letter}
      </span>
      <span className="min-w-0 flex-1">{option.text}</span>
      {state === "correct" && <span className="sr-only">(resposta certa)</span>}
      {state === "wrong" && <span className="sr-only">(sua resposta, incorreta)</span>}
    </label>
  );
}

function ChoiceList({ options, value, onChange, disabled, solution, seed, label }: {
  options: IdText[];
  value: unknown;
  onChange: (v: unknown) => void;
  disabled: boolean;
  solution: unknown | null;
  seed: string;
  label: string;
}) {
  const name = useId();
  const shuffled = useMemo(() => stableShuffle(options, seed), [options, seed]);
  const selected = (value as { optionId?: string } | null)?.optionId;
  const correctId = (solution as Solution["multiple_choice"] | null)?.optionId;
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-3">
      {shuffled.map((o, i) => (
        <OptionCard
          key={o.id}
          name={name}
          option={o}
          letter={String.fromCharCode(65 + i)}
          checked={selected === o.id}
          onSelect={() => onChange({ optionId: o.id })}
          disabled={disabled}
          state={correctId ? (o.id === correctId ? "correct" : selected === o.id ? "wrong" : "neutral") : "neutral"}
        />
      ))}
    </div>
  );
}

function ChoiceExercise({ exercise, ...rest }: ExerciseProps) {
  const data = exercise.data as PublicData["multiple_choice"];
  return <ChoiceList options={data.options} label={exercise.prompt} {...rest} />;
}

function FillBlankExercise({ exercise, value, solution, ...rest }: ExerciseProps) {
  const data = exercise.data as PublicData["fill_blank"];
  const selectedId = (value as { optionId?: string } | null)?.optionId;
  const shownId = (solution as Solution["fill_blank"] | null)?.optionId ?? selectedId;
  const shown = data.options.find((o) => o.id === shownId);
  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-2xl border-2 border-dashed border-lilac/50 bg-lilac-soft/60 px-4 py-4 text-lg font-bold leading-relaxed text-ink">
        {data.before}{" "}
        <span
          className={cx(
            "inline-block min-w-24 rounded-xl border-b-4 px-2 text-center",
            shown ? "border-lilac-dark bg-paper text-lilac-dark" : "border-ink-faint text-ink-faint",
          )}
        >
          {shown ? shown.text : "_____"}
        </span>{" "}
        {data.after}
      </p>
      <ChoiceList options={data.options} label="Opções para completar a frase" value={value} solution={solution} {...rest} />
    </div>
  );
}

function TrueFalseExercise({ value, onChange, disabled, solution, exercise }: ExerciseProps) {
  const name = useId();
  const selected = (value as { value?: boolean } | null)?.value;
  const correct = (solution as Solution["true_false"] | null)?.value;
  const opts: { v: boolean; label: string; icon: "check" | "close" }[] = [
    { v: true, label: "Verdadeiro", icon: "check" },
    { v: false, label: "Falso", icon: "close" },
  ];
  return (
    <div role="radiogroup" aria-label={exercise.prompt} className="grid grid-cols-2 gap-3">
      {opts.map((o) => {
        const state = correct === undefined ? "neutral" : o.v === correct ? "correct" : selected === o.v ? "wrong" : "neutral";
        const checked = selected === o.v;
        return (
          <label
            key={String(o.v)}
            className={cx(
              "btn-3d flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 text-lg font-extrabold",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue",
              state === "correct" && "border-green bg-green-soft text-green-ink",
              state === "wrong" && "border-coral bg-coral-soft text-coral-dark",
              state === "neutral" && checked && "border-blue bg-blue-soft text-blue-dark",
              state === "neutral" && !checked && "border-line bg-paper [--btn-shadow:var(--color-line)]",
            )}
          >
            <input type="radio" name={name} className="sr-only" checked={checked} disabled={disabled} onChange={() => onChange({ value: o.v })} />
            <Icon name={o.icon} size={28} />
            {o.label}
            {state === "correct" && <span className="sr-only">(resposta certa)</span>}
          </label>
        );
      })}
    </div>
  );
}

const PAIR_COLORS = ["bg-blue-soft border-blue", "bg-yellow-soft border-yellow", "bg-lilac-soft border-lilac", "bg-teal-soft border-teal", "bg-orange-soft border-orange", "bg-coral-soft border-coral"];

function MatchingExercise({ exercise, value, onChange, disabled, solution, seed }: ExerciseProps) {
  const data = exercise.data as PublicData["matching"];
  const right = useMemo(() => stableShuffle(data.right, `${seed}:r`), [data.right, seed]);
  const pairs = ((value as { pairs?: Record<string, string> } | null)?.pairs ?? {}) as Record<string, string>;
  const correctPairs = (solution as Solution["matching"] | null)?.pairs;
  const [activeLeft, setActiveLeft] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const pairIndex = (leftId: string) => data.left.findIndex((l) => l.id === leftId);
  const leftOfRight = (rightId: string) => Object.entries(pairs).find(([, r]) => r === rightId)?.[0];

  function chooseLeft(id: string) {
    if (disabled) return;
    if (pairs[id]) {
      const next = { ...pairs };
      delete next[id];
      onChange({ pairs: next });
      setAnnounce(`Par desfeito: ${data.left.find((l) => l.id === id)?.text}.`);
      setActiveLeft(id);
      return;
    }
    setActiveLeft(id);
    setAnnounce(`Selecionado: ${data.left.find((l) => l.id === id)?.text}. Agora escolha o par na coluna da direita.`);
  }

  function chooseRight(id: string) {
    if (disabled) return;
    const owner = leftOfRight(id);
    if (!activeLeft) {
      if (owner) {
        const next = { ...pairs };
        delete next[owner];
        onChange({ pairs: next });
        setAnnounce("Par desfeito.");
      } else setAnnounce("Primeiro escolha um item da coluna da esquerda.");
      return;
    }
    const next = { ...pairs };
    if (owner) delete next[owner];
    next[activeLeft] = id;
    onChange({ pairs: next });
    setAnnounce(`Ligado: ${data.left.find((l) => l.id === activeLeft)?.text} com ${data.right.find((r) => r.id === id)?.text}.`);
    const nextFree = data.left.find((l) => !next[l.id]);
    setActiveLeft(nextFree ? nextFree.id : null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <ul className="flex flex-col gap-3" aria-label="Itens para associar">
          {data.left.map((l) => {
            const paired = pairs[l.id];
            const idx = pairIndex(l.id);
            const ok = correctPairs ? correctPairs[l.id] === pairs[l.id] : null;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={activeLeft === l.id}
                  onClick={() => chooseLeft(l.id)}
                  className={cx(
                    "btn-3d flex min-h-16 w-full items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold [--btn-shadow:var(--color-line)]",
                    paired ? PAIR_COLORS[idx % PAIR_COLORS.length] : "border-line bg-paper",
                    activeLeft === l.id && "ring-4 ring-blue/40",
                  )}
                >
                  {paired && (
                    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-white">
                      {idx + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">{l.text}</span>
                  {ok === true && <Icon name="check" size={18} className="text-green-dark" label="correto" />}
                  {ok === false && <Icon name="close" size={18} className="text-coral-dark" label="incorreto" />}
                </button>
              </li>
            );
          })}
        </ul>
        <ul className="flex flex-col gap-3" aria-label="Pares possíveis">
          {right.map((r) => {
            const owner = leftOfRight(r.id);
            const idx = owner ? pairIndex(owner) : -1;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => chooseRight(r.id)}
                  aria-label={owner ? `${r.text} (ligado a ${data.left[idx].text})` : r.text}
                  className={cx(
                    "btn-3d flex min-h-16 w-full items-center gap-2 rounded-2xl border-2 px-3 py-2 text-left text-sm font-bold [--btn-shadow:var(--color-line)]",
                    owner ? PAIR_COLORS[idx % PAIR_COLORS.length] : "border-line bg-paper",
                  )}
                >
                  {owner && (
                    <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs text-white">
                      {idx + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">{r.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {correctPairs && Object.entries(correctPairs).some(([l, r]) => pairs[l] !== r) && (
        <div className="rounded-2xl bg-green-soft px-4 py-3 text-sm font-bold text-green-ink">
          <p className="mb-1 font-extrabold">Pares certos:</p>
          <ul className="list-disc pl-5">
            {data.left.map((l) => (
              <li key={l.id}>
                {l.text} → {data.right.find((r) => r.id === correctPairs[l.id])?.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OrderingExercise({ exercise, value, onChange, disabled, solution, seed }: ExerciseProps) {
  const data = exercise.data as PublicData["ordering"];
  const initial = useMemo(() => stableShuffle(data.items, `${seed}:o`).map((i) => i.id), [data.items, seed]);
  const order = ((value as { order?: string[] } | null)?.order ?? initial) as string[];
  const correct = (solution as Solution["ordering"] | null)?.order;
  const [announce, setAnnounce] = useState("");
  const textOf = (id: string) => data.items.find((i) => i.id === id)?.text ?? "";

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length || disabled) return;
    const next = order.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ order: next });
    setAnnounce(`${textOf(order[index])} agora está na posição ${target + 1}.`);
  }

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3" aria-label="Itens para ordenar">
        {order.map((id, i) => {
          const ok = correct ? correct[i] === id : null;
          return (
            <li
              key={id}
              className={cx(
                "flex items-center gap-2 rounded-2xl border-2 bg-paper py-2 pl-3 pr-2 shadow-[0_3px_0_0_var(--color-line)]",
                ok === true ? "border-green bg-green-soft" : ok === false ? "border-coral bg-coral-soft" : "border-line",
              )}
            >
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-soft text-sm font-extrabold text-lilac-dark">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold">{textOf(id)}</span>
              {ok === true && <Icon name="check" size={18} className="text-green-dark" label="posição correta" />}
              {ok === false && <Icon name="close" size={18} className="text-coral-dark" label="posição incorreta" />}
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={disabled || i === 0}
                  aria-label={`Subir “${textOf(id)}”`}
                  className="flex h-9 w-11 items-center justify-center rounded-xl border-2 border-line bg-cream text-ink disabled:opacity-30"
                >
                  <Icon name="up" size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={disabled || i === order.length - 1}
                  aria-label={`Descer “${textOf(id)}”`}
                  className="flex h-9 w-11 items-center justify-center rounded-xl border-2 border-line bg-cream text-ink disabled:opacity-30"
                >
                  <Icon name="down" size={20} />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {correct && correct.some((id, i) => order[i] !== id) && (
        <div className="rounded-2xl bg-green-soft px-4 py-3 text-sm font-bold text-green-ink">
          <p className="mb-1 font-extrabold">Ordem certa:</p>
          <ol className="list-decimal pl-5">
            {correct.map((id) => (
              <li key={id}>{textOf(id)}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Ordenação conta como "pronta" assim que a pessoa interage; garante valor inicial. */
export function initialValue(exercise: PublicExercise, seed: string): unknown {
  if (exercise.type === "ordering") {
    const data = exercise.data as PublicData["ordering"];
    return { order: stableShuffle(data.items, `${seed}:o`).map((i) => i.id) };
  }
  return null;
}
