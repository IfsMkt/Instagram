import type { Metadata } from "next";
import Link from "next/link";
import { Character } from "@/components/art/Character";
import { Icon } from "@/components/art/Icon";
import { Scene } from "@/components/art/Scene";
import { Sheep } from "@/components/art/Sheep";
import { colorClasses } from "@/components/art/palette";
import { GoalRing, StreakBadge } from "@/components/stats/StatWidgets";
import { Bubble, cx, LinkButton, Notice, ProgressBar } from "@/components/ui";
import { referenceForDay } from "@/content/daily";
import { requireOnboarded } from "@/lib/auth";
import { localHour, safeTimeZone } from "@/lib/domain/dates";
import { currentUnit } from "@/lib/domain/progress";
import { getActiveTrackView, getStats, lessonHref } from "@/lib/data/progress";
import { countDueReviews } from "@/lib/data/review";

export const metadata: Metadata = { title: "Início" };

const AVISOS: Record<string, { tone: "success" | "info" | "error"; text: string }> = {
  "senha-alterada": { tone: "success", text: "Senha alterada com sucesso." },
  "sem-permissao": { tone: "info", text: "Essa área é exclusiva da equipe editorial." },
};

export default async function HomePage({ searchParams }: { searchParams: Promise<{ aviso?: string }> }) {
  const { user, profile } = await requireOnboarded();
  const { aviso } = await searchParams;
  const tz = safeTimeZone(profile.timezone);
  const [view, stats] = await Promise.all([getActiveTrackView(user.id, profile), getStats(user.id, profile)]);
  const due = await countDueReviews(user.id, stats.today);
  const hour = localHour(new Date(), tz);
  const greeting = hour < 5 ? "Boa noite" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const daily = referenceForDay(stats.today);
  const notice = aviso ? AVISOS[aviso] : undefined;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-5">
      {notice && <Notice tone={notice.tone}>{notice.text}</Notice>}
      <header className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-sm font-extrabold text-ink-soft">{greeting},</p>
          <h1 className="text-3xl font-extrabold leading-tight">{profile.display_name || "explorador(a)"}!</h1>
        </div>
        <Link href="/perfil" className="flex items-center gap-1 rounded-2xl bg-yellow-soft px-3 py-2 font-extrabold" aria-label={`Nível ${stats.level.level}, ${stats.totalXp} XP. Ver perfil`}>
          <Icon name="star" size={20} className="fill-yellow text-yellow-dark" />
          {stats.totalXp} XP
        </Link>
      </header>

      {stats.streak.lost && (
        <div className="flex items-center gap-3">
          <Sheep mood="calm" size={64} label="" />
          <Bubble className="flex-1">
            Sentimos sua falta! Sua sequência recomeçou, e tudo bem — cada dia é uma nova chance. Que tal um passo pequeno hoje?
          </Bubble>
        </div>
      )}

      {view ? <ActiveTrackCard view={view} /> : <PreparingCard />}

      <section className="grid grid-cols-2 gap-3" aria-label="Seu dia">
        <div className="flex items-center gap-3 rounded-3xl border-2 border-line bg-paper p-4">
          <GoalRing minutes={stats.goal.minutesToday} goal={stats.goal.goalMinutes} size={72} />
          <div>
            <p className="text-xs font-extrabold uppercase text-ink-soft">Meta diária</p>
            <p className="font-extrabold">{stats.goal.met ? "Cumprida!" : `${stats.goal.goalMinutes} min`}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-1 rounded-3xl border-2 border-line bg-paper p-4">
          <StreakBadge days={stats.streak.current} activeToday={stats.streak.activeToday} />
          {stats.streak.atRisk && <p className="text-xs font-bold text-coral-dark">Estude hoje para manter a sequência.</p>}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-blue-soft p-5" aria-labelledby="ref-dia">
        <p id="ref-dia" className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-blue-dark">
          <Icon name="book" size={16} /> Referência do dia · {daily.reference}
        </p>
        <p className="mt-2 text-lg font-bold">{daily.summary}</p>
        <p className="mt-1 text-xs font-bold text-ink-soft">Resumo com nossas palavras.</p>
        <p className="mt-3 rounded-2xl bg-paper/80 p-3 text-sm font-semibold">
          <span className="font-extrabold text-lilac-dark">Para pensar: </span>
          {daily.reflection}
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/revisao" className="btn-3d flex items-center gap-3 rounded-3xl border-2 border-line bg-paper p-4 [--btn-shadow:var(--color-line)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lilac-soft text-lilac-dark">
            <Icon name="review" size={26} />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Vamos lembrar?</span>
            <span className="text-sm font-semibold text-ink-soft">{due > 0 ? `${due} ${due === 1 ? "item" : "itens"} para revisar` : "Nada pendente hoje"}</span>
          </span>
          <Icon name="arrow-right" size={22} className="text-ink-faint" />
        </Link>
        <Link href="/jornadas" className="btn-3d flex items-center gap-3 rounded-3xl border-2 border-line bg-paper p-4 [--btn-shadow:var(--color-line)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-soft text-orange-dark">
            <Icon name="compass" size={26} />
          </span>
          <span className="flex-1">
            <span className="block font-extrabold">Explorar jornadas</span>
            <span className="text-sm font-semibold text-ink-soft">Conheça outros personagens</span>
          </span>
          <Icon name="arrow-right" size={22} className="text-ink-faint" />
        </Link>
      </div>
    </div>
  );
}

