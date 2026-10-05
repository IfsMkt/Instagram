import { createHash } from "node:crypto";
import type { ExerciseType } from "@/lib/domain/exercises";
import { validateExercise } from "@/lib/domain/exercises";
import type { Block, CharacterDef, ExerciseDef, LessonDef, ReviewDef, TrackDef } from "./schema";

/** Exercício pronto para o banco: dados públicos separados da solução. */
export type CompiledExercise = {
  key: string;
  position: number;
  type: ExerciseType;
  prompt: string;
  data: unknown;
  solution: unknown;
  explanation: string;
  reference: string;
};

export type CompiledLesson = {
  slug: string;
  kind: "lesson" | "unit_review";
  title: string;
  objective: string;
  content: {
    references: string[];
    context: string;
    blocks: Block[];
    takeaways: string[];
    reflection: string | null;
    minutes: number;
  };
  exercises: CompiledExercise[];
  hash: string;
};

export type CompiledUnit = {
  slug: string;
  title: string;
  description: string;
  scene: string;
  sortOrder: number;
  lessonSlugs: string[];
};

export type CompiledTrack = {
  slug: string;
  kind: "general" | "character";
  characterSlug: string | null;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  scene: string;
  sortOrder: number;
  units: CompiledUnit[];
};

export type Catalog = {
  characters: (CharacterDef & { sortOrder: number })[];
  tracks: CompiledTrack[];
  lessons: Map<string, CompiledLesson>;
};

// ---------------------------------------------------------------------
// Embaralhamento determinístico (estável entre execuções do seed)
// ---------------------------------------------------------------------
function seededRandom(seed: string): () => number {
  let h = createHash("sha256").update(seed).digest().readUInt32LE(0);
  return () => {
    h ^= h << 13;
    h >>>= 0;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    return h / 0x1_0000_0000;
  };
}

function shuffle<T>(items: T[], seed: string): T[] {
  const rand = seededRandom(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  // Evita que a ordem embaralhada coincida com a resposta em ordenações.
  if (out.length > 1 && out.every((v, i) => v === items[i])) {
    out.push(out.shift() as T);
  }
  return out;
}

/** Converte a definição de autoria em dados públicos + solução. IDs não revelam a resposta. */
export function compileExercise(def: ExerciseDef, key: string, position: number): CompiledExercise {
  const base = { key, position, explanation: def.explanation, reference: def.reference };
  switch (def.type) {
    case "mc":
    case "fill": {
      const indexed = def.options.map((text, i) => ({ text, original: i }));
      const shuffled = shuffle(indexed, key).map((o, i) => ({ ...o, id: `o${i + 1}` }));
      const correct = shuffled.find((o) => o.original === def.answer);
      if (!correct) throw new Error(`Resposta fora das opções em ${key}`);
      const options = shuffled.map(({ id, text }) => ({ id, text }));
      if (def.type === "mc") {
        return { ...base, type: "multiple_choice", prompt: def.prompt, data: { options }, solution: { optionId: correct.id } };
      }
      return {
        ...base,
        type: "fill_blank",
        prompt: def.prompt ?? "Complete a frase.",
        data: { before: def.before, after: def.after, options },
        solution: { optionId: correct.id },
      };
    }
    case "tf":
      return { ...base, type: "true_false", prompt: def.prompt, data: {}, solution: { value: def.answer } };
    case "match": {
      const left = def.pairs.map(([l], i) => ({ id: `l${i + 1}`, text: l, original: i }));
      const right = shuffle(
        def.pairs.map(([, r], i) => ({ text: r, original: i })),
        key,
      ).map((r, i) => ({ ...r, id: `r${i + 1}` }));
      const pairs: Record<string, string> = {};
      for (const l of left) pairs[l.id] = right.find((r) => r.original === l.original)!.id;
      return {
        ...base,
        type: "matching",
        prompt: def.prompt,
        data: { left: left.map(({ id, text }) => ({ id, text })), right: right.map(({ id, text }) => ({ id, text })) },
        solution: { pairs },
      };
    }
    case "order": {
      const indexed = def.items.map((text, i) => ({ text, original: i }));
      const shuffled = shuffle(indexed, key).map((o, i) => ({ ...o, id: `i${i + 1}` }));
      const orderIds = indexed.map((o) => shuffled.find((s) => s.original === o.original)!.id);
      return {
        ...base,
        type: "ordering",
        prompt: def.prompt,
        data: { items: shuffled.map(({ id, text }) => ({ id, text })) },
        solution: { order: orderIds },
      };
    }
  }
}

function hashLesson(l: Omit<CompiledLesson, "hash">): string {
  return createHash("sha256").update(JSON.stringify(l)).digest("hex").slice(0, 32);
}

export function compileLesson(def: LessonDef): CompiledLesson {
  const exercises = def.exercises.map((e, i) => compileExercise(e, `${def.slug}:e${i + 1}`, i + 1));
  const lesson: Omit<CompiledLesson, "hash"> = {
    slug: def.slug,
    kind: "lesson",
    title: def.title,
    objective: def.objective,
    content: {
      references: def.references,
      context: def.context,
      blocks: def.blocks,
      takeaways: def.takeaways,
      reflection: def.reflection ?? null,
      minutes: 5,
    },
    exercises,
  };
  return { ...lesson, hash: hashLesson(lesson) };
}

/** Escolha padrão de exercícios reaproveitados na revisão da unidade (6 itens). */
export const DEFAULT_REVIEW_PICK: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 1],
  [3, 2],
  [4, 1],
  [2, 3],
];

