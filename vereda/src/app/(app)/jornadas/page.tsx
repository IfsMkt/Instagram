import type { Metadata } from "next";
import { Sheep } from "@/components/art/Sheep";
import { ExplorePicker } from "@/components/tracks/ExplorePicker";
import { Bubble } from "@/components/ui";
import { requireOnboarded } from "@/lib/auth";
import { getTrackCards } from "@/lib/data/progress";

export const metadata: Metadata = { title: "Explorar jornadas" };

export default async function ExplorePage() {
  const { user, profile } = await requireOnboarded();
  const cards = await getTrackCards(user.id);
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-5">
      <div className="flex items-end gap-3">
        <Sheep mood="happy" size={80} label="" />
        <Bubble className="flex-1">Pode trocar à vontade: o progresso de cada jornada fica guardado.</Bubble>
      </div>
      <div>
        <h1 className="text-3xl font-extrabold">Explorar jornadas</h1>
        <p className="font-semibold text-ink-soft">Escolha uma história para seguir agora. As ilustrações são representações artísticas, não retratos históricos.</p>
      </div>
      {cards.length > 0 ? (
        <ExplorePicker cards={cards} activeTrackId={profile.active_track_id} />
      ) : (
        <p className="rounded-3xl bg-yellow-soft p-5 font-bold">Nenhuma jornada foi publicada ainda. Elas aparecem aqui assim que a revisão editorial terminar.</p>
      )}
    </div>
  );
}
