import Link from "next/link";
import { notFound } from "next/navigation";
import { bulkAction, entityStatus, moveItem, saveEntity } from "@/app/actions/admin";
import { ActionButton, BulkPanel, EntityForm } from "@/components/admin/AdminControls";
import { Chip, Panel, StatusBadge } from "@/components/ui";
import { getUnitAdmin } from "@/lib/data/admin";

const SCENES = ["garden", "desert", "river", "sea", "mountain", "city", "palace", "road", "village", "temple"];

export default async function UnitAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getUnitAdmin(id);
  if (!data) notFound();
  const { unit, items } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/admin/trilhas/${unit.tracks.id}`} className="text-sm font-bold text-ink-soft underline">
          {unit.tracks.title}
        </Link>
        <span aria-hidden>/</span>
        <h1 className="text-2xl font-extrabold">{unit.title}</h1>
        <StatusBadge status={unit.status} />
        {unit.pending && <Chip color="orange">alterações pendentes</Chip>}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-3 text-lg font-extrabold">Dados da unidade</h2>
          <EntityForm
            published={unit.status === "published"}
            initial={{ title: unit.title, description: unit.description, scene: unit.scene, ...(unit.pending ?? {}) }}
            fields={[
              { name: "title", label: "Título" },
              { name: "description", label: "Descrição", multiline: true },
              { name: "scene", label: "Cenário", options: SCENES },
            ]}
            onSave={saveEntity.bind(null, "unit", unit.id)}
          />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel>
            <h2 className="mb-3 text-lg font-extrabold">Status da unidade</h2>
            <div className="flex flex-wrap gap-2">
              <ActionButton label="Marcar revisada" action={entityStatus.bind(null, "unit", unit.id, "review")} disabled={unit.status !== "draft"} />
              <ActionButton
                label={unit.pending ? "Publicar alterações" : "Publicar"}
                variant="primary"
                action={entityStatus.bind(null, "unit", unit.id, "publish")}
                disabled={!(unit.status === "reviewed" || (unit.status === "published" && unit.pending))}
              />
              <ActionButton label="Retirar do ar" variant="danger" confirmText="Retirar esta unidade do ar?" action={entityStatus.bind(null, "unit", unit.id, "unpublish")} disabled={unit.status !== "published"} />
            </div>
          </Panel>
          <BulkPanel scopeLabel="esta unidade e suas lições" onRun={bulkAction.bind(null, "unit", unit.id)} />
        </div>
      </div>
      <Panel>
        <h2 className="mb-3 text-lg font-extrabold">Lições e revisão (ordem na trilha)</h2>
        <ol className="flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={it.id} className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-line p-3">
              <span className="w-6 text-center font-extrabold text-ink-soft">{i + 1}</span>
              <Link href={`/admin/licoes/${it.lesson_id}`} className="min-w-0 flex-1 font-extrabold text-blue-dark underline underline-offset-4">
                {it.title}
              </Link>
              {it.lessons.kind === "unit_review" && <Chip color="lilac">revisão final</Chip>}
              {it.working && <StatusBadge status={it.working.status} />}
              {it.published && <StatusBadge status="published" />}
              <span className="flex gap-1">
                <ActionButton label="↑" action={moveItem.bind(null, "item", it.id, -1)} disabled={i === 0} />
                <ActionButton label="↓" action={moveItem.bind(null, "item", it.id, 1)} disabled={i === items.length - 1} />
              </span>
            </li>
          ))}
        </ol>
      </Panel>
    </div>
  );
}