export function compileReview(def: ReviewDef, unitLessons: LessonDef[], unitTitle: string): CompiledLesson {
  const pick = def.pick ?? DEFAULT_REVIEW_PICK;
  const picked: ExerciseDef[] = pick.map(([li, ei]) => {
    const lesson = unitLessons[li];
    const ex = lesson?.exercises[ei];
    if (!ex) throw new Error(`Revisão ${def.slug}: exercício [${li}, ${ei}] não existe.`);
    return ex;
  });
  const all = [...picked, ...def.extra];
  // Intercala os novos entre os reaproveitados para variar o ritmo.
  const ordered = shuffle(all, `${def.slug}:ordem`);
  const exercises = ordered.map((e, i) => compileExercise(e, `${def.slug}:e${i + 1}`, i + 1));
  const references = Array.from(new Set(unitLessons.flatMap((l) => l.references))).slice(0, 8);
  const lesson: Omit<CompiledLesson, "hash"> = {
    slug: def.slug,
    kind: "unit_review",
    title: def.title,
    objective: `Relembrar o que você aprendeu em “${unitTitle}”.`,
    content: {
      references,
      context: def.intro,
      blocks: [],
      takeaways: def.takeaways,
      reflection: null,
      minutes: 5,
    },
    exercises,
  };
  return { ...lesson, hash: hashLesson(lesson) };
}

/** Monta o catálogo completo e resolve lições compartilhadas entre trilhas. */
export function buildCatalog(tracks: TrackDef[]): Catalog {
  const lessonDefs = new Map<string, LessonDef>();
  for (const t of tracks)
    for (const u of t.units)
      for (const l of u.lessons)
        if (typeof l !== "string") {
          if (lessonDefs.has(l.slug)) throw new Error(`Slug de lição duplicado: ${l.slug}`);
          lessonDefs.set(l.slug, l);
        }

  const lessons = new Map<string, CompiledLesson>();
  for (const [slug, def] of lessonDefs) lessons.set(slug, compileLesson(def));

  const characters: Catalog["characters"] = [];
  const compiledTracks: CompiledTrack[] = tracks.map((t, ti) => {
    if (t.character) characters.push({ ...t.character, sortOrder: ti });
    return {
      slug: t.slug,
      kind: t.kind,
      characterSlug: t.character?.slug ?? null,
      title: t.title,
      subtitle: t.subtitle,
      description: t.description,
      color: t.color,
      scene: t.scene,
      sortOrder: ti,
      units: t.units.map((u, ui) => {
        const resolved = u.lessons.map((l) => {
          const def = typeof l === "string" ? lessonDefs.get(l) : l;
          if (!def) throw new Error(`Lição compartilhada não encontrada: ${String(l)}`);
          return def;
        });
        if (lessons.has(u.review.slug)) throw new Error(`Slug duplicado: ${u.review.slug}`);
        lessons.set(u.review.slug, compileReview(u.review, resolved, u.title));
        return {
          slug: u.slug,
          title: u.title,
          description: u.description,
          scene: u.scene,
          sortOrder: ui + 1,
          lessonSlugs: [...resolved.map((l) => l.slug), u.review.slug],
        };
      }),
    };
  });

  return { characters, tracks: compiledTracks, lessons };
}

/** Verificações editoriais estruturais (usadas em testes e antes do seed). */
export function validateCatalog(catalog: Catalog): string[] {
  const errors: string[] = [];
  const unitSlugs = new Set<string>();
  for (const t of catalog.tracks) {
    if (t.kind === "general" && t.units.length < 10) errors.push(`${t.slug}: jornada geral precisa de 10 unidades`);
    if (t.kind === "character" && t.units.length < 3) errors.push(`${t.slug}: precisa de 3 unidades`);
    for (const u of t.units) {
      if (unitSlugs.has(u.slug)) errors.push(`unidade duplicada ${u.slug}`);
      unitSlugs.add(u.slug);
      const kinds = u.lessonSlugs.map((s) => catalog.lessons.get(s)?.kind);
      const regular = kinds.filter((k) => k === "lesson").length;
      if (regular < 5) errors.push(`${u.slug}: precisa de pelo menos 5 lições (tem ${regular})`);
      if (kinds[kinds.length - 1] !== "unit_review") errors.push(`${u.slug}: deve terminar com revisão`);
    }
  }
  for (const [slug, l] of catalog.lessons) {
    if (!/^[a-z0-9-]+$/.test(slug)) errors.push(`${slug}: slug inválido`);
    const n = l.exercises.length;
    if (l.kind === "lesson" && (n < 4 || n > 6)) errors.push(`${slug}: lição precisa de 4 a 6 exercícios (tem ${n})`);
    if (l.kind === "unit_review" && (n < 8 || n > 10)) errors.push(`${slug}: revisão precisa de 8 a 10 questões (tem ${n})`);
    if (l.content.takeaways.length !== 3) errors.push(`${slug}: precisa de 3 aprendizados`);
    if (l.content.references.length === 0) errors.push(`${slug}: sem referências`);
    if (l.kind === "lesson" && l.content.blocks.length < 2) errors.push(`${slug}: precisa de blocos explicativos`);
    for (const blk of l.content.blocks) {
      if (blk.kind === "citacao" && !blk.translation) errors.push(`${slug}: citação sem tradução identificada`);
    }
    const keys = new Set<string>();
    for (const e of l.exercises) {
      if (keys.has(e.key)) errors.push(`${e.key}: chave duplicada`);
      keys.add(e.key);
      if (!e.explanation.trim()) errors.push(`${e.key}: sem explicação`);
      if (!e.reference.trim()) errors.push(`${e.key}: sem referência`);
      if (!e.prompt.trim()) errors.push(`${e.key}: sem enunciado`);
      const problem = validateExercise(e.type, e.data, e.solution);
      if (problem) errors.push(`${e.key}: ${problem}`);
    }
  }
  return errors;
}
