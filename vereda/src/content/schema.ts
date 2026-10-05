/**
 * Formato de autoria do conteúdo do Vereda.
 *
 * Princípios editoriais (veja docs/EDITORIAL.md):
 * - Nada de versículos inventados: usamos resumos próprios (paráfrases) com
 *   referência específica. Citações literais só com licença e tradução identificada.
 * - Cada bloco declara sua natureza: resumo do texto bíblico, contexto histórico,
 *   explicação, interpretação ou diferença entre tradições.
 * - Temas com interpretações divergentes não viram questões de "resposta única".
 * - Todo conteúdo entra no banco como RASCUNHO e precisa de revisão humana.
 */

export type BlockKind =
  | "resumo" // resumo/paráfrase de um texto bíblico
  | "contexto" // contexto histórico/cultural
  | "explicacao" // explicação didática
  | "interpretacao" // leitura/interpretação (identifica quem interpreta)
  | "tradicoes" // diferenças entre tradições
  | "citacao"; // citação literal (exige tradução licenciada)

export const BLOCK_LABEL: Record<BlockKind, string> = {
  resumo: "Resumo do texto bíblico",
  contexto: "Contexto histórico",
  explicacao: "Explicação",
  interpretacao: "Interpretação",
  tradicoes: "Diferentes tradições",
  citacao: "Citação bíblica",
};

export type Block = {
  kind: BlockKind;
  title: string;
  text: string;
  reference?: string;
  /** Obrigatório quando kind = "citacao". */
  translation?: string;
};

export type ExerciseDef =
  | { type: "mc"; prompt: string; options: string[]; answer: number; explanation: string; reference: string }
  | { type: "tf"; prompt: string; answer: boolean; explanation: string; reference: string }
  | {
      type: "fill";
      prompt?: string;
      before: string;
      after: string;
      options: string[];
      answer: number;
      explanation: string;
      reference: string;
    }
  | { type: "match"; prompt: string; pairs: [string, string][]; explanation: string; reference: string }
  | { type: "order"; prompt: string; items: string[]; explanation: string; reference: string };

export type LessonDef = {
  slug: string;
  title: string;
  objective: string;
  references: string[];
  context: string;
  blocks: Block[];
  exercises: ExerciseDef[];
  takeaways: [string, string, string];
  reflection?: string;
};

export type ReviewDef = {
  slug: string;
  title: string;
  intro: string;
  /** Exercícios reaproveitados: [índice da lição na unidade, índice do exercício]. */
  pick?: [number, number][];
  extra: ExerciseDef[];
  takeaways: [string, string, string];
};

export type UnitDef = {
  slug: string;
  title: string;
  description: string;
  scene: SceneName;
  /** Lições novas ou o slug de uma lição compartilhada de outra trilha. */
  lessons: (LessonDef | string)[];
  review: ReviewDef;
};

export type SceneName =
  | "garden"
  | "desert"
  | "river"
  | "sea"
  | "mountain"
  | "city"
  | "palace"
  | "road"
  | "village"
  | "temple";

export type ColorName = "green" | "blue" | "coral" | "yellow" | "lilac" | "teal" | "orange" | "indigo";

export type CharacterDef = {
  slug: string;
  name: string;
  title: string;
  tagline: string;
  description: string;
  color: ColorName;
  scene: SceneName;
};

export type TrackDef = {
  slug: string;
  kind: "general" | "character";
  character?: CharacterDef;
  title: string;
  subtitle: string;
  description: string;
  color: ColorName;
  scene: SceneName;
  units: UnitDef[];
};

// ---------------------------------------------------------------------
// Atalhos de autoria
// ---------------------------------------------------------------------
export const mc = (prompt: string, options: string[], answer: number, explanation: string, reference: string): ExerciseDef => ({
  type: "mc",
  prompt,
  options,
  answer,
  explanation,
  reference,
});

export const tf = (prompt: string, answer: boolean, explanation: string, reference: string): ExerciseDef => ({
  type: "tf",
  prompt,
  answer,
  explanation,
  reference,
});

/** Frase com lacuna: `before ___ after`. */
export const fill = (
  before: string,
  after: string,
  options: string[],
  answer: number,
  explanation: string,
  reference: string,
): ExerciseDef => ({ type: "fill", before, after, options, answer, explanation, reference });

export const match = (prompt: string, pairs: [string, string][], explanation: string, reference: string): ExerciseDef => ({
  type: "match",
  prompt,
  pairs,
  explanation,
  reference,
});

/** `items` na ordem CORRETA; o compilador embaralha de forma determinística. */
export const order = (prompt: string, items: string[], explanation: string, reference: string): ExerciseDef => ({
  type: "order",
  prompt,
  items,
  explanation,
  reference,
});

export const b = (kind: BlockKind, title: string, text: string, reference?: string): Block => ({
  kind,
  title,
  text,
  ...(reference ? { reference } : {}),
});
