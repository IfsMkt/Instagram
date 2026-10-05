import type { Metadata } from "next";
import { Icon } from "@/components/art/Icon";
import { Sheep } from "@/components/art/Sheep";
import { Bubble, Chip, LinkButton, SectionTitle } from "@/components/ui";
import { requireOnboarded } from "@/lib/auth";
import { localDate, safeTimeZone } from "@/lib/domain/dates";
import { describeStage } from "@/lib/domain/review";
import { RULES } from "@/lib/domain/rules";
import { getReviewOverview } from "@/lib/data/review";

export const metadata: Metadata = { title: "Vamos lembrar?" };

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" });
const fmt = (d: string) => dateFmt.format(new Date(`${d}T12:00:00Z`));

export default async function ReviewPage() {
  const { user, profile } = await requireOnboarded();
  const today = localDate(new Date(), safeTimeZone(profile.timezone));
  const overview = await getReviewOverview(user.id, today);
  const due = overview.due.length;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-5">
      <h1 className="text-3xl font-extrabold">Vamos lembrar?</h1>
      <div className="flex items-end gap-3">
        <Sheep mood={due > 0 ? "happy" : "calm"} size={90} label="" />
        <Bubble className="flex-1">
          {due > 0
            ? `Separei ${due} ${due === 1 ? "questão" : "questões"} para hoje. Relembrar no tempo certo ajuda a guardar de verdade!`
            : "Tudo em dia por aqui! Quando você errar uma questão, ela volta depois de 1, 3, 7 e 14 dias para fixar."}
        </Bubble>
      </div>

      {due > 0 ? (
        <LinkButton href="/revisao/sessao" size="lg" variant="color" color="lilac" block icon="review">
          Começar revisão ({Math.min(due, RULES.reviewSessionSize)} {Math.min(due, RULES.reviewSessionSize) === 1 ? "questão" : "questões"})
        </LinkButton>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <LinkButton href="/jornada" variant="primary" icon="map">
            Continuar jornada
          </LinkButton>
          <LinkButton href="/caderno" variant="secondary" icon="notebook">
            Ver meu caderno
          </LinkButton>
        </div>
      )}

      <section className="grid grid-cols-3 gap-3 text-center" aria-label="Resumo da revisão">
        <div className="rounded-3xl bg-coral-soft p-3">
          <p className="text-2xl font-extrabold">{due}</p>
          <p className="text-xs font-extrabold text-ink-soft">para hoje</p>
        </div>
        <div className="rounded-3xl bg-blue-soft p-3">
          <p className="text-2xl font-extrabold">{overview.upcoming.length}</p>
          <p className="text-xs font-extrabold text-ink-soft">programadas</p>
        </div>
        <div className="rounded-3xl bg-green-soft p-3">
          <p className="text-2xl font-extrabold">{overview.mastered}</p>
          <p className="text-xs font-extrabold text-ink-soft">aprendidas</p>
        </div>
      </section>

      {overview.mistakes.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon="refresh">Questões para reforçar</SectionTitle>
          <ul className="flex flex-col gap-2">
            {overview.mistakes.slice(0, 12).map((i) => (
              <li key={i.id} className="rounded-2xl border-2 border-line bg-paper p-4">
                <p className="text-xs font-extrabold uppercase text-ink-faint">{i.lessonTitle}</p>
                <p className="font-bold">{i.prompt}</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-soft">
                  <Chip color={i.dueOn && i.dueOn <= today ? "coral" : "blue"}>{i.dueOn && i.dueOn <= today ? "Hoje" : i.dueOn ? fmt(i.dueOn) : ""}</Chip>
                  {describeStage(i.stage)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {overview.upcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle icon="target">Próximas revisões</SectionTitle>
          <ul className="flex flex-col gap-2">
            {overview.upcoming.slice(0, 10).map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
                <Icon name="review" size={20} className="shrink-0 text-lilac-dark" />
                <span className="min-w-0 flex-1 text-sm font-bold">{i.lessonTitle}</span>
                <span className="shrink-0 text-xs font-extrabold text-ink-soft">{i.dueOn ? fmt(i.dueOn) : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
