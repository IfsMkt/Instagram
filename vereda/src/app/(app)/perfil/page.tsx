import type { Metadata } from "next";
import { signOutAction } from "@/app/actions/auth";
import { Icon } from "@/components/art/Icon";
import { colorClasses } from "@/components/art/palette";
import { Avatar } from "@/components/profile/Avatar";
import { ActivityCalendar } from "@/components/stats/StatWidgets";
import { Button, cx, LinkButton, Panel, ProgressBar, SectionTitle } from "@/components/ui";
import { isEditor, requireOnboarded } from "@/lib/auth";
import { ACHIEVEMENTS } from "@/lib/domain/achievements";
import { getTrackStructure, listTracks } from "@/lib/data/content";
import { getStats } from "@/lib/data/progress";
import { adminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Perfil" };

const GOAL_LABEL: Record<string, string> = {
  conhecer: "Conhecer a Bíblia do começo",
  rotina: "Criar uma rotina de estudo",
  aprofundar: "Aprofundar o que já sei",
  ensinar: "Ensinar ou conversar melhor",
  curiosidade: "Matar a curiosidade",
};
const TRADITION_LABEL: Record<string, string> = {
  geral: "Cristão, de forma geral",
  catolica: "Católica",
  protestante: "Protestante / evangélica",
  "prefiro-nao-dizer": "Prefiro não dizer",
};

export default async function ProfilePage() {
  const { user, profile } = await requireOnboarded();
  const [stats, editor, tracks] = await Promise.all([getStats(user.id, profile), isEditor(user.id), listTracks("public")]);
  const active = tracks.find((t) => t.id === profile.active_track_id);

  // Unidades concluídas (conteúdo publicado).
  const { data: comp } = await adminClient().from("lesson_completions").select("lesson_id").eq("user_id", user.id).eq("scope", "live");
  const completed = new Set(((comp ?? []) as { lesson_id: string }[]).map((r) => r.lesson_id));
  let unitsDone = 0;
  for (const t of tracks) {
    const s = await getTrackStructure(t.id, "public");
    for (const u of s?.units ?? []) if (u.items.every((i) => completed.has(i.lessonId))) unitsDone++;
  }
  const earned = new Map(stats.earned.map((e) => [e.id, e.earnedAt]));
  const lvl = stats.level;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-5">
      <header className="flex items-center gap-4">
        <div className="rounded-full bg-paper p-1 shadow-[0_3px_0_0_var(--color-line)]">
          <Avatar avatar={profile.avatar} size={88} label={`Avatar de ${profile.display_name}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold">{profile.display_name || "Sem nome"}</h1>
          <p className="truncate text-sm font-bold text-ink-soft">{user.email}</p>
          {active && (
            <p className={cx("mt-1 text-sm font-extrabold", colorClasses(active.color).text)}>
              Jornada ativa: {active.character ? `${active.character.name}, ${active.character.title.toLowerCase()}` : active.title}
            </p>
          )}
        </div>
      </header>

      <Panel color="yellow">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow text-ink">
            <Icon name="star" size={30} />
          </span>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase text-ink-soft">Nível {lvl.level}</p>
            <p className="text-xl font-extrabold">{lvl.name}</p>
          </div>
          <p className="text-right text-lg font-extrabold">{stats.totalXp} XP</p>
        </div>
        <ProgressBar value={lvl.progress} color="yellow" label="Progresso para o próximo nível" className="mt-3 bg-paper" />
        <p className="mt-1 text-xs font-bold text-ink-soft">
          {lvl.nextLevelXp ? `${lvl.nextLevelXp - stats.totalXp} XP para o próximo nível` : "Nível máximo alcançado"} · O XP mede atividades de estudo.
        </p>
      </Panel>

      <section className="grid grid-cols-3 gap-3 text-center" aria-label="Números do seu estudo">
        <div className="rounded-3xl bg-green-soft p-3">
          <p className="text-2xl font-extrabold">{stats.lessonsCompleted}</p>
          <p className="text-xs font-extrabold text-ink-soft">lições</p>
        </div>
        <div className="rounded-3xl bg-blue-soft p-3">
          <p className="text-2xl font-extrabold">{unitsDone}</p>
          <p className="text-xs font-extrabold text-ink-soft">unidades</p>
        </div>
        <div className="rounded-3xl bg-coral-soft p-3">
          <p className="text-2xl font-extrabold">{stats.streak.current}</p>
          <p className="text-xs font-extrabold text-ink-soft">dias seguidos</p>
        </div>
      </section>

      <Panel>
        <SectionTitle icon="flame" className="mb-3">
          Calendário
        </SectionTitle>
        <ActivityCalendar days={stats.calendar} today={stats.today} />
        <p className="mt-2 text-xs font-bold text-ink-soft">Maior sequência: {stats.streak.longest} {stats.streak.longest === 1 ? "dia" : "dias"}.</p>
      </Panel>

      <Panel>
        <SectionTitle icon="spark" className="mb-3">
          Conquistas ({earned.size}/{ACHIEVEMENTS.length})
        </SectionTitle>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACHIEVEMENTS.map((a) => {
            const got = earned.has(a.id);
            const c = colorClasses(a.color);
            return (
              <li key={a.id} className={cx("flex flex-col items-center gap-1 rounded-2xl p-3 text-center", got ? c.soft : "bg-cream-deep/60")}>
                <span className={cx("flex h-12 w-12 items-center justify-center rounded-full", got ? cx(c.bg, "text-white") : "bg-paper text-ink-faint")}>
                  <Icon name={got ? a.icon : "lock"} size={24} />
                </span>
                <span className={cx("text-sm font-extrabold", !got && "text-ink-soft")}>{a.title}</span>
                <span className="text-[11px] font-semibold text-ink-soft">{a.description}</span>
                <span className="sr-only">{got ? "Conquistada" : "Ainda não conquistada"}</span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel>
        <SectionTitle icon="target" className="mb-2">
          Meta e preferências
        </SectionTitle>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="font-bold text-ink-soft">Meta diária</dt>
            <dd className="font-extrabold">{profile.daily_goal_minutes} minutos</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-bold text-ink-soft">Objetivo</dt>
            <dd className="text-right font-extrabold">{profile.learning_goal ? GOAL_LABEL[profile.learning_goal] : "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-bold text-ink-soft">Tradição (opcional)</dt>
            <dd className="text-right font-extrabold">{profile.tradition ? TRADITION_LABEL[profile.tradition] : "Não informada"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-bold text-ink-soft">Fuso horário</dt>
            <dd className="font-extrabold">{profile.timezone}</dd>
          </div>
        </dl>
        <LinkButton href="/perfil/configuracoes" variant="secondary" block className="mt-4" icon="settings">
          Editar perfil e configurações
        </LinkButton>
      </Panel>

      <div className="flex flex-col gap-3">
        {editor && (
          <LinkButton href="/admin" variant="color" color="lilac" icon="shield">
            Área editorial
          </LinkButton>
        )}
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" block icon="logout">
            Sair
          </Button>
        </form>
      </div>
    </div>
  );
}
