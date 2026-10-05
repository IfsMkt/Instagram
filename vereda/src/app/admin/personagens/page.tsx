import type { Metadata } from "next";
import { entityStatus, saveEntity } from "@/app/actions/admin";
import { ActionButton, EntityForm } from "@/components/admin/AdminControls";
import { Character } from "@/components/art/Character";
import { Chip, Panel, StatusBadge } from "@/components/ui";
import { adminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Personagens" };

const COLORS = ["green", "blue", "coral", "yellow", "lilac", "teal", "orange", "indigo"];
const SCENES = ["garden", "desert", "river", "sea", "mountain", "city", "palace", "road", "village", "temple"];

export default async function CharactersAdmin() {
  const { data } = await adminClient().from("characters").select("*").order("sort_order");
  const characters = (data ?? []) as {
    id: string;
    slug: string;
    name: string;
    title: string;
    tagline: string;
    description: string;
    color: string;
    scene: string;
    status: string;
    pending: Record<string, string> | null;
  }[];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">Personagens</h1>
        <p className="font-semibold text-ink-soft">Ilustrações são representações artísticas originais. O conteúdo de cada personagem fica na trilha correspondente.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {characters.map((c) => (
          <Panel key={c.id}>
            <div className="mb-3 flex items-center gap-3">
              <Character slug={c.slug} size={72} label="" />
              <div className="flex-1">
                <h2 className="text-xl font-extrabold">{c.name}</h2>
                <p className="text-sm font-bold text-ink-soft">{c.title}</p>
              </div>
              <StatusBadge status={c.status} />
              {c.pending && <Chip color="orange">pendente</Chip>}
            </div>
            <EntityForm
              published={c.status === "published"}
              initial={{ name: c.name, title: c.title, tagline: c.tagline, description: c.description, color: c.color, scene: c.scene, ...(c.pending ?? {}) }}
              fields={[
                { name: "name", label: "Nome" },
                { name: "title", label: "Identificação" },
                { name: "tagline", label: "Frase curta" },
                { name: "description", label: "Descrição do conteúdo", multiline: true },
                { name: "color", label: "Cor", options: COLORS },
                { name: "scene", label: "Cenário", options: SCENES },
              ]}
              onSave={saveEntity.bind(null, "character", c.id)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <ActionButton label="Marcar revisado" action={entityStatus.bind(null, "character", c.id, "review")} disabled={c.status !== "draft"} />
              <ActionButton
                label={c.pending ? "Publicar alterações" : "Publicar"}
                variant="primary"
                action={entityStatus.bind(null, "character", c.id, "publish")}
                disabled={!(c.status === "reviewed" || (c.status === "published" && c.pending))}
              />
              <ActionButton label="Retirar do ar" variant="danger" confirmText="Retirar este personagem (e sua trilha) do ar?" action={entityStatus.bind(null, "character", c.id, "unpublish")} disabled={c.status !== "published"} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
