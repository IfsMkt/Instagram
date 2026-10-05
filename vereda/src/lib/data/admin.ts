import "server-only";
import { adminClient } from "@/lib/supabase/admin";

/** Leituras da área editorial. Chame sempre depois de requireEditor(). */

export type StatusCounts = { draft: number; reviewed: number; published: number; none: number };

type VersionLite = { lesson_id: string; status: string };

async function versionStatusByLesson(): Promise<Map<string, { working: string | null; published: boolean }>> {
  const { data } = await adminClient().from("lesson_versions").select("lesson_id, status").in("status", ["draft", "reviewed", "published"]);
  const map = new Map<string, { working: string | null; published: boolean }>();
  for (const v of (data ?? []) as VersionLite[]) {
    const cur = map.get(v.lesson_id) ?? { working: null, published: false };
    if (v.status === "published") cur.published = true;
    else cur.working = v.status;
    map.set(v.lesson_id, cur);
  }
  return map;
}

export async function getAdminOverview() {
  const db = adminClient();
  const [tracks, units, items, statusMap] = await Promise.all([
    db.from("tracks").select("id, slug, title, kind, color, status, pending, sort_order, characters(name, status)").order("sort_order"),
    db.from("units").select("id, track_id, title, status, sort_order").order("sort_order"),
    db.from("unit_items").select("unit_id, lesson_id"),
    versionStatusByLesson(),
  ]);
  const unitRows = (units.data ?? []) as { id: string; track_id: string; title: string; status: string; sort_order: number }[];
  const itemRows = (items.data ?? []) as { unit_id: string; lesson_id: string }[];
  return ((tracks.data ?? []) as unknown as {
    id: string;
    slug: string;
    title: string;
    kind: string;
    color: string;
    status: string;
    pending: unknown;
    characters: { name: string; status: string } | null;
  }[]).map((t) => {
    const tUnits = unitRows.filter((u) => u.track_id === t.id);
    const counts: StatusCounts = { draft: 0, reviewed: 0, published: 0, none: 0 };
    let lessons = 0;
    for (const u of tUnits) {
      for (const it of itemRows.filter((i) => i.unit_id === u.id)) {
        lessons++;
        const s = statusMap.get(it.lesson_id);
        if (!s) counts.none++;
        else {
          if (s.published) counts.published++;
          if (s.working === "draft") counts.draft++;
          if (s.working === "reviewed") counts.reviewed++;
        }
      }
    }
    return { ...t, units: tUnits.length, lessons, counts };
  });
}

export async function displayNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids.filter((i): i is string => !!i)));
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const { data } = await adminClient().from("profiles").select("id, display_name").in("id", unique);
  for (const p of (data ?? []) as { id: string; display_name: string }[]) map.set(p.id, p.display_name || p.id.slice(0, 8));
  for (const id of unique) if (!map.has(id)) map.set(id, id.slice(0, 8));
  return map;
}

export async function getTrackAdmin(id: string) {
  const db = adminClient();
  const { data: track } = await db
    .from("tracks")
    .select("*, characters(id, name, status)")
    .eq("id", id)
    .maybeSingle();
  if (!track) return null;
  const { data: units } = await db.from("units").select("*, unit_items(lesson_id)").eq("track_id", id).order("sort_order");
  const statusMap = await versionStatusByLesson();
  return {
    track: track as Record<string, unknown> & { id: string; slug: string; title: string; status: string; pending: Record<string, string> | null; characters: { id: string; name: string; status: string } | null },
    units: ((units ?? []) as (Record<string, unknown> & { id: string; title: string; status: string; sort_order: number; unit_items: { lesson_id: string }[] })[]).map((u) => {
      const counts: StatusCounts = { draft: 0, reviewed: 0, published: 0, none: 0 };
      for (const it of u.unit_items) {
        const s = statusMap.get(it.lesson_id);
        if (!s) counts.none++;
        else {
          if (s.published) counts.published++;
          if (s.working === "draft") counts.draft++;
          if (s.working === "reviewed") counts.reviewed++;
        }
      }
      return { ...u, counts, total: u.unit_items.length };
    }),
  };
}

