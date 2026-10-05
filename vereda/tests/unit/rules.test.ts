import { describe, expect, it } from "vitest";
import { levelForXp, RULES, xpForFirstCompletion, minutesFor } from "@/lib/domain/rules";
import { gradeAnswer, validateExercise } from "@/lib/domain/exercises";
import { newlyEarned, type AchievementStats } from "@/lib/domain/achievements";

describe("regras centrais", () => {
  it("XP de primeira conclusão por tipo", () => {
    expect(xpForFirstCompletion("lesson")).toBe(RULES.lessonFirstCompletionXp);
    expect(xpForFirstCompletion("unit_review")).toBe(RULES.unitReviewFirstCompletionXp);
  });
  it("níveis", () => {
    expect(levelForXp(0)).toMatchObject({ level: 1, progress: 0 });
    expect(levelForXp(60).level).toBe(2);
    expect(levelForXp(100_000)).toMatchObject({ level: 10, nextLevelXp: null, progress: 1 });
  });
  it("minutos estimados", () => {
    expect(minutesFor(2, 3)).toBe(13);
  });
});

describe("correção de exercícios", () => {
  const mc = { options: [{ id: "o1", text: "A" }, { id: "o2", text: "B" }] };
  it("múltipla escolha", () => {
    expect(gradeAnswer("multiple_choice", mc, { optionId: "o2" }, { optionId: "o2" })).toMatchObject({ valid: true, correct: true });
    expect(gradeAnswer("multiple_choice", mc, { optionId: "o2" }, { optionId: "o1" })).toMatchObject({ valid: true, correct: false });
    expect(gradeAnswer("multiple_choice", mc, { optionId: "o2" }, { optionId: "zz" })).toMatchObject({ valid: false });
  });
  it("verdadeiro ou falso", () => {
    expect(gradeAnswer("true_false", {}, { value: false }, { value: false })).toMatchObject({ correct: true });
    expect(gradeAnswer("true_false", {}, { value: false }, { value: "não" })).toMatchObject({ valid: false });
  });
  it("associação exige todos os pares, sem repetir", () => {
    const data = { left: [{ id: "l1", text: "x" }, { id: "l2", text: "y" }], right: [{ id: "r1", text: "1" }, { id: "r2", text: "2" }] };
    const sol = { pairs: { l1: "r2", l2: "r1" } };
    expect(gradeAnswer("matching", data, sol, { pairs: { l2: "r1", l1: "r2" } })).toMatchObject({ correct: true });
    expect(gradeAnswer("matching", data, sol, { pairs: { l1: "r1", l2: "r2" } })).toMatchObject({ correct: false });
    expect(gradeAnswer("matching", data, sol, { pairs: { l1: "r1", l2: "r1" } })).toMatchObject({ valid: false });
    expect(gradeAnswer("matching", data, sol, { pairs: { l1: "r1" } })).toMatchObject({ valid: false });
  });
  it("ordenação", () => {
    const data = { items: [{ id: "i1", text: "a" }, { id: "i2", text: "b" }, { id: "i3", text: "c" }] };
    const sol = { order: ["i2", "i3", "i1"] };
    expect(gradeAnswer("ordering", data, sol, { order: ["i2", "i3", "i1"] })).toMatchObject({ correct: true });
    expect(gradeAnswer("ordering", data, sol, { order: ["i1", "i2", "i3"] })).toMatchObject({ correct: false });
    expect(gradeAnswer("ordering", data, sol, { order: ["i1", "i1", "i3"] })).toMatchObject({ valid: false });
  });
  it("validação de exercício detecta gabarito inconsistente", () => {
    expect(validateExercise("multiple_choice", mc, { optionId: "o1" })).toBeNull();
    expect(validateExercise("multiple_choice", mc, { optionId: "o9" })).not.toBeNull();
  });
});

describe("conquistas", () => {
  const base: AchievementStats = {
    lessonsCompleted: 0, unitsCompleted: 0, tracksCompleted: 0, tracksStarted: 0,
    currentStreak: 0, reviewCorrect: 0, notesCount: 0, dailyGoalMetDays: 0,
  };
  it("não repete conquistas já registradas", () => {
    const stats = { ...base, lessonsCompleted: 5 };
    expect(newlyEarned(stats, new Set()).map((a) => a.id)).toEqual(["primeiro-passo", "cinco-licoes"]);
    expect(newlyEarned(stats, new Set(["primeiro-passo"])).map((a) => a.id)).toEqual(["cinco-licoes"]);
  });
});
