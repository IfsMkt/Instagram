"use client";

import { useEffect, useRef, useState } from "react";
import { submitReviewAnswer, type ReviewFeedback } from "@/app/actions/review";
import type { SessionItem } from "@/lib/data/review";
import { Icon } from "../art/Icon";
import { Sheep } from "../art/Sheep";
import { ExerciseHint, ExerciseView, initialValue, isAnswerReady } from "../lesson/exercises";
import { Confetti, FeedbackPanel, playTone } from "../lesson/feedback";
import { Button, LinkButton, Notice, ProgressBar } from "../ui";

export function ReviewSession({ items, soundEnabled }: { items: SessionItem[]; soundEnabled: boolean }) {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState<unknown>(null);
  const [feedback, setFeedback] = useState<ReviewFeedback | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<{ correct: boolean; xp: number; next: string; title: string }[]>([]);
  const requestId = useRef<string>("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const item = items[index];

  useEffect(() => {
    requestId.current = crypto.randomUUID();
    headingRef.current?.focus();
  }, [index]);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <Sheep mood="calm" size={120} />
        <h1 className="text-2xl font-extrabold">Nada para revisar agora</h1>
        <p className="font-semibold text-ink-soft">Você está em dia. Volte amanhã ou continue sua jornada.</p>
        <LinkButton href="/jornada">Continuar jornada</LinkButton>
      </div>
    );
  }

  if (index >= items.length) {
    const correct = results.filter((r) => r.correct).length;
    const xp = results.reduce((n, r) => n + r.xp, 0);
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-8 text-center">
        <Confetti count={24} />
        <Sheep mood="cheer" size={130} />
        <h1 className="text-3xl font-extrabold">Revisão concluída!</h1>
        <p className="text-lg font-bold text-ink-soft">
          {correct} de {results.length} certas{xp > 0 ? ` · +${xp} XP` : ""}.
        </p>
        <ul className="flex w-full flex-col gap-2 text-left">
          {results.map((r, i) => (
            <li key={i} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
              <Icon name={r.correct ? "check-circle" : "refresh"} size={22} className={r.correct ? "text-green-dark" : "text-coral-dark"} />
              <span className="min-w-0 flex-1 text-sm font-bold">{r.title}</span>
              <span className="shrink-0 text-xs font-extrabold text-ink-soft">{r.next}</span>
            </li>
          ))}
        </ul>
        <div className="grid w-full gap-2 sm:grid-cols-2">
          <LinkButton href="/revisao" variant="secondary">
            Voltar à revisão
          </LinkButton>
          <LinkButton href="/jornada">Continuar jornada</LinkButton>
        </div>
      </div>
    );
  }

  const seed = item.id;
  const current = value ?? initialValue(item.exercise, seed);

  async function check() {
    if (pending) return;
    setPending(true);
    setError("");
    const res = await submitReviewAnswer({ itemId: item.id, requestId: requestId.current, answer: current });
    setPending(false);
    if (!res.ok || !res.data) {
      setError(res.ok ? "Erro." : res.error);
      return;
    }
    setFeedback(res.data);
    if (soundEnabled) playTone(res.data.correct ? "correct" : "wrong");
    setResults((r) => [...r, { correct: res.data!.correct, xp: res.data!.xpAwarded, next: res.data!.nextLabel, title: item.lessonTitle }]);
  }

  function next() {
    setFeedback(null);
    setValue(null);
    setIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex min-h-[80dvh] w-full max-w-2xl flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-3">
        <LinkButton href="/revisao" variant="ghost" size="sm" aria-label="Sair da revisão" icon="close" />
        <ProgressBar value={index / items.length} color="lilac" label="Progresso da revisão" className="flex-1" />
      </div>
      <div key={item.id} className="flex flex-1 flex-col gap-5 animate-rise">
        <div>
          <p className="text-xs font-extrabold uppercase text-ink-faint">
            Relembrando: {item.lessonTitle} · {index + 1} de {items.length}
          </p>
          <ExerciseHint type={item.exercise.type} />
          <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-2xl font-extrabold outline-none">
            {item.exercise.prompt}
          </h1>
        </div>
        <ExerciseView exercise={item.exercise} value={current} onChange={setValue} disabled={!!feedback || pending} solution={feedback?.solution ?? null} seed={seed} />
        {feedback && (
          <>
            <FeedbackPanel correct={feedback.correct} explanation={feedback.explanation} reference={feedback.reference} />
            <p className="text-sm font-bold text-ink-soft">
              <Icon name="review" size={16} className="mr-1 inline" /> Próximo passo: {feedback.nextLabel}
              {feedback.xpAwarded > 0 ? ` · +${feedback.xpAwarded} XP` : ""}
            </p>
            {feedback.achievements.length > 0 && <Notice tone="success">Nova conquista: {feedback.achievements.join(", ")}!</Notice>}
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="mt-auto">
          {feedback ? (
            <Button size="lg" block onClick={next} iconRight="arrow-right">
              {index + 1 < items.length ? "Próxima" : "Ver resultado"}
            </Button>
          ) : (
            <Button size="lg" block onClick={() => void check()} disabled={pending || !isAnswerReady(item.exercise, current)}>
              {pending ? "Verificando…" : "Verificar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
