import { addDays, diffDays } from "./dates";
import { RULES } from "./rules";

export type ActivityDay = {
  date: string; // AAAA-MM-DD no fuso da pessoa
  minutes: number;
};

export type StreakInfo = {
  /** Dias seguidos com estudo, contando hoje ou ontem. */
  current: number;
  longest: number;
  /** Já estudou o suficiente hoje para contar na sequência. */
  activeToday: boolean;
  /** A sequência continua viva, mas ainda falta estudar hoje. */
  atRisk: boolean;
  /** Havia uma sequência que foi interrompida (para mensagem acolhedora). */
  lost: boolean;
  lastActiveDate: string | null;
};

export function countsForStreak(minutes: number): boolean {
  return minutes >= RULES.streakMinMinutes;
}

/**
 * Calcula a sequência a partir dos dias de atividade (já no fuso local) e do
 * "hoje" local. Um dia sem estudo interrompe a sequência; ontem ainda mantém
 * a sequência viva até o fim do dia de hoje.
 */
export function computeStreak(days: ActivityDay[], today: string): StreakInfo {
  const active = Array.from(
    new Set(days.filter((d) => countsForStreak(d.minutes) && diffDays(d.date, today) >= 0).map((d) => d.date)),
  ).sort();

  if (active.length === 0) {
    return { current: 0, longest: 0, activeToday: false, atRisk: false, lost: false, lastActiveDate: null };
  }

  let longest = 1;
  let run = 1;
  for (let i = 1; i < active.length; i++) {
    run = diffDays(active[i - 1], active[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const last = active[active.length - 1];
  const gap = diffDays(last, today);
  const activeToday = gap === 0;

  let current = 0;
  if (gap <= 1) {
    current = 1;
    let cursor = last;
    for (let i = active.length - 2; i >= 0; i--) {
      if (active[i] === addDays(cursor, -1)) {
        current++;
        cursor = active[i];
      } else break;
    }
  }

  return {
    current,
    longest,
    activeToday,
    atRisk: gap === 1,
    lost: gap > 1,
    lastActiveDate: last,
  };
}

export type DailyGoalInfo = {
  goalMinutes: number;
  minutesToday: number;
  met: boolean;
  /** 0..1 */
  progress: number;
};

export function dailyGoalInfo(goalMinutes: number, minutesToday: number): DailyGoalInfo {
  const goal = Math.max(1, goalMinutes);
  return {
    goalMinutes: goal,
    minutesToday,
    met: minutesToday >= goal,
    progress: Math.min(1, minutesToday / goal),
  };
}
