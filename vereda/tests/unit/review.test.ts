import { describe, expect, it } from "vitest";
import { nextReviewSchedule, scheduleAfterMistake, scheduleReinforcement, isDue } from "@/lib/domain/review";

const today = "2026-10-05";

describe("revisão espaçada (1, 3, 7, 14 dias)", () => {
  it("erro agenda para o dia seguinte no estágio inicial", () => {
    expect(scheduleAfterMistake(today)).toEqual({ stage: 0, dueOn: "2026-10-06" });
  });

  it("acertos avançam pelos intervalos 3, 7 e 14 e depois dominam", () => {
    expect(nextReviewSchedule(0, true, today)).toEqual({ stage: 1, dueOn: "2026-10-08" });
    expect(nextReviewSchedule(1, true, today)).toEqual({ stage: 2, dueOn: "2026-10-12" });
    expect(nextReviewSchedule(2, true, today)).toEqual({ stage: 3, dueOn: "2026-10-19" });
    expect(nextReviewSchedule(3, true, today)).toEqual({ stage: 4, dueOn: null });
  });

  it("novo erro em qualquer estágio volta ao intervalo inicial", () => {
    for (const stage of [0, 1, 2, 3]) {
      expect(nextReviewSchedule(stage, false, today)).toEqual({ stage: 0, dueOn: "2026-10-06" });
    }
  });

  it("reforço programado começa em 3 dias", () => {
    expect(scheduleReinforcement(today)).toEqual({ stage: 1, dueOn: "2026-10-08" });
  });

  it("isDue compara datas locais", () => {
    expect(isDue("2026-10-05", today)).toBe(true);
    expect(isDue("2026-10-06", today)).toBe(false);
    expect(isDue(null, today)).toBe(false);
  });
});
