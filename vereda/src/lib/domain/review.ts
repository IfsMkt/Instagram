import { addDays } from "./dates";
import { RULES } from "./rules";

export type ReviewSchedule = {
  stage: number;
  /** AAAA-MM-DD, ou null quando o item foi dominado. */
  dueOn: string | null;
};

/** Agendamento após um erro (em lição ou revisão): volta ao intervalo inicial. */
export function scheduleAfterMistake(today: string): ReviewSchedule {
  return { stage: 0, dueOn: addDays(today, RULES.reviewIntervalsDays[0]) };
}

/** Primeiro agendamento de um reforço programado (exercício acertado na lição). */
export function scheduleReinforcement(today: string): ReviewSchedule {
  return { stage: 1, dueOn: addDays(today, RULES.reviewIntervalsDays[1]) };
}

/**
 * Próximo estado após responder um item de revisão.
 * Intervalos: 1, 3, 7 e 14 dias. Acerto no estágio 3 (14 dias) → dominado.
 * Erro em qualquer estágio → volta para 1 dia.
 */
export function nextReviewSchedule(currentStage: number, correct: boolean, today: string): ReviewSchedule {
  if (!correct) return scheduleAfterMistake(today);
  const nextStage = Math.min(currentStage + 1, RULES.reviewMasteredStage);
  if (nextStage >= RULES.reviewMasteredStage) {
    return { stage: RULES.reviewMasteredStage, dueOn: null };
  }
  return { stage: nextStage, dueOn: addDays(today, RULES.reviewIntervalsDays[nextStage]) };
}

export function isDue(dueOn: string | null, today: string): boolean {
  return dueOn !== null && dueOn <= today;
}

/** Texto amigável sobre o que será reforçado. */
export function describeStage(stage: number): string {
  switch (stage) {
    case 0:
      return "Volta amanhã para fixar";
    case 1:
      return "Reforço em 3 dias";
    case 2:
      return "Reforço em 7 dias";
    case 3:
      return "Último reforço em 14 dias";
    default:
      return "Aprendido";
  }
}
