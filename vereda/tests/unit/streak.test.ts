import { describe, expect, it } from "vitest";
import { addDays, diffDays, localDate } from "@/lib/domain/dates";
import { computeStreak, dailyGoalInfo } from "@/lib/domain/streak";

const d = (date: string, minutes = 5) => ({ date, minutes });

describe("datas locais por fuso IANA", () => {
  it("o mesmo instante cai em dias diferentes conforme o fuso", () => {
    // 02:30 UTC de 5/out = 23:30 de 4/out em São Paulo (UTC-3) e 11:30 de 5/out em Tóquio.
    const instant = new Date("2026-10-05T02:30:00Z");
    expect(localDate(instant, "America/Sao_Paulo")).toBe("2026-10-04");
    expect(localDate(instant, "Asia/Tokyo")).toBe("2026-10-05");
    expect(localDate(instant, "UTC")).toBe("2026-10-05");
  });

  it("fuso inválido cai no padrão sem quebrar", () => {
    expect(localDate(new Date("2026-10-05T12:00:00Z"), "Lua/Crateras")).toBe("2026-10-05");
  });

  it("aritmética de calendário atravessa meses e anos", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(diffDays("2026-10-01", "2026-10-15")).toBe(14);
  });
});

describe("sequência de estudo", () => {
  it("conta dias consecutivos terminando hoje", () => {
    const s = computeStreak([d("2026-10-03"), d("2026-10-04"), d("2026-10-05")], "2026-10-05");
    expect(s.current).toBe(3);
    expect(s.activeToday).toBe(true);
    expect(s.atRisk).toBe(false);
  });

  it("ontem ainda mantém a sequência viva (em risco)", () => {
    const s = computeStreak([d("2026-10-03"), d("2026-10-04")], "2026-10-05");
    expect(s.current).toBe(2);
    expect(s.atRisk).toBe(true);
    expect(s.lost).toBe(false);
  });

  it("um dia inteiro sem estudo interrompe a sequência", () => {
    const s = computeStreak([d("2026-10-01"), d("2026-10-02")], "2026-10-05");
    expect(s.current).toBe(0);
    expect(s.lost).toBe(true);
    expect(s.longest).toBe(2);
  });

  it("dias com poucos minutos não contam", () => {
    const s = computeStreak([d("2026-10-04", 2), d("2026-10-05", 5)], "2026-10-05");
    expect(s.current).toBe(1);
  });

  it("a mesma atividade gera sequências diferentes em fusos diferentes", () => {
    // Estudos às 23:30 de São Paulo em dois dias seguidos = 02:30 UTC.
    const instants = ["2026-10-04T02:30:00Z", "2026-10-05T02:30:00Z"].map((i) => new Date(i));
    const now = new Date("2026-10-05T12:00:00Z");
    const sp = instants.map((i) => d(localDate(i, "America/Sao_Paulo")));
    expect(computeStreak(sp, localDate(now, "America/Sao_Paulo"))).toMatchObject({ current: 2, activeToday: false, atRisk: true });
    const tokyo = instants.map((i) => d(localDate(i, "Asia/Tokyo")));
    expect(computeStreak(tokyo, localDate(now, "Asia/Tokyo"))).toMatchObject({ current: 2, activeToday: true });
  });

  it("sem atividade: tudo zerado e sem mensagem de perda", () => {
    expect(computeStreak([], "2026-10-05")).toMatchObject({ current: 0, longest: 0, lost: false });
  });

  it("ignora dias no futuro (relógio adiantado)", () => {
    expect(computeStreak([d("2026-10-06")], "2026-10-05").current).toBe(0);
  });
});

describe("meta diária", () => {
  it("calcula progresso e conclusão", () => {
    expect(dailyGoalInfo(10, 5)).toMatchObject({ met: false, progress: 0.5 });
    expect(dailyGoalInfo(10, 12)).toMatchObject({ met: true, progress: 1 });
  });
});
