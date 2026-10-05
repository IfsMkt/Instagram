import type { Metadata } from "next";
import { Notebook } from "@/components/notebook/Notebook";
import { requireOnboarded } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Caderno" };

function escapeLike(q: string) {
  return q.replace(/[\\%_,()]/g, (c) => `\\${c}`);
}

export default async function NotebookPage({ searchParams }: { searchParams: Promise<{ q?: string; aba?: string }> }) {
  const { user } = await requireOnboarded();
  const { q, aba } = await searchParams;
  const query = (q ?? "").trim().slice(0, 80);
  const db = await createClient();

  let notesQuery = db
    .from("notes")
    .select("id, kind, title, body, reference, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(200);
  let favQuery = db.from("favorites").select("id, reference, note, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200);
  if (query) {
    const like = `%${escapeLike(query)}%`;
    notesQuery = notesQuery.or(`title.ilike.${like},body.ilike.${like},reference.ilike.${like}`);
    favQuery = favQuery.or(`reference.ilike.${like},note.ilike.${like}`);
  }
  const [notes, favorites] = await Promise.all([notesQuery, favQuery]);
  const tab = aba === "favoritos" || aba === "reflexoes" ? aba : "anotacoes";

  return (
    <Notebook
      key={`${tab}-${query}`}
      tab={tab}
      query={query}
      notes={(notes.data ?? []) as Parameters<typeof Notebook>[0]["notes"]}
      favorites={(favorites.data ?? []) as Parameters<typeof Notebook>[0]["favorites"]}
      loadError={notes.error || favorites.error ? "Não foi possível carregar seu caderno agora." : null}
    />
  );
}