export async function getUnitAdmin(id: string) {
  const db = adminClient();
  const { data: unit } = await db.from("units").select("*, tracks(id, slug, title)").eq("id", id).maybeSingle();
  if (!unit) return null;
  const { data: items } = await db
    .from("unit_items")
    .select("id, position, lesson_id, lessons(id, slug, kind, lesson_versions(id, version, status, title))")
    .eq("unit_id", id)
    .order("position");
  return {
    unit: unit as Record<string, unknown> & {
      id: string;
      title: string;
      description: string;
      scene: string;
      status: string;
      pending: Record<string, string> | null;
      tracks: { id: string; slug: string; title: string };
    },
    items: ((items ?? []) as unknown as {
      id: string;
      position: number;
      lesson_id: string;
      lessons: { id: string; slug: string; kind: string; lesson_versions: { id: string; version: number; status: string; title: string }[] };
    }[]).map((it) => {
      const versions = it.lessons.lesson_versions;
      const working = versions.find((v) => v.status === "draft" || v.status === "reviewed") ?? null;
      const published = versions.find((v) => v.status === "published") ?? null;
      return { ...it, working, published, title: (working ?? published ?? versions[0])?.title ?? it.lessons.slug };
    }),
  };
}

export type AdminExercise = {
  id: string;
  key: string;
  position: number;
  type: string;
  prompt: string;
  data: unknown;
  reference: string;
  solution: unknown;
  explanation: string;
};

export async function getLessonAdmin(lessonId: string) {
  const db = adminClient();
  const { data: lesson } = await db.from("lessons").select("id, slug, kind").eq("id", lessonId).maybeSingle();
  if (!lesson) return null;
  const { data: versions } = await db
    .from("lesson_versions")
    .select("id, version, status, title, objective, content, ai_generated, edited_in_admin, created_by, created_at, updated_by, updated_at, reviewed_by, reviewed_at, published_by, published_at, archived_at")
    .eq("lesson_id", lessonId)
    .order("version", { ascending: false });
  const versionRows = (versions ?? []) as {
    id: string;
    version: number;
    status: string;
    title: string;
    objective: string;
    content: Record<string, unknown>;
    ai_generated: boolean;
    edited_in_admin: boolean;
    created_by: string | null;
    created_at: string;
    updated_by: string | null;
    updated_at: string;
    reviewed_by: string | null;
    reviewed_at: string | null;
    published_by: string | null;
    published_at: string | null;
    archived_at: string | null;
  }[];
  const working = versionRows.find((v) => v.status === "draft" || v.status === "reviewed") ?? null;
  const published = versionRows.find((v) => v.status === "published") ?? null;
  const shown = working ?? published ?? versionRows[0] ?? null;

  let exercises: AdminExercise[] = [];
  if (shown) {
    const { data: ex } = await db
      .from("exercises")
      .select("id, key, position, type, prompt, data, reference, exercise_solutions(solution, explanation)")
      .eq("lesson_version_id", shown.id)
      .order("position");
    exercises = ((ex ?? []) as unknown as (Omit<AdminExercise, "solution" | "explanation"> & { exercise_solutions: { solution: unknown; explanation: string } | null })[]).map(
      (e) => ({ ...e, solution: e.exercise_solutions?.solution ?? null, explanation: e.exercise_solutions?.explanation ?? "" }),
    );
  }

  const { data: placements } = await db.from("unit_items").select("unit_id, units(id, title, tracks(slug, title))").eq("lesson_id", lessonId);
  const { data: log } = await db
    .from("editorial_log")
    .select("action, actor_id, created_at, note, entity_id")
    .eq("entity_type", "lesson_version")
    .in("entity_id", versionRows.map((v) => v.id))
    .order("created_at", { ascending: false })
    .limit(30);
  const names = await displayNames([
    ...versionRows.flatMap((v) => [v.created_by, v.reviewed_by, v.published_by, v.updated_by]),
    ...((log ?? []) as { actor_id: string | null }[]).map((l) => l.actor_id),
  ]);

  return {
    lesson: lesson as { id: string; slug: string; kind: string },
    versions: versionRows,
    working,
    published,
    shown,
    exercises,
    placements: ((placements ?? []) as unknown as { units: { id: string; title: string; tracks: { slug: string; title: string } } }[]).map((p) => p.units),
    log: (log ?? []) as { action: string; actor_id: string | null; created_at: string; note: string | null; entity_id: string }[],
    names,
  };
}
