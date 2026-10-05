/**
 * Seed reproduzível do conteúdo do Vereda.
 *
 * - Usa SUPABASE_SERVICE_ROLE_KEY (somente no servidor/terminal).
 * - Todo conteúdo novo entra como RASCUNHO (status 'draft'), marcado como
 *   gerado com apoio de IA. O seed NUNCA marca nada como revisado/publicado.
 * - Pode ser executado várias vezes: não duplica registros e nunca apaga
 *   progresso de usuários.
 * - Não sobrescreve versões editadas no painel administrativo.
 *
 * Uso: npm run db:seed            (valida o catálogo completo)
 *      npm run db:seed -- --allow-incomplete   (aceita catálogo parcial)
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getCatalog } from "../src/content";
import { validateCatalog, type CompiledLesson } from "../src/content/compile";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

type Stats = Record<string, number>;
const stats: Stats = {};
const bump = (k: string) => (stats[k] = (stats[k] ?? 0) + 1);

function must<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

async function upsertBySlug(
  db: SupabaseClient,
  table: "characters" | "tracks" | "units",
  slug: string,
  insertRow: Record<string, unknown>,
  updatable: Record<string, unknown>,
): Promise<string> {
  const existing = must(
    await db.from(table).select("id, status, updated_by, pending").eq("slug", slug).maybeSingle(),
    `${table} ${slug}`,
  ) as { id: string; status: string; updated_by: string | null } | null;
  if (!existing) {
    const row = must(
      await db
        .from(table)
        .insert({ ...insertRow, slug, ai_generated: true, status: "draft" })
        .select("id")
        .single(),
      `inserir ${table} ${slug}`,
    ) as { id: string };
    bump(`${table}:criados`);
    return row.id;
  }
  // Só atualiza rascunhos que ninguém editou no painel.
  if (existing.status === "draft" && existing.updated_by === null) {
    must(await db.from(table).update(updatable).eq("id", existing.id), `atualizar ${table} ${slug}`);
    bump(`${table}:sincronizados`);
  } else {
    bump(`${table}:preservados`);
  }
  return existing.id;
}

async function writeExercises(db: SupabaseClient, versionId: string, lesson: CompiledLesson) {
  must(await db.from("exercises").delete().eq("lesson_version_id", versionId), "limpar exercícios");
  const rows = lesson.exercises.map((e) => ({
    lesson_version_id: versionId,
    key: e.key,
    position: e.position,
    type: e.type,
    prompt: e.prompt,
    data: e.data,
    reference: e.reference,
  }));
  const inserted = must(
    await db.from("exercises").insert(rows).select("id, key"),
    `exercícios ${lesson.slug}`,
  ) as { id: string; key: string }[];
  const byKey = new Map(inserted.map((r) => [r.key, r.id]));
  must(
    await db.from("exercise_solutions").insert(
      lesson.exercises.map((e) => ({
        exercise_id: byKey.get(e.key),
        solution: e.solution,
        explanation: e.explanation,
      })),
    ),
    `gabaritos ${lesson.slug}`,
  );
}

async function syncLesson(db: SupabaseClient, lesson: CompiledLesson): Promise<string> {
  let lessonRow = must(
    await db.from("lessons").select("id").eq("slug", lesson.slug).maybeSingle(),
    `lição ${lesson.slug}`,
  ) as { id: string } | null;
  if (!lessonRow) {
    lessonRow = must(
      await db.from("lessons").insert({ slug: lesson.slug, kind: lesson.kind }).select("id").single(),
      `inserir lição ${lesson.slug}`,
    ) as { id: string };
    bump("lições:criadas");
  }
  const lessonId = lessonRow.id;

  const versions = must(
    await db
      .from("lesson_versions")
      .select("id, version, status, seed_hash, edited_in_admin")
      .eq("lesson_id", lessonId)
      .order("version", { ascending: false }),
    `versões ${lesson.slug}`,
  ) as { id: string; version: number; status: string; seed_hash: string | null; edited_in_admin: boolean }[];

  const working = versions.find((v) => v.status === "draft" || v.status === "reviewed");
  const published = versions.find((v) => v.status === "published");
  const fields = { title: lesson.title, objective: lesson.objective, content: lesson.content };

  if (working) {
    if (working.edited_in_admin) {
      bump("versões:preservadas (editadas no painel)");
      return lessonId;
    }
    if (working.seed_hash === lesson.hash) {
      bump("versões:sem mudanças");
      return lessonId;
    }
    // Atualiza a versão de trabalho (volta a ser rascunho se estava revisada).
    must(
      await db
        .from("lesson_versions")
        .update({ ...fields, status: "draft", reviewed_by: null, reviewed_at: null, seed_hash: null })
        .eq("id", working.id),
      `atualizar versão ${lesson.slug}`,
    );
    await writeExercises(db, working.id, lesson);
    must(await db.from("lesson_versions").update({ seed_hash: lesson.hash }).eq("id", working.id), "hash");
    bump("versões:atualizadas");
    return lessonId;
  }

  if (published && published.seed_hash === lesson.hash) {
    bump("versões:sem mudanças");
    return lessonId;
  }

  // Sem versão de trabalho: cria um novo rascunho (a versão publicada continua no ar).
  const nextVersion = (versions[0]?.version ?? 0) + 1;
  const created = must(
    await db
      .from("lesson_versions")
      .insert({ lesson_id: lessonId, version: nextVersion, status: "draft", ai_generated: true, ...fields })
      .select("id")
      .single(),
    `criar versão ${lesson.slug}`,
  ) as { id: string };
  await writeExercises(db, created.id, lesson);
  must(await db.from("lesson_versions").update({ seed_hash: lesson.hash }).eq("id", created.id), "hash");
  bump(nextVersion === 1 ? "versões:criadas" : "versões:novos rascunhos sobre publicadas");
  return lessonId;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local para rodar o seed.");
    process.exit(1);
  }
  const allowIncomplete = process.argv.includes("--allow-incomplete");
  const catalog = getCatalog();
  const problems = validateCatalog(catalog);
  const structural = problems.filter((p) => !/precisa de (10|3) unidades/.test(p));
  if (structural.length > 0 || (!allowIncomplete && problems.length > 0)) {
    console.error("O catálogo tem problemas e não foi enviado:\n- " + problems.join("\n- "));
    process.exit(1);
  }

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const characterIds = new Map<string, string>();
  for (const c of catalog.characters) {
    const fields = { name: c.name, title: c.title, tagline: c.tagline, description: c.description, color: c.color, scene: c.scene };
    characterIds.set(c.slug, await upsertBySlug(db, "characters", c.slug, { ...fields, sort_order: c.sortOrder }, fields));
  }

  for (const t of catalog.tracks) {
    const fields = { title: t.title, subtitle: t.subtitle, description: t.description, color: t.color, scene: t.scene };
    const trackId = await upsertBySlug(
      db,
      "tracks",
      t.slug,
      { ...fields, kind: t.kind, character_id: t.characterSlug ? characterIds.get(t.characterSlug) : null, sort_order: t.sortOrder },
      fields,
    );

    for (const u of t.units) {
      const ufields = { title: u.title, description: u.description, scene: u.scene };
      let unitId: string;
      const existingUnit = must(await db.from("units").select("id").eq("slug", u.slug).maybeSingle(), "unidade") as { id: string } | null;
      if (!existingUnit) {
        // Escolhe uma posição livre (o painel pode ter reordenado unidades).
        const used = must(await db.from("units").select("sort_order").eq("track_id", trackId), "posições") as { sort_order: number }[];
        const taken = new Set(used.map((r) => r.sort_order));
        const sortOrder = taken.has(u.sortOrder) ? Math.max(0, ...taken) + 1 : u.sortOrder;
        unitId = await upsertBySlug(db, "units", u.slug, { ...ufields, track_id: trackId, sort_order: sortOrder }, ufields);
      } else {
        unitId = await upsertBySlug(db, "units", u.slug, ufields, ufields);
      }

      const items = must(
        await db.from("unit_items").select("lesson_id, position").eq("unit_id", unitId),
        "posições da unidade",
      ) as { lesson_id: string; position: number }[];
      const present = new Set(items.map((i) => i.lesson_id));
      const positions = new Set(items.map((i) => i.position));
      let fallback = Math.max(0, ...positions);

      for (const [index, slug] of u.lessonSlugs.entries()) {
        const lesson = catalog.lessons.get(slug)!;
        const lessonId = await syncLesson(db, lesson);
        if (present.has(lessonId)) continue;
        let position = index + 1;
        if (positions.has(position)) position = ++fallback;
        positions.add(position);
        must(await db.from("unit_items").insert({ unit_id: unitId, lesson_id: lessonId, position }), `posição ${slug}`);
        bump("posições:criadas");
      }
    }
  }

  const exercises = Array.from(catalog.lessons.values()).reduce((n, l) => n + l.exercises.length, 0);
  console.log("Seed concluído (todo conteúdo novo ficou como rascunho).");
  console.log(
    `Catálogo: ${catalog.tracks.length} trilhas, ${catalog.tracks.reduce((n, t) => n + t.units.length, 0)} unidades, ` +
      `${catalog.lessons.size} lições/revisões únicas, ${exercises} exercícios.`,
  );
  for (const [k, v] of Object.entries(stats).sort()) console.log(`  ${k}: ${v}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
