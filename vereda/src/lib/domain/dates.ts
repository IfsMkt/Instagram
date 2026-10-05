/**
 * Datas locais. Instantes são armazenados em UTC; "dias" (meta, sequência,
 * revisão) são calculados no fuso IANA da pessoa e representados como
 * strings ISO "AAAA-MM-DD".
 */

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || tz.length === 0 || tz.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(tz: unknown): string {
  return isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}

/** Dia local (AAAA-MM-DD) de um instante no fuso informado. */
export function localDate(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Hora local (0–23), usada para a saudação. */
export function localHour(instant: Date, timeZone: string): number {
  const value = new Intl.DateTimeFormat("en-US", {
    timeZone: safeTimeZone(timeZone),
    hour: "numeric",
    hourCycle: "h23",
  }).format(instant);
  return Number.parseInt(value, 10) % 24;
}

function toUtcMidnight(day: string): number {
  const [y, m, d] = day.split("-").map((n) => Number.parseInt(n, 10));
  return Date.UTC(y, m - 1, d);
}

function fromUtcMidnight(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Soma dias a uma data local (sem fuso: aritmética de calendário). */
export function addDays(day: string, days: number): string {
  return fromUtcMidnight(toUtcMidnight(day) + days * 86_400_000);
}

/** Diferença em dias de calendário: b - a. */
export function diffDays(a: string, b: string): number {
  return Math.round((toUtcMidnight(b) - toUtcMidnight(a)) / 86_400_000);
}

export function isIsoDay(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Dia da semana (0 = domingo) de uma data local. */
export function weekday(day: string): number {
  return new Date(toUtcMidnight(day)).getUTCDay();
}
