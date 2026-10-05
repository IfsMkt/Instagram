import type { Metadata } from "next";
import { Character } from "@/components/art/Character";
import { Sheep } from "@/components/art/Sheep";
import { colorClasses } from "@/components/art/palette";
import { TrackMap } from "@/components/map/TrackMap";
import { cx, LinkButton } from "@/components/ui";
import { requireOnboarded } from "@/lib/auth";
import { getActiveTrackView, getTrackView } from "@/lib/data/progress";

export const metadata: Metadata = { title: "Jornada" };

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ trilha?: string }> }) {
  const { user, profile } = await requireOnboarded();
  const { trilha } = await searchParams;
  const requested = trilha && /^[a-z0-9-]+$/.test(trilha) ? await getTrackView(user.id, trilha, "public") : null;
  const view = requested && requested.structure.units.length > 0 ? requested : await getActiveTrackView(user.id, profile);

  if (!view) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <Sheep mood="sleepy" size={130} />
        <h1 className="text-2xl font-extrabold">Nenhuma trilha publicada ainda</h1>
        <p className="font-semibold text-ink-soft">As lições estão em revisão editorial. Volte em breve!</p>
      </div>
    );
  }
  const { structure, state, action } = view;
  const track = structure.track;
  const c = colorClasses(track.color);
  const isActive = track.id === profile.active_track_id;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-5">
      <header className="flex items-center gap-3">
        {track.character ? <Character slug={track.character.slug} size={72} label="" /> : <Sheep size={72} label="" />}
        <div className="flex-1">
          <p className={cx("text-xs font-extrabold uppercase tracking-wide", c.text)}>{isActive ? "Trilha ativa" : "Visitando"}</p>
          <h1 className="text-2xl font-extrabold leading-tight">{track.title}</h1>
          <p className="text-sm font-bold text-ink-soft">
            {state.completedCount} de {state.total} etapas concluídas
          </p>
        </div>
        <LinkButton href="/jornadas" variant="secondary" size="sm" icon="compass">
          Trocar
        </LinkButton>
      </header>
      <TrackMap
        trackSlug={track.slug}
        color={track.color}
        characterSlug={track.character?.slug ?? null}
        units={structure.units}
        state={state}
        action={action}
      />
      {action.type === "all_done" && (
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-green-soft p-5 text-center">
          <Sheep mood="cheer" size={100} label="" />
          <p className="font-extrabold">Você chegou ao fim do conteúdo publicado desta jornada!</p>
          <div className="flex gap-2">
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
  );
}
