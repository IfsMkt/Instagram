"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { chooseTrack, finishOnboardingWithoutTrack, saveOnboardingAnswer } from "@/app/actions/profile";
import type { TrackCard } from "@/lib/data/progress";
import type { Profile } from "@/lib/types";
import { Character } from "../art/Character";
import { Icon, type IconName } from "../art/Icon";
import { Sheep, type SheepMood } from "../art/Sheep";
import { TrackPicker } from "../tracks/TrackPicker";
import { Bubble, Button, cx, LinkButton, Notice, ProgressBar } from "../ui";

type Option<T> = { value: T; label: string; hint?: string; icon?: IconName };

const KNOWLEDGE: Option<string>[] = [
  { value: "nenhum", label: "Estou começando agora", hint: "Nunca li ou li muito pouco" },
  { value: "pouco", label: "Conheço algumas histórias", hint: "Já ouvi falar de algumas" },
  { value: "algum", label: "Leio de vez em quando", hint: "Conheço o básico" },
  { value: "bastante", label: "Conheço bastante", hint: "Quero aprofundar" },
];
const GOALS: Option<string>[] = [
  { value: "conhecer", label: "Conhecer a Bíblia do começo", icon: "book" },
  { value: "rotina", label: "Criar uma rotina de estudo", icon: "flame" },
  { value: "aprofundar", label: "Aprofundar o que já sei", icon: "mountain" },
  { value: "ensinar", label: "Ensinar ou conversar melhor sobre ela", icon: "spark" },
  { value: "curiosidade", label: "Matar a curiosidade", icon: "compass" },
];
const MINUTES: Option<number>[] = [
  { value: 5, label: "5 minutos", hint: "Uma lição por dia" },
  { value: 10, label: "10 minutos", hint: "Duas lições ou lição + revisão" },
  { value: 15, label: "15 minutos", hint: "Para quem quer acelerar" },
];
const TRADITIONS: Option<string>[] = [
  { value: "geral", label: "Cristão, de forma geral" },
  { value: "catolica", label: "Católica" },
  { value: "protestante", label: "Protestante / evangélica" },
  { value: "prefiro-nao-dizer", label: "Prefiro não dizer" },
];

const TOTAL = 7;

