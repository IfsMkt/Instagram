"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { beginAttempt, completeAttempt, saveStep, submitAnswer, type AnswerFeedback, type CompletionResult } from "@/app/actions/lesson";
import { saveNote, toggleFavorite } from "@/app/actions/notebook";
import type { LessonBlock, LessonContent } from "@/lib/data/content";
import type { PublicExercise } from "@/lib/domain/exercises";
import { BLOCK_LABEL, type BlockKind } from "@/content/schema";
import { Character } from "../art/Character";
import { Icon } from "../art/Icon";
import { Sheep } from "../art/Sheep";
import { colorClasses } from "../art/palette";
import { Bubble, Button, cx, LinkButton, Notice, ProgressBar } from "../ui";
import { ExerciseHint, ExerciseView, initialValue, isAnswerReady } from "./exercises";
import { Confetti, FeedbackPanel, playTone } from "./feedback";

type Step = { type: "intro" } | { type: "block"; block: LessonBlock } | { type: "exercise"; exercise: PublicExercise; index: number } | { type: "summary" };

type Props = {
  lesson: LessonContent;
  trackSlug: string;
  trackTitle: string;
  characterSlug: string | null;
  color: string;
  preview: boolean;
  soundEnabled: boolean;
  favorites: string[];
  exitHref: string;
};

const BLOCK_COLORS: Record<string, string> = {
  resumo: "blue",
  contexto: "yellow",
  explicacao: "green",
  interpretacao: "lilac",
  tradicoes: "teal",
  citacao: "coral",
};

