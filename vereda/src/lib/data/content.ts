import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import type { TrackUnit } from "@/lib/domain/progress";
import type { PublicExercise } from "@/lib/domain/exercises";

/**
 * Modo de leitura do conteúdo:
 * - "public": apenas o que está publicado (via RLS, com a sessão da pessoa);
 * - "preview": tudo, incluindo rascunhos (somente após requireEditor()).
 */
export type ContentMode = "public" | "preview";

export type CharacterMeta = {
  id: string;
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  color: string;
  scene: string;
  status: string;
};

export type TrackMeta = {
  id: string;
  slug: string;
  kind: "general" | "character";
  title: string;
  subtitle: string;
  description: string;
  color: string;
  scene: string;
  sortOrder: number;
  status: string;
  character: CharacterMeta | null;
};

export type UnitMeta = TrackUnit & {
  slug: string;
  description: string;
  scene: string;
  status: string;
  items: (TrackUnit["items"][number] & { versionStatus: string; slug: string })[];
};

export type TrackStructure = { track: TrackMeta; units: UnitMeta[] };

type VersionRow = { id: string; title: string; status: string; version: number };
type UnitRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  scene: string;
  sort_order: number;
  status: string;
  unit_items: { position: number; lesson_id: string; lessons: { id: string; slug: string; kind: "lesson" | "unit_review"; lesson_versions: VersionRow[] } | null }[];
};

async function clientFor(mode: ContentMode): Promise<SupabaseClient> {
  return mode === "preview" ? adminClient() : await createClient();
}

const TRACK_SELECT =
  "id, slug, kind, title, subtitle, description, color, scene, sort_order, status, characters(id, slug, name, title, tagline, description, color, scene, status)";

type TrackRow = {
  id: string;
  slug: string;
  kind: "general" | "character";
  title: string;
  subtitle: string;
  description: string;
  color: string;
  scene: string;
  sort_order: number;
  status: string;
  characters: CharacterMeta | CharacterMeta[] | null;
};

function toTrackMeta(row: TrackRow): TrackMeta {
  const character = Array.isArray(row.characters) ? (row.characters[0] ?? null) : row.characters;
  return {
    id: row.id,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    color: row.color,
    scene: row.scene,
    sortOrder: row.sort_order,
    status: row.status,
    character,
  };
}

export const listTracks = cache(async (mode: ContentMode): Promise<TrackMeta[]> => {
  const db = await clientFor(mode);
  const { data, error } = await db.from("tracks").select(TRACK_SELECT).order("sort_order");
  if (error) throw new Error(`Não foi possível carregar as jornadas: ${error.message}`);
  return (data as unknown as TrackRow[]).map(toTrackMeta);
});

function pickVersion(versions: VersionRow[], mode: ContentMode): VersionRow | null {
  if (mode === "public") return versions.find((v) => v.status === "published") ?? null;
  return (
    versions.find((v) => v.status === "draft" || v.status === "reviewed") ??
    versions.find((v) => v.status === "published") ??
    null
  );
}

