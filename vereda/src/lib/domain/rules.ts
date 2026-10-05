/**
 * Regras de aprendizado e gamificação do Vereda — fonte única.
 * Pontos e níveis medem atividades de estudo, nunca fé ou espiritualidade.
 */

export const RULES = {
  /** XP pela PRIMEIRA conclusão de uma lição. Repetir não concede XP. */
  lessonFirstCompletionXp: 15,
  /** XP pela PRIMEIRA conclusão da revisão final de uma unidade. */
  unitReviewFirstCompletionXp: 30,
  /** XP por acerto na área "Vamos lembrar?". */
  spacedReviewCorrectXp: 2,
  /** Máximo de acertos de revisão que rendem XP por dia (10 × 2 = 20 XP/dia). */
  spacedReviewDailyXpSlots: 10,
  /** Minutos estimados de estudo para meta diária e sequência. */
  lessonMinutes: 5,
  reviewAnswerMinutes: 1,
  /** Um dia conta para a sequência quando soma pelo menos estes minutos. */
  streakMinMinutes: 5,
  /** Metas diárias disponíveis, em minutos. */
  dailyGoalOptions: [5, 10, 15] as const,
  /** Intervalos da revisão espaçada, em dias, por estágio (0..3). */
  reviewIntervalsDays: [1, 3, 7, 14] as const,
  /** Estágio que representa um item dominado (sai da fila). */
  reviewMasteredStage: 4,
  /** Itens por sessão de revisão. */
  reviewSessionSize: 8,
  /** Após concluir uma lição, quantos exercícios acertados entram como reforço programado. */
  scheduledReinforcementsPerLesson: 2,
} as const;

export type DailyGoal = (typeof RULES.dailyGoalOptions)[number];

export function isDailyGoal(value: number): value is DailyGoal {
  return (RULES.dailyGoalOptions as readonly number[]).includes(value);
}

/** Níveis de aprendizado (XP acumulado mínimo). */
export const LEVELS = [
  { level: 1, minXp: 0, name: "Primeiros passos" },
  { level: 2, minXp: 60, name: "Caminhante" },
  { level: 3, minXp: 150, name: "Explorador de trilhas" },
  { level: 4, minXp: 300, name: "Leitor atento" },
  { level: 5, minXp: 500, name: "Viajante dos livros" },
  { level: 6, minXp: 800, name: "Navegador de histórias" },
  { level: 7, minXp: 1200, name: "Cartógrafo das Escrituras" },
  { level: 8, minXp: 1700, name: "Guia de veredas" },
  { level: 9, minXp: 2300, name: "Mestre das trilhas" },
  { level: 10, minXp: 3000, name: "Grande explorador" },
] as const;

export type LevelInfo = {
  level: number;
  name: string;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  /** 0..1 dentro do nível atual. */
  progress: number;
};

export function levelForXp(totalXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(totalXp));
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].minXp) index = i;
  }
  const current = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  const progress = next ? (xp - current.minXp) / (next.minXp - current.minXp) : 1;
  return {
    level: current.level,
    name: current.name,
    xp,
    currentLevelXp: current.minXp,
    nextLevelXp: next ? next.minXp : null,
    progress: Math.min(1, Math.max(0, progress)),
  };
}

/** XP concedido na primeira conclusão, conforme o tipo da lição. */
export function xpForFirstCompletion(kind: "lesson" | "unit_review"): number {
  return kind === "unit_review" ? RULES.unitReviewFirstCompletionXp : RULES.lessonFirstCompletionXp;
}

export function xpSourceType(kind: "lesson" | "unit_review"): "lesson" | "unit_review" {
  return kind;
}

/** Minutos estimados de um dia de atividade. */
export function minutesFor(lessonsCompleted: number, reviewAnswers: number): number {
  return lessonsCompleted * RULES.lessonMinutes + reviewAnswers * RULES.reviewAnswerMinutes;
}