function ActiveTrackCard({ view }: { view: NonNullable<Awaited<ReturnType<typeof getActiveTrackView>>> }) {
  const { structure, state, action } = view;
  const track = structure.track;
  const c = colorClasses(track.color);
  const unit = currentUnit(state, action);
  const unitIndex = unit ? state.units.findIndex((u) => u.id === unit.id) : -1;

  return (
    <section className="overflow-hidden rounded-[28px] border-2 border-line bg-paper shadow-[0_4px_0_0_var(--color-line)]" aria-labelledby="trilha-ativa">
      <div className="relative h-32">
        <Scene kind={track.scene} className="absolute inset-0 h-full w-full" />
        <div className="absolute bottom-0 right-3">
          {track.character ? <Character slug={track.character.slug} size={104} label={`${track.character.name} (representação artística)`} /> : <Sheep size={104} label="Mel" />}
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className={cx("text-xs font-extrabold uppercase tracking-wide", c.text)}>Trilha ativa</p>
          <h2 id="trilha-ativa" className="text-2xl font-extrabold">
            {track.title}
          </h2>
        </div>
        {unit && (
          <div>
            <div className="mb-1 flex justify-between text-sm font-extrabold">
              <span>
                Unidade {unitIndex + 1}: {unit.title}
              </span>
              <span className="text-ink-soft">
                {unit.completedCount}/{unit.total}
              </span>
            </div>
            <ProgressBar value={unit.completedCount / unit.total} color={track.color} label={`Progresso da unidade ${unit.title}`} />
          </div>
        )}
        {action.type === "resume" || action.type === "start" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-ink-soft">
              {action.type === "resume" ? "Você parou em:" : "Próxima lição:"} <span className="text-ink">{action.item.title}</span>
            </p>
            <LinkButton href={lessonHref(action.item.lessonId, track.slug)} size="lg" variant="color" color={track.color} block iconRight="arrow-right">
              Continuar minha jornada
            </LinkButton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="font-bold">Você concluiu todo o conteúdo publicado desta jornada. Parabéns pela caminhada!</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <LinkButton href="/revisao" variant="color" color="blue">
                Revisar
              </LinkButton>
              <LinkButton href="/jornadas" variant="secondary">
                Outra jornada
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PreparingCard() {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[28px] border-2 border-dashed border-yellow bg-yellow-soft/60 p-6 text-center">
      <Sheep mood="sleepy" size={110} label="" />
      <h2 className="text-xl font-extrabold">As trilhas estão sendo preparadas</h2>
      <p className="font-semibold text-ink-soft">
        Nossa equipe está revisando as lições antes de publicá-las. Assim que a primeira jornada estiver pronta, ela aparece aqui.
      </p>
    </section>
  );
}