/** Estrutura da trilha com apenas itens visíveis no modo. Unidades vazias são omitidas. */
export const getTrackStructure = cache(async (slugOrId: string, mode: ContentMode): Promise<TrackStructure | null> => {
  const db = await clientFor(mode);
  const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
  const { data: trackRow, error } = await db
    .from("tracks")
    .select(TRACK_SELECT)
    .eq(isUuid ? "id" : "slug", slugOrId)
    .maybeSingle();
  if (error) throw new Error(`Não foi possível carregar a jornada: ${error.message}`);
  if (!trackRow) return null;
  const track = toTrackMeta(trackRow as unknown as TrackRow);

  const { data: unitRows, error: unitError } = await db
    .from("units")
    .select(
      "id, slug, title, description, scene, sort_order, status, unit_items(position, lesson_id, lessons(id, slug, kind, lesson_versions(id, title, status, version)))",
    )
    .eq("track_id", track.id)
    .order("sort_order");
  if (unitError) throw new Error(`Não foi possível carregar as unidades: ${unitError.message}`);

  const units: UnitMeta[] = [];
  for (const u of (unitRows ?? []) as unknown as UnitRow[]) {
    if (mode === "public" && u.status !== "published") continue;
    const items = u.unit_items
      .slice()
      .sort((a, b) => a.position - b.position)
      .flatMap((it) => {
        if (!it.lessons) return [];
        const v = pickVersion(it.lessons.lesson_versions ?? [], mode);
        if (!v) return [];
        return [
          {
            lessonId: it.lessons.id,
            unitId: u.id,
            kind: it.lessons.kind,
            title: v.title,
            slug: it.lessons.slug,
            versionStatus: v.status,
          },
        ];
      });
    if (items.length === 0) continue;
    units.push({ id: u.id, slug: u.slug, title: u.title, description: u.description, scene: u.scene, status: u.status, items });
  }
  return { track, units };
});

export type LessonBlock = { kind: string; title: string; text: string; reference?: string; translation?: string };

export type LessonContent = {
  versionId: string;
  lessonId: string;
  slug: string;
  kind: "lesson" | "unit_review";
  status: string;
  version: number;
  title: string;
  objective: string;
  references: string[];
  context: string;
  blocks: LessonBlock[];
  takeaways: string[];
  reflection: string | null;
  exercises: PublicExercise[];
};

/** Versão que deve ser jogada agora (pública ou de trabalho na prévia). */
export async function resolvePlayableVersion(lessonId: string, mode: ContentMode): Promise<string | null> {
  const { data } = await adminClient().from("lesson_versions").select("id, status").eq("lesson_id", lessonId);
  const rows = (data ?? []) as { id: string; status: string }[];
  if (mode === "public") return rows.find((r) => r.status === "published")?.id ?? null;
  return (rows.find((r) => r.status === "draft" || r.status === "reviewed") ?? rows.find((r) => r.status === "published"))?.id ?? null;
}

/**
 * Conteúdo de uma versão SEM gabaritos. Leitura pelo servidor depois das
 * verificações de acesso (permite concluir tentativas em versões arquivadas).
 */
export async function loadLessonVersion(versionId: string): Promise<LessonContent | null> {
  const db = adminClient();
  const { data, error } = await db
    .from("lesson_versions")
    .select("id, lesson_id, status, version, title, objective, content, lessons(slug, kind), exercises(key, position, type, prompt, data, reference)")
    .eq("id", versionId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as unknown as {
    id: string;
    lesson_id: string;
    status: string;
    version: number;
    title: string;
    objective: string;
    content: { references?: string[]; context?: string; blocks?: LessonBlock[]; takeaways?: string[]; reflection?: string | null };
    lessons: { slug: string; kind: "lesson" | "unit_review" } | null;
    exercises: { key: string; position: number; type: PublicExercise["type"]; prompt: string; data: unknown; reference: string }[];
  };
  return {
    versionId: row.id,
    lessonId: row.lesson_id,
    slug: row.lessons?.slug ?? "",
    kind: row.lessons?.kind ?? "lesson",
    status: row.status,
    version: row.version,
    title: row.title,
    objective: row.objective,
    references: row.content.references ?? [],
    context: row.content.context ?? "",
    blocks: row.content.blocks ?? [],
    takeaways: row.content.takeaways ?? [],
    reflection: row.content.reflection ?? null,
    exercises: row.exercises
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((e) => ({ key: e.key, type: e.type, prompt: e.prompt, data: e.data, reference: e.reference })),
  };
}

/** Quantidade de etapas do player: abertura + blocos + exercícios + resumo. */
export function stepCount(lesson: Pick<LessonContent, "blocks" | "exercises">): number {
  return 1 + lesson.blocks.length + lesson.exercises.length + 1;
}
