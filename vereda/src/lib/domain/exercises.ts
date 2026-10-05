import { z } from "zod";

/**
 * Formatos dos exercícios.
 * - `data` é público (vai para o navegador): nunca contém a resposta.
 * - `solution` fica apenas no servidor/banco (tabela exercise_solutions).
 * IDs de opções são estáveis e não revelam a resposta.
 */

export const EXERCISE_TYPES = ["multiple_choice", "true_false", "matching", "ordering", "fill_blank"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou falso",
  matching: "Associação",
  ordering: "Ordenação",
  fill_blank: "Complete a frase",
};

const idText = z.object({ id: z.string().regex(/^[a-z0-9]+$/).max(12), text: z.string().min(1).max(300) });
export type IdText = z.infer<typeof idText>;

export const publicDataSchemas = {
  multiple_choice: z.object({ options: z.array(idText).min(2).max(6) }),
  true_false: z.object({}),
  fill_blank: z.object({
    before: z.string().max(400),
    after: z.string().max(400),
    options: z.array(idText).min(2).max(6),
  }),
  matching: z.object({ left: z.array(idText).min(2).max(6), right: z.array(idText).min(2).max(6) }),
  ordering: z.object({ items: z.array(idText).min(2).max(7) }),
} satisfies Record<ExerciseType, z.ZodTypeAny>;

export const solutionSchemas = {
  multiple_choice: z.object({ optionId: z.string() }),
  true_false: z.object({ value: z.boolean() }),
  fill_blank: z.object({ optionId: z.string() }),
  matching: z.object({ pairs: z.record(z.string(), z.string()) }),
  ordering: z.object({ order: z.array(z.string()).min(2) }),
} satisfies Record<ExerciseType, z.ZodTypeAny>;

/** As respostas enviadas pelo navegador têm o mesmo formato das soluções. */
export const answerSchemas = solutionSchemas;

export type PublicData = {
  multiple_choice: z.infer<typeof publicDataSchemas.multiple_choice>;
  true_false: z.infer<typeof publicDataSchemas.true_false>;
  fill_blank: z.infer<typeof publicDataSchemas.fill_blank>;
  matching: z.infer<typeof publicDataSchemas.matching>;
  ordering: z.infer<typeof publicDataSchemas.ordering>;
};
export type Solution = {
  multiple_choice: z.infer<typeof solutionSchemas.multiple_choice>;
  true_false: z.infer<typeof solutionSchemas.true_false>;
  fill_blank: z.infer<typeof solutionSchemas.fill_blank>;
  matching: z.infer<typeof solutionSchemas.matching>;
  ordering: z.infer<typeof solutionSchemas.ordering>;
};

export type PublicExercise = {
  key: string;
  type: ExerciseType;
  prompt: string;
  data: unknown;
  reference: string;
};

export function isExerciseType(value: unknown): value is ExerciseType {
  return typeof value === "string" && (EXERCISE_TYPES as readonly string[]).includes(value);
}

export type GradeResult = { valid: true; correct: boolean; normalized: unknown } | { valid: false; error: string };

/**
 * Corrige uma resposta. Valida o formato e se os IDs pertencem ao exercício.
 */
export function gradeAnswer(type: ExerciseType, data: unknown, solution: unknown, answer: unknown): GradeResult {
  const sol = solutionSchemas[type].safeParse(solution);
  if (!sol.success) return { valid: false, error: "Gabarito inválido." };
  const ans = answerSchemas[type].safeParse(answer);
  if (!ans.success) return { valid: false, error: "Resposta em formato inválido." };
  const pub = publicDataSchemas[type].safeParse(data);
  if (!pub.success) return { valid: false, error: "Exercício inválido." };

  switch (type) {
    case "multiple_choice":
    case "fill_blank": {
      const a = ans.data as Solution["multiple_choice"];
      const s = sol.data as Solution["multiple_choice"];
      const options = (pub.data as PublicData["multiple_choice"]).options;
      if (!options.some((o) => o.id === a.optionId)) return { valid: false, error: "Opção desconhecida." };
      return { valid: true, correct: a.optionId === s.optionId, normalized: { optionId: a.optionId } };
    }
    case "true_false": {
      const a = ans.data as Solution["true_false"];
      const s = sol.data as Solution["true_false"];
      return { valid: true, correct: a.value === s.value, normalized: { value: a.value } };
    }
    case "matching": {
      const a = ans.data as Solution["matching"];
      const s = sol.data as Solution["matching"];
      const d = pub.data as PublicData["matching"];
      const leftIds = new Set(d.left.map((l) => l.id));
      const rightIds = new Set(d.right.map((r) => r.id));
      const entries = Object.entries(a.pairs);
      if (entries.length !== leftIds.size) return { valid: false, error: "Associe todos os itens." };
      const usedRight = new Set<string>();
      for (const [l, r] of entries) {
        if (!leftIds.has(l) || !rightIds.has(r)) return { valid: false, error: "Item desconhecido." };
        if (usedRight.has(r)) return { valid: false, error: "Cada item só pode ser usado uma vez." };
        usedRight.add(r);
      }
      const correct = Object.entries(s.pairs).every(([l, r]) => a.pairs[l] === r);
      const normalized = { pairs: Object.fromEntries(entries.sort(([x], [y]) => x.localeCompare(y))) };
      return { valid: true, correct, normalized };
    }
    case "ordering": {
      const a = ans.data as Solution["ordering"];
      const s = sol.data as Solution["ordering"];
      const ids = new Set((pub.data as PublicData["ordering"]).items.map((i) => i.id));
      if (a.order.length !== ids.size || new Set(a.order).size !== ids.size || !a.order.every((id) => ids.has(id))) {
        return { valid: false, error: "Ordene todos os itens." };
      }
      const correct = a.order.length === s.order.length && a.order.every((id, i) => id === s.order[i]);
      return { valid: true, correct, normalized: { order: a.order } };
    }
  }
}

/** Valida um exercício completo (usado no seed e no editor administrativo). */
export function validateExercise(type: ExerciseType, data: unknown, solution: unknown): string | null {
  const pub = publicDataSchemas[type].safeParse(data);
  if (!pub.success) return `Dados públicos inválidos: ${pub.error.issues[0]?.message ?? ""}`;
  const sol = solutionSchemas[type].safeParse(solution);
  if (!sol.success) return `Solução inválida: ${sol.error.issues[0]?.message ?? ""}`;
  // A própria solução precisa ser uma resposta válida e correta.
  const graded = gradeAnswer(type, data, solution, solution);
  if (!graded.valid) return graded.error;
  if (!graded.correct) return "A solução não é considerada correta pelo corretor.";
  if (type === "matching") {
    const d = pub.data as PublicData["matching"];
    if (d.left.length !== d.right.length) return "Associação precisa de colunas do mesmo tamanho.";
  }
  return null;
}
