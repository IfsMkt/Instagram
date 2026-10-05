import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackMap } from "@/components/map/TrackMap";
import { Notice } from "@/components/ui";
import { requireEditor } from "@/lib/auth";
import { getTrackView } from "@/lib/data/progress";

export default async function PreviewTrack({ params }: { params: Promise<{ slug: string }> }) {
  const { user } = await requireEditor();
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const view = await getTrackView(user.id, slug, "preview");
  if (!view) notFound();
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5">
      <Link href="/admin/previa" className="text-sm font-bold text-ink-soft underline">
        ← Todas as trilhas
      </Link>
      <h1 className="text-2xl font-extrabold">Prévia: {view.structure.track.title}</h1>
      <Notice tone="warning">Modo prévia — inclui rascunhos. Progresso de teste, separado do real.</Notice>
      {view.structure.units.length === 0 ? (
        <p className="font-bold">Esta trilha ainda não tem lições.</p>
      ) : (
        <TrackMap
          trackSlug={slug}
          color={view.structure.track.color}
          characterSlug={view.structure.track.character?.slug ?? null}
          units={view.structure.units}
          state={view.state}
          action={view.action}
          mode="preview"
        />
      )}
    </div>
  );
}
