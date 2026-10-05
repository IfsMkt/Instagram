/**
 * Conquistas: celebram hábitos de estudo. Nada aqui mede fé.
 */

export type AchievementStats = {
  lessonsCompleted: number;
  unitsCompleted: number;
  tracksCompleted: number;
  tracksStarted: number;
  currentStreak: number;
  reviewCorrect: number;
  notesCount: number;
  dailyGoalMetDays: number;
};

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  /** Cor do selo (token da paleta). */
  color: "green" | "blue" | "coral" | "yellow" | "lilac";
  icon: "footprint" | "book" | "flag" | "flame" | "spark" | "compass" | "pen" | "target" | "mountain" | "star";
  earned: (s: AchievementStats) => boolean;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "primeiro-passo",
    title: "Primeiro passo",
    description: "Concluiu a primeira lição.",
    color: "green",
    icon: "footprint",
    earned: (s) => s.lessonsCompleted >= 1,
  },
  {
    id: "cinco-licoes",
    title: "Pé na estrada",
    description: "Concluiu 5 lições.",
    color: "blue",
    icon: "book",
    earned: (s) => s.lessonsCompleted >= 5,
  },
  {
    id: "vinte-licoes",
    title: "Leitura constante",
    description: "Concluiu 20 lições.",
    color: "lilac",
    icon: "book",
    earned: (s) => s.lessonsCompleted >= 20,
  },
  {
    id: "primeira-unidade",
    title: "Etapa vencida",
    description: "Concluiu uma unidade inteira, com a revisão final.",
    color: "yellow",
    icon: "flag",
    earned: (s) => s.unitsCompleted >= 1,
  },
  {
    id: "sequencia-3",
    title: "Três dias seguidos",
    description: "Estudou três dias em sequência.",
    color: "coral",
    icon: "flame",
    earned: (s) => s.currentStreak >= 3,
  },
  {
    id: "sequencia-7",
    title: "Uma semana de caminhada",
    description: "Estudou sete dias em sequência.",
    color: "coral",
    icon: "flame",
    earned: (s) => s.currentStreak >= 7,
  },
  {
    id: "memoria-viva",
    title: "Memória viva",
    description: "Acertou 10 questões na área de revisão.",
    color: "blue",
    icon: "spark",
    earned: (s) => s.reviewCorrect >= 10,
  },
  {
    id: "explorador",
    title: "Explorador de jornadas",
    description: "Começou duas jornadas diferentes.",
    color: "green",
    icon: "compass",
    earned: (s) => s.tracksStarted >= 2,
  },
  {
    id: "caderno-aberto",
    title: "Caderno aberto",
    description: "Escreveu a primeira anotação ou reflexão.",
    color: "lilac",
    icon: "pen",
    earned: (s) => s.notesCount >= 1,
  },
  {
    id: "meta-do-dia",
    title: "Meta do dia",
    description: "Cumpriu a meta diária pela primeira vez.",
    color: "yellow",
    icon: "target",
    earned: (s) => s.dailyGoalMetDays >= 1,
  },
  {
    id: "trilha-completa",
    title: "Trilha completa",
    description: "Concluiu todas as lições publicadas de uma jornada.",
    color: "green",
    icon: "mountain",
    earned: (s) => s.tracksCompleted >= 1,
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Conquistas recém-alcançadas (ainda não registradas). */
export function newlyEarned(stats: AchievementStats, alreadyEarned: ReadonlySet<string>): AchievementDef[] {
  return ACHIEVEMENTS.filter((a) => !alreadyEarned.has(a.id) && a.earned(stats));
}