export function LessonPlayer({ lesson, trackSlug, trackTitle, characterSlug, color, preview, soundEnabled, favorites, exitHref }: Props) {
  const router = useRouter();
  const steps: Step[] = useMemo(
    () => [
      { type: "intro" },
      ...lesson.blocks.map((block) => ({ type: "block" as const, block })),
      ...lesson.exercises.map((exercise, index) => ({ type: "exercise" as const, exercise, index })),
      { type: "summary" },
    ],
    [lesson],
  );

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string>("");
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);
  const [actionError, setActionError] = useState<string>("");
  const [completing, setCompleting] = useState(false);
  const [completion, setCompletion] = useState<CompletionResult | null>(null);
  const [favs, setFavs] = useState<Set<string>>(() => new Set(favorites));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const c = colorClasses(color);

  const load = useCallback(async () => {
    setLoadState("loading");
    const res = await beginAttempt({ lessonId: lesson.lessonId, trackSlug, preview });
    if (!res.ok || !res.data) {
      setLoadError(res.ok ? "Não foi possível abrir a lição." : res.error);
      setLoadState("error");
      return;
    }
    if (res.data.versionId !== lesson.versionId) {
      // A tentativa aberta usa outra versão do conteúdo: recarrega com ela.
      router.refresh();
      return;
    }
    setAttemptId(res.data.attemptId);
    setFeedback(res.data.answers);
    const answeredValues: Record<string, unknown> = {};
    for (const [k, f] of Object.entries(res.data.answers)) answeredValues[k] = f.answer;
    setValues(answeredValues);
    // Retoma no ponto salvo, sem pular exercícios ainda não respondidos.
    const firstUnanswered = steps.findIndex((s) => s.type === "exercise" && !res.data!.answers[s.exercise.key]);
    const maxStep = firstUnanswered === -1 ? steps.length - 1 : firstUnanswered;
    setStep(Math.min(res.data.step, maxStep));
    setLoadState("ready");
  }, [lesson.lessonId, lesson.versionId, preview, router, steps, trackSlug]);

  useEffect(() => {
    // Abre/retoma a tentativa ao entrar na página (carregamento de dados externos).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const current = steps[step];

  async function goTo(next: number) {
    setActionError("");
    setStep(next);
    if (attemptId && next > step) {
      const res = await saveStep({ attemptId, step: next });
      if (!res.ok) setActionError("Não conseguimos salvar seu avanço. Ele será salvo na próxima etapa.");
    }
  }

  async function check(exercise: PublicExercise) {
    if (!attemptId || checking) return;
    setChecking(true);
    setActionError("");
    const res = await submitAnswer({ attemptId, exerciseKey: exercise.key, answer: values[exercise.key] ?? initialValue(exercise, attemptId + exercise.key) });
    setChecking(false);
    if (!res.ok || !res.data) {
      setActionError(res.ok ? "Erro ao verificar." : res.error);
      return;
    }
    const fb = res.data;
    setFeedback((f) => ({ ...f, [exercise.key]: fb }));
    setValues((v) => ({ ...v, [exercise.key]: fb.answer }));
    if (soundEnabled) playTone(fb.correct ? "correct" : "wrong");
  }

  async function complete() {
    if (!attemptId || completing) return;
    setCompleting(true);
    setActionError("");
    const res = await completeAttempt({ attemptId });
    setCompleting(false);
    if (!res.ok || !res.data) {
      setActionError(res.ok ? "Erro ao concluir." : res.error);
      return;
    }
    if (soundEnabled) playTone("complete");
    setCompletion(res.data);
  }

  async function onToggleFavorite(reference: string) {
    const res = await toggleFavorite({ reference, lessonId: lesson.lessonId });
    if (res.ok && res.data) {
      const favorited = res.data.favorited;
      setFavs((s) => {
        const n = new Set(s);
        if (favorited) n.add(reference);
        else n.delete(reference);
        return n;
      });
    }
  }

  if (completion) {
    return <CompletionScreen result={completion} lesson={lesson} characterSlug={characterSlug} exitHref={exitHref} preview={preview} />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-6">
      <header className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-cream/95 px-4 py-3 backdrop-blur">
        <Link href={exitHref} aria-label="Sair da lição (seu progresso fica salvo)" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft hover:bg-cream-deep">
          <Icon name="close" size={26} />
        </Link>
        <ProgressBar value={loadState === "ready" ? step / (steps.length - 1) : 0} color={color} label="Progresso na lição" className="flex-1" />
        {preview && <span className="rounded-full bg-yellow-soft px-3 py-1 text-xs font-extrabold text-ink">Prévia</span>}
      </header>

      <main id="conteudo" className="flex flex-1 flex-col">
        {loadState === "loading" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
            <Sheep mood="think" size={120} label="" className="animate-float" />
            <p className="font-bold text-ink-soft">Preparando sua lição…</p>
          </div>
        )}

        {loadState === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Sheep mood="think" size={120} label="" />
            <Notice tone="error">{loadError}</Notice>
            <div className="flex gap-3">
              <Button onClick={() => void load()} icon="refresh">
                Tentar novamente
              </Button>
              <LinkButton href={exitHref} variant="secondary">
                Voltar à jornada
              </LinkButton>
            </div>
          </div>
        )}

        {loadState === "ready" && current && (
          <div key={step} className="flex flex-1 flex-col gap-5 pt-2 animate-rise">
            {current.type === "intro" && (
              <>
                <div className="flex items-end gap-3">
                  {characterSlug ? <Character slug={characterSlug} size={92} label="" /> : <Sheep size={92} label="" />}
                  <Bubble className="flex-1">
                    {lesson.kind === "unit_review" ? "Revisão da unidade! Vamos relembrar tudo com calma." : "Bora para mais um passo? Primeiro eu explico, depois você pratica."}
                  </Bubble>
                </div>
                <div>
                  <p className={cx("text-sm font-extrabold uppercase tracking-wide", c.text)}>{trackTitle}</p>
                  <h1 ref={headingRef} tabIndex={-1} className="mt-1 text-3xl font-extrabold leading-tight outline-none">
                    {lesson.title}
                  </h1>
                </div>
                <div className={cx("rounded-3xl p-5", c.soft)}>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-ink-soft">Objetivo</p>
                  <p className="mt-1 text-lg font-bold">{lesson.objective}</p>
                </div>
                {lesson.context && <p className="text-lg font-semibold leading-relaxed text-ink">{lesson.context}</p>}
                {lesson.references.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-extrabold text-ink-soft">Referências bíblicas</p>
                    <ul className="flex flex-wrap gap-2">
                      {lesson.references.map((r) => (
                        <li key={r}>
                          <button
                            type="button"
                            onClick={() => void onToggleFavorite(r)}
                            aria-pressed={favs.has(r)}
                            aria-label={`${r} — ${favs.has(r) ? "remover dos favoritos" : "salvar nos favoritos"}`}
                            className={cx(
                              "inline-flex min-h-10 items-center gap-1.5 rounded-full border-2 px-3 text-sm font-extrabold",
                              favs.has(r) ? "border-yellow bg-yellow-soft text-ink" : "border-line bg-paper text-ink-soft",
                            )}
                          >
                            <Icon name="star" size={16} className={favs.has(r) ? "fill-yellow text-yellow-dark" : ""} />
                            {r}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="text-sm font-bold text-ink-faint">
                  Cerca de 5 minutos · {lesson.exercises.length} exercícios
                </p>
                <div className="mt-auto">
                  <Button size="lg" block color={color} variant="color" onClick={() => void goTo(1)} iconRight="arrow-right">
                    {step === 0 && Object.keys(feedback).length > 0 ? "Continuar de onde parei" : "Começar"}
                  </Button>
                </div>
              </>
            )}

            {current.type === "block" && (
              <>
                <BlockCard block={current.block} headingRef={headingRef} />
                <StepNav onBack={() => setStep(step - 1)} onNext={() => void goTo(step + 1)} color={color} />
              </>
            )}

            {current.type === "exercise" && (
              <ExerciseStep
                key={current.exercise.key}
                exercise={current.exercise}
                index={current.index}
                total={lesson.exercises.length}
                value={values[current.exercise.key] ?? initialValue(current.exercise, `${attemptId}${current.exercise.key}`)}
                onChange={(v) => setValues((s) => ({ ...s, [current.exercise.key]: v }))}
                feedback={feedback[current.exercise.key] ?? null}
                checking={checking}
                onCheck={() => void check(current.exercise)}
                onNext={() => void goTo(step + 1)}
                seed={`${attemptId}${current.exercise.key}`}
                headingRef={headingRef}
                color={color}
              />
            )}

            {current.type === "summary" && (
              <SummaryStep lesson={lesson} headingRef={headingRef} completing={completing} onComplete={() => void complete()} color={color} preview={preview} />
            )}

            {actionError && <Notice tone="error">{actionError}</Notice>}
          </div>
        )}
      </main>
    </div>
  );
}

function StepNav({ onBack, onNext, color }: { onBack: () => void; onNext: () => void; color: string }) {
  return (
    <div className="mt-auto flex gap-3">
      <Button variant="secondary" onClick={onBack} aria-label="Voltar para a etapa anterior" icon="arrow-left" className="w-14 px-0" />
      <Button size="lg" variant="color" color={color} block onClick={onNext} iconRight="arrow-right">
        Continuar
      </Button>
    </div>
  );
}

function BlockCard({ block, headingRef }: { block: LessonBlock; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  const color = BLOCK_COLORS[block.kind] ?? "green";
  const c = colorClasses(color);
  const label = BLOCK_LABEL[block.kind as BlockKind] ?? "Explicação";
  return (
    <article className="flex flex-col gap-3">
      <span className={cx("inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide", c.soft, c.text)}>
        <Icon name={block.kind === "resumo" || block.kind === "citacao" ? "book" : block.kind === "contexto" ? "compass" : block.kind === "tradicoes" ? "spark" : "info"} size={14} />
        {label}
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold leading-tight outline-none">
        {block.title}
      </h1>
      <div className={cx("rounded-3xl border-2 border-transparent p-5 text-lg font-semibold leading-relaxed", c.soft)}>{block.text}</div>
      {block.reference && (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-paper px-3 py-1 text-sm font-extrabold text-ink-soft">
          <Icon name="book" size={16} /> {block.reference}
          {block.translation ? ` · ${block.translation}` : ""}
        </p>
      )}
      {block.kind === "resumo" && <p className="text-xs font-bold text-ink-faint">Resumo com nossas palavras — não é uma citação literal.</p>}
      {block.kind === "interpretacao" && <p className="text-xs font-bold text-ink-faint">Esta é uma leitura possível; há outras interpretações.</p>}
    </article>
  );
}

function ExerciseStep({
  exercise,
  index,
  total,
  value,
  onChange,
  feedback,
  checking,
  onCheck,
  onNext,
  seed,
  headingRef,
}: {
  exercise: PublicExercise;
  index: number;
  total: number;
  value: unknown;
  onChange: (v: unknown) => void;
  feedback: AnswerFeedback | null;
  checking: boolean;
  onCheck: () => void;
  onNext: () => void;
  seed: string;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  color: string;
}) {
  const ready = isAnswerReady(exercise, value);
  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-extrabold text-ink-faint">
          Exercício {index + 1} de {total}
        </p>
        <ExerciseHint type={exercise.type} />
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold leading-snug outline-none">
          {exercise.prompt}
        </h1>
      </div>
      <ExerciseView exercise={exercise} value={value} onChange={onChange} disabled={!!feedback || checking} solution={feedback?.solution ?? null} seed={seed} />
      {feedback && <FeedbackPanel correct={feedback.correct} explanation={feedback.explanation} reference={feedback.reference} />}
      <div className="mt-auto pt-2">
        {feedback ? (
          <Button size="lg" block variant="color" color={feedback.correct ? "green" : "coral"} onClick={onNext} iconRight="arrow-right">
            Continuar
          </Button>
        ) : (
          <Button size="lg" block onClick={onCheck} disabled={!ready || checking} aria-busy={checking}>
            {checking ? "Verificando…" : "Verificar"}
          </Button>
        )}
      </div>
    </>
  );
}

function SummaryStep({
  lesson,
  headingRef,
  completing,
  onComplete,
  color,
  preview,
}: {
  lesson: LessonContent;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  completing: boolean;
  onComplete: () => void;
  color: string;
  preview: boolean;
}) {
  const [reflection, setReflection] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string>("");
  const [error, setError] = useState("");

  async function saveReflection() {
    if (!reflection.trim() || saving) return;
    setSaving(true);
    setError("");
    const res = await saveNote({
      title: lesson.title,
      body: reflection,
      reference: lesson.references[0] ?? "",
      kind: "reflection",
      lessonId: lesson.lessonId,
    });
    setSaving(false);
    if (res.ok) {
      setSaved(res.message ?? "Reflexão salva.");
      setReflection("");
    } else setError(res.error);
  }

  return (
    <>
      <div className="flex items-end gap-3">
        <Sheep mood="happy" size={80} label="" />
        <Bubble className="flex-1">Antes de concluir, veja o que ficou desta lição.</Bubble>
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-extrabold outline-none">
        Três aprendizados
      </h1>
      <ol className="flex flex-col gap-3">
        {lesson.takeaways.map((t, i) => (
          <li key={i} className="flex items-start gap-3 rounded-2xl border-2 border-line bg-paper p-4 font-bold">
            <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white", colorClasses(color).bg)}>{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>

      {lesson.reflection && (
        <section className="rounded-3xl bg-lilac-soft p-5" aria-labelledby="reflexao-titulo">
          <h2 id="reflexao-titulo" className="flex items-center gap-2 text-lg font-extrabold text-lilac-dark">
            <Icon name="pen" size={20} /> Para refletir (opcional)
          </h2>
          <p className="mt-1 font-semibold">{lesson.reflection}</p>
          <p className="mt-1 text-xs font-bold text-ink-soft">Reflexões não valem nota e ficam só no seu caderno privado.</p>
          {!preview && (
            <>
              <label htmlFor="reflexao" className="sr-only">
                Sua reflexão
              </label>
              <textarea
                id="reflexao"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                maxLength={5000}
                rows={3}
                className="mt-3 w-full rounded-2xl border-2 border-line bg-paper p-3 font-semibold focus:border-lilac focus:outline-none"
                placeholder="Escreva com suas palavras…"
              />
              <div className="mt-2 flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => void saveReflection()} disabled={!reflection.trim() || saving}>
                  {saving ? "Salvando…" : "Salvar no caderno"}
                </Button>
                {saved && (
                  <span role="status" className="text-sm font-bold text-green-dark">
                    {saved}
                  </span>
                )}
              </div>
              {error && <Notice tone="error" className="mt-2">{error}</Notice>}
            </>
          )}
        </section>
      )}

      <div className="mt-auto pt-2">
        <Button size="lg" block onClick={onComplete} disabled={completing} aria-busy={completing} icon="check">
          {completing ? "Concluindo…" : "Concluir lição"}
        </Button>
      </div>
    </>
  );
}

function CompletionScreen({
  result,
  lesson,
  characterSlug,
  exitHref,
  preview,
}: {
  result: CompletionResult;
  lesson: LessonContent;
  characterSlug: string | null;
  exitHref: string;
  preview: boolean;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center gap-5 px-4 py-8 text-center">
      <Confetti />
      <div className="flex items-end justify-center gap-2 animate-pop">
        <Sheep mood="cheer" size={130} label="Mel comemorando" />
        {characterSlug && <Character slug={characterSlug} size={110} label="" />}
      </div>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
        {lesson.kind === "unit_review" ? "Unidade concluída!" : "Lição concluída!"}
      </h1>
      <p className="text-lg font-bold text-ink-soft">
        Você acertou {result.correct} de {result.total}. {result.correct === result.total ? "Que caminhada bonita!" : "Os erros vão para a revisão para você fixar com calma."}
      </p>

      <div className="grid w-full grid-cols-3 gap-3">
        <StatTile color="yellow" icon="star" label="XP" value={result.xpAwarded > 0 ? `+${result.xpAwarded}` : "0"} note={result.xpAwarded > 0 ? "primeira vez" : preview ? "prévia" : "já recebido"} />
        <StatTile color="coral" icon="flame" label="Sequência" value={preview ? "—" : `${result.streak}`} note={result.streak === 1 ? "dia" : "dias"} />
        <StatTile color="green" icon="target" label="Meta" value={preview ? "—" : result.goalMet ? "Feita" : "Em curso"} note="de hoje" />
      </div>

      {result.achievements.length > 0 && (
        <section className="w-full rounded-3xl bg-yellow-soft p-4 text-left" aria-labelledby="novas-conquistas">
          <h2 id="novas-conquistas" className="mb-2 flex items-center gap-2 font-extrabold">
            <Icon name="spark" size={20} /> Nova conquista!
          </h2>
          <ul className="flex flex-col gap-2">
            {result.achievements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3 animate-pop">
                <span className={cx("flex h-10 w-10 items-center justify-center rounded-full text-white", colorClasses(a.color).bg)}>
                  <Icon name="star" size={20} />
                </span>
                <span>
                  <span className="block font-extrabold">{a.title}</span>
                  <span className="text-sm font-semibold text-ink-soft">{a.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-auto flex w-full flex-col gap-3">
        {result.next ? (
          <>
            <p className="text-sm font-bold text-ink-soft">{result.next.unitChanged ? "Nova unidade liberada:" : "Próxima etapa:"} {result.next.title}</p>
            <LinkButton href={result.next.href} size="lg" block iconRight="arrow-right">
              Continuar
            </LinkButton>
          </>
        ) : result.trackDone ? (
          <>
            <p className="font-bold">Você concluiu todo o conteúdo publicado desta jornada!</p>
            <LinkButton href="/revisao" size="lg" block variant="color" color="blue">
              Revisar o que aprendi
            </LinkButton>
            <LinkButton href="/jornadas" size="lg" block variant="secondary">
              Explorar outra jornada
            </LinkButton>
          </>
        ) : null}
        <LinkButton href={exitHref} variant="secondary" block>
          Voltar ao mapa
        </LinkButton>
      </div>
    </main>
  );
}

function StatTile({ color, icon, label, value, note }: { color: string; icon: "star" | "flame" | "target"; label: string; value: string; note: string }) {
  const c = colorClasses(color);
  return (
    <div className={cx("flex flex-col items-center gap-1 rounded-3xl p-3", c.soft)}>
      <Icon name={icon} size={24} className={c.text} />
      <span className="text-xs font-extrabold uppercase text-ink-soft">{label}</span>
      <span className="text-xl font-extrabold">{value}</span>
      <span className="text-xs font-bold text-ink-soft">{note}</span>
    </div>
  );
}
