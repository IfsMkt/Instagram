import Link from "next/link";
import { notFound } from "next/navigation";
import { bulkAction, entityStatus, moveItem, saveEntity } from "@/app/actions/admin";
import { ActionButton, BulkPanel, EntityForm } from "@/components/admin/AdminControls";
import { Chip, Panel, StatusBadge } from "@/components/ui";
import { getTrackAdmin } from "@/lib/data/admin";

const COLORS = ["green", "blue", "coral", "yellow", "lilac", "teal", "orange", "indigo"];
const SCENES = ["garden", "desert", "river", "sea", "mountain", "city", "palace", "road", "village", "temple"];

export default async function TrackAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getTrackAdmin(id);
  if (!data) notFound();
  const { track, units } = data;
  const t = track as unknown as { id: string; slug: string; title: string; subtitle: string; description: string; color: string; scene: string; status: string; pending: Record<string, string> | null };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin" className="text-sm font-bold text-ink-soft underline">
          Conteúdo
        </Link>
        <span aria-hidden>/</span>
        <h1 className="text-2xl font-extrabold">{t.title}</h1>
        <StatusBadge status={t.status} />
        {t.pending && <Chip color="orange">alterações pendentes</Chip>}
        <Link href={`/admin/previa/${t.slug}`} className="ml-auto font-bold text-green-dark underline">
          Abrir prévia
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-lg font-extrabold">Dados da trilha</h2>
          <EntityForm
            published={t.status === "published"}
            initial={{ ...{ title: t.title, subtitle: t.subtitle, description: t.description, color: t.color, scene: t.scene }, ...(t.pending ?? {}) }}
            fields={[
              { name: "title", label: "Título" },
              { name: "subtitle", label: "Subtítulo" },
              { name: "description", label: "Descrição", multiline: true },
              { name: "color", label: "Cor", options: COLORS },
              { name: "scene", label: "Cenário", options: SCENES },
            ]}
            onSave={saveEntity.bind(null, "track", t.id)}
          />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel>
            <h2 className="mb-3 text-lg font-extrabold">Status da trilha</h2>
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Marcar revisada" action={entityStatus.bind(null, "track", t.id, "review")} disabled={t.status !== "draft"} />
              <ActionButton
                label={t.pending ? "Publicar alterações" : "Publicar"}
                variant="primary"
                action={entityStatus.bind(null, "track", t.id, "publish")}
                disabled={!(t.status === "reviewed" || (t.status === "published" && t.pending))}
              />
              {t.pending && <ActionButton label="Descartar alterações" action={entityStatus.bind(null, "track", t.id, "discard_pending")} />}
              <ActionButton label="Retirar do ar" variant="danger" confirmText="Retirar esta trilha do ar? O progresso das pessoas é preservado." action={entityStatus.bind(null, "track", t.id, "unpublish")} disabled={t.status !== "published"} />
            </div>
            <p className="mt-2 text-xs font-semibold text-ink-soft">Uma trilha aparece no app quando ela, o personagem (se houver), a unidade e a lição estão publicados.</p>
          </Panel>
          <BulkPanel scopeLabel="trilha inteira (personagem, unidades e lições)" onRun={bulkAction.bind(null, "track", t.id)} />
        </div>
      </div>

      <Panel>
        <h2 className="mb-3 text-lg font-extrabold">Unidades</h2>
        <ol className="flex flex-col gap-2">
          {units.map((u, i) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-line p-3">
              <span className="w-6 text-center font-extrabold text-ink-soft">{i + 1}</span>
              <Link href={`/admin/unidades/${u.id}`} className="min-w-0 flex-1 font-extrabold text-blue-dark underline underline-offset-4">
                {u.title}
              </Link>
              <StatusBadge status={u.status} />
              <span className="text-xs font-bold text-ink-soft">
                {u.counts.draft} rasc. · {u.counts.reviewed} rev. · {u.counts.published} publ. de {u.total}
              </span>
              <span className="flex gap-1">
                <ActionButton label="↑" action={moveItem.bind(null, "unit", u.id, -1)} disabled={i === 0} />
                <ActionButton label="↓" action={moveItem.bind(null, "unit", u.id, 1)} disabled={i === units.length - 1} />
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