export function Onboarding({ profile, cards }: { profile: Profile; cards: TrackCard[] }) {
  const router = useRouter();
  const [step, setStep] = useState(() => Math.min(profile.onboarding_step, 5));
  const [answers, setAnswers] = useState({
    bible_knowledge: profile.bible_knowledge,
    learning_goal: profile.learning_goal,
    daily_goal_minutes: profile.daily_goal_minutes,
    tradition: profile.tradition,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [first, setFirst] = useState<{ href: string | null; title: string | null; character: string | null } | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const name = profile.display_name || "explorador(a)";

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function advance(fields: Record<string, unknown> = {}) {
    if (saving) return;
    setSaving(true);
    setError("");
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await saveOnboardingAnswer({ step: step + 1, ...fields, ...(step === 0 ? { timezone } : {}) });
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setStep(step + 1);
  }

  async function onChoose(card: TrackCard): Promise<string | null> {
    const res = await chooseTrack({ trackId: card.id, finishOnboarding: true });
    if (!res.ok) return res.error;
    setFirst({ href: res.data?.firstLessonHref ?? null, title: res.data?.firstLessonTitle ?? null, character: card.character?.slug ?? null });
    setStep(6);
    return null;
  }

  async function finishWithout() {
    setSaving(true);
    const res = await finishOnboardingWithoutTrack();
    setSaving(false);
    if (!res.ok) setError(res.error);
    else router.push("/inicio");
  }

  const speech: Record<number, { mood: SheepMood; text: React.ReactNode }> = {
    0: { mood: "wave", text: <>Oi, {name}! Que alegria ter você aqui. Deixa eu te mostrar como o Vereda funciona.</> },
    1: { mood: "think", text: <>Pra eu te acompanhar direitinho: quanto você já conhece da Bíblia? Não existe resposta errada!</> },
    2: { mood: "happy", text: <>E o que você mais quer com essa jornada?</> },
    3: { mood: "calm", text: <>Quanto tempo por dia você quer dedicar? Dá pra mudar depois, sem culpa.</> },
    4: { mood: "think", text: <>Uma preferência opcional: você se identifica com alguma tradição?</> },
    5: { mood: "cheer", text: <>Agora a parte mais legal!</> },
    6: { mood: "cheer", text: <>Tudo pronto! Sua primeira lição já está te esperando.</> },
  };

  return (
    <main id="conteudo" className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-3">
        <ProgressBar value={(step + 1) / TOTAL} label="Progresso das boas-vindas" className="flex-1" />
        <span className="text-xs font-extrabold text-ink-soft">
          {step + 1}/{TOTAL}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <Sheep mood={speech[step].mood} size={step === 0 ? 120 : 84} className="shrink-0 animate-float" label="Mel, a ovelhinha" />
        <Bubble className="flex-1">{speech[step].text}</Bubble>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <div key={step} className="flex flex-1 flex-col gap-4 animate-rise">
        {step === 0 && (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
              Aprenda a Bíblia, um passo por dia
            </h1>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: "book" as const, color: "bg-green-soft", title: "Lições de 5 minutos", text: "Primeiro eu explico, depois você pratica." },
                { icon: "spark" as const, color: "bg-blue-soft", title: "Exercícios variados", text: "Escolhas, ligar pares, ordenar fatos e completar frases." },
                { icon: "review" as const, color: "bg-lilac-soft", title: "Revisão inteligente", text: "O que você errar volta depois de 1, 3, 7 e 14 dias." },
                { icon: "flame" as const, color: "bg-coral-soft", title: "Progresso visível", text: "XP, sequência e conquistas medem seu estudo — nunca sua fé." },
              ].map((f) => (
                <li key={f.title} className={cx("flex items-start gap-3 rounded-3xl p-4", f.color)}>
                  <Icon name={f.icon} size={26} className="mt-0.5 shrink-0" />
                  <span>
                    <span className="block font-extrabold">{f.title}</span>
                    <span className="text-sm font-semibold text-ink-soft">{f.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Footer>
              <Button size="lg" block onClick={() => void advance()} disabled={saving} iconRight="arrow-right">
                {saving ? "Salvando…" : "Vamos lá"}
              </Button>
            </Footer>
          </>
        )}

        {step === 1 && (
          <Question
            headingRef={headingRef}
            title="Quanto você conhece da Bíblia?"
            options={KNOWLEDGE}
            value={answers.bible_knowledge}
            onSelect={(v) => setAnswers((a) => ({ ...a, bible_knowledge: v }))}
            onNext={() => void advance({ bible_knowledge: answers.bible_knowledge })}
            onBack={() => setStep(0)}
            saving={saving}
          />
        )}
        {step === 2 && (
          <Question
            headingRef={headingRef}
            title="Qual é o seu objetivo?"
            options={GOALS}
            value={answers.learning_goal}
            onSelect={(v) => setAnswers((a) => ({ ...a, learning_goal: v }))}
            onNext={() => void advance({ learning_goal: answers.learning_goal })}
            onBack={() => setStep(1)}
            saving={saving}
          />
        )}
        {step === 3 && (
          <Question
            headingRef={headingRef}
            title="Quanto tempo por dia?"
            options={MINUTES}
            value={answers.daily_goal_minutes}
            onSelect={(v) => setAnswers((a) => ({ ...a, daily_goal_minutes: v }))}
            onNext={() => void advance({ daily_goal_minutes: answers.daily_goal_minutes })}
            onBack={() => setStep(2)}
            saving={saving}
          />
        )}
        {step === 4 && (
          <Question
            headingRef={headingRef}
            title="Preferência de tradição (opcional)"
            options={TRADITIONS}
            value={answers.tradition}
            onSelect={(v) => setAnswers((a) => ({ ...a, tradition: v }))}
            onNext={() => void advance({ tradition: answers.tradition ?? null })}
            onBack={() => setStep(3)}
            saving={saving}
            optional
            note={
              <Notice tone="info">
                Nesta primeira versão, o conteúdo é cristão geral para todas as pessoas. Quando um tema tem leituras diferentes entre católicos,
                protestantes e outras tradições, a gente avisa e apresenta as visões com respeito.
              </Notice>
            }
          />
        )}

        {step === 5 && (
          <>
            <div>
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
                Quem vai acompanhar sua jornada?
              </h1>
              <p className="mt-1 font-semibold text-ink-soft">Escolha uma história para começar. Você poderá explorar outras depois.</p>
              <p className="mt-1 text-xs font-bold text-ink-faint">As ilustrações são representações artísticas, não retratos históricos.</p>
            </div>
            {cards.length > 0 ? (
              <TrackPicker cards={cards} activeTrackId={null} onChoose={onChoose} mode="onboarding" />
            ) : (
              <div className="flex flex-col gap-4 rounded-3xl bg-yellow-soft p-5">
                <p className="font-bold">
                  As jornadas ainda estão sendo revisadas pela nossa equipe editorial e nenhuma foi publicada. Assim que a primeira ficar pronta, ela aparece aqui e no
                  seu início.
                </p>
                <Button onClick={() => void finishWithout()} disabled={saving}>
                  Entendi, ir para o início
                </Button>
              </div>
            )}
            <button type="button" onClick={() => setStep(4)} className="self-start text-sm font-bold text-ink-soft underline underline-offset-4">
              Voltar
            </button>
          </>
        )}

        {step === 6 && first && (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
              Sua primeira lição
            </h1>
            <div className="flex items-center gap-4 rounded-3xl bg-green-soft p-5">
              {first.character ? <Character slug={first.character} size={90} label="" /> : <Sheep size={90} label="" />}
              <div>
                <p className="text-sm font-extrabold uppercase text-green-dark">Começando por</p>
                <p className="text-xl font-extrabold">{first.title ?? "Sua jornada"}</p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 font-semibold text-ink-soft">
              <li className="flex gap-2">
                <Icon name="book" size={20} className="shrink-0 text-green" /> Leia os blocos curtos com calma.
              </li>
              <li className="flex gap-2">
                <Icon name="check" size={20} className="shrink-0 text-green" /> Responda os exercícios — errar faz parte e ajuda a lembrar.
              </li>
              <li className="flex gap-2">
                <Icon name="refresh" size={20} className="shrink-0 text-green" /> Se sair no meio, o Vereda guarda o ponto exato.
              </li>
            </ul>
            <Footer>
              {first.href && (
                <LinkButton href={first.href} size="lg" block iconRight="arrow-right">
                  Começar primeira lição
                </LinkButton>
              )}
              <LinkButton href="/inicio" variant="secondary" block>
                Ir para o início
              </LinkButton>
            </Footer>
          </>
        )}
        {step === 6 && !first && (
          <Footer>
            <LinkButton href="/inicio" size="lg" block>
              Ir para o início
            </LinkButton>
          </Footer>
        )}
      </div>
    </main>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto flex flex-col gap-3 pt-4">{children}</div>;
}

function Question<T extends string | number>({
  headingRef,
  title,
  options,
  value,
  onSelect,
  onNext,
  onBack,
  saving,
  optional,
  note,
}: {
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  title: string;
  options: Option<T>[];
  value: T | null;
  onSelect: (v: T) => void;
  onNext: () => void;
  onBack: () => void;
  saving: boolean;
  optional?: boolean;
  note?: React.ReactNode;
}) {
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold outline-none">
        {title}
      </h1>
      <div role="radiogroup" aria-label={title} className="flex flex-col gap-3">
        {options.map((o) => {
          const checked = value === o.value;
          return (
            <label
              key={String(o.value)}
              className={cx(
                "btn-3d flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-blue",
                checked ? "border-green bg-green-soft [--btn-shadow:var(--color-green)]" : "border-line bg-paper [--btn-shadow:var(--color-line)]",
              )}
            >
              <input type="radio" name={title} className="sr-only" checked={checked} onChange={() => onSelect(o.value)} />
              {o.icon && <Icon name={o.icon} size={24} className="shrink-0 text-green-dark" />}
              <span className="flex-1">
                <span className="block font-extrabold">{o.label}</span>
                {o.hint && <span className="text-sm font-semibold text-ink-soft">{o.hint}</span>}
              </span>
              <span aria-hidden className={cx("flex h-7 w-7 items-center justify-center rounded-full border-2", checked ? "border-green bg-green text-white" : "border-line")}>
                {checked && <Icon name="check" size={16} />}
              </span>
            </label>
          );
        })}
      </div>
      {note}
      <div className="mt-auto flex gap-3 pt-4">
        <Button variant="secondary" onClick={onBack} aria-label="Voltar" icon="arrow-left" className="w-14 px-0" />
        <Button size="lg" block onClick={onNext} disabled={saving || (!optional && value === null)} iconRight="arrow-right">
          {saving ? "Salvando…" : optional && value === null ? "Pular" : "Continuar"}
        </Button>
      </div>
    </>
  );
}
