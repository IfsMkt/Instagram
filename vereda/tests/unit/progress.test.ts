import { describe, expect, it } from "vitest";
import { canOpen, computeTrackState, followingItem, nextAction, type TrackUnit, type UserTrackState } from "@/lib/domain/progress";

const units: TrackUnit[] = [
  {
    id: "u1",
    title: "Unidade 1",
    items: [
      { lessonId: "a", unitId: "u1", kind: "lesson", title: "A" },
      { lessonId: "b", unitId: "u1", kind: "lesson", title: "B" },
      { lessonId: "r1", unitId: "u1", kind: "unit_review", title: "Revisão 1" },
    ],
  },
  {
    id: "u2",
    title: "Unidade 2",
    items: [
      { lessonId: "c", unitId: "u2", kind: "lesson", title: "C" },
      { lessonId: "r2", unitId: "u2", kind: "unit_review", title: "Revisão 2" },
    ],
  },
];

function state(partial: Partial<{ completed: string[]; unlocked: string[]; open: Record<string, number> }>): UserTrackState {
  return {
    completed: new Set(partial.completed ?? []),
    unlocked: new Set(partial.unlocked ?? []),
    inProgress: new Map(
      Object.entries(partial.open ?? {}).map(([id, step], i) => [id, { attemptId: `t-${id}`, step, updatedAt: `2026-10-0${i + 1}` }]),
    ),
  };
}

describe("desbloqueio", () => {
  it("pessoa nova: só o primeiro item está liberado", () => {
    const t = computeTrackState(units, state({}));
    expect(t.items.map((i) => i.status)).toEqual(["available", "locked", "locked", "locked", "locked"]);
  });

  it("concluir libera o próximo, inclusive atravessando unidades", () => {
    const t = computeTrackState(units, state({ completed: ["a", "b", "r1"] }));
    expect(t.items.map((i) => i.status)).toEqual(["completed", "completed", "completed", "available", "locked"]);
    expect(t.units[0].done).toBe(true);
  });

  it("um desbloqueio gravado nunca volta a bloquear, mesmo se um item novo for inserido antes", () => {
    const withNew: TrackUnit[] = [
      { ...units[0], items: [units[0].items[0], { lessonId: "novo", unitId: "u1", kind: "lesson", title: "Novo" }, ...units[0].items.slice(1)] },
      units[1],
    ];
    const t = computeTrackState(withNew, state({ completed: ["a"], unlocked: ["b"] }));
    expect(t.items.find((i) => i.lessonId === "b")?.status).toBe("available");
    expect(t.items.find((i) => i.lessonId === "novo")?.status).toBe("available");
  });

  it("não permite abrir item bloqueado", () => {
    const t = computeTrackState(units, state({}));
    expect(canOpen(t, "a")).toBe(true);
    expect(canOpen(t, "c")).toBe(false);
    expect(canOpen(t, "inexistente")).toBe(false);
  });

  it("followingItem retorna o próximo da ordem ou null no fim", () => {
    expect(followingItem(units, "r1")?.lessonId).toBe("c");
    expect(followingItem(units, "r2")).toBeNull();
  });
});

describe("retomada — Continuar minha jornada", () => {
  it("pessoa nova abre a primeira lição", () => {
    const s = state({});
    const a = nextAction(computeTrackState(units, s), s);
    expect(a).toMatchObject({ type: "start", item: { lessonId: "a" } });
  });

  it("retoma a lição interrompida no ponto salvo", () => {
    const s = state({ completed: ["a"], open: { b: 4 } });
    const a = nextAction(computeTrackState(units, s), s);
    expect(a).toMatchObject({ type: "resume", item: { lessonId: "b" }, step: 4 });
  });

  it("refazendo uma lição concluída, a retomada continua nela", () => {
    const s = state({ completed: ["a", "b"], open: { a: 2 } });
    const a = nextAction(computeTrackState(units, s), s);
    expect(a).toMatchObject({ type: "resume", item: { lessonId: "a" }, step: 2 });
  });

  it("sem interrupção, abre a próxima lição liberada e não concluída", () => {
    const s = state({ completed: ["a"] });
    expect(nextAction(computeTrackState(units, s), s)).toMatchObject({ type: "start", item: { lessonId: "b" } });
  });

  it("depois da revisão da unidade, abre a unidade seguinte", () => {
    const s = state({ completed: ["a", "b", "r1"] });
    expect(nextAction(computeTrackState(units, s), s)).toMatchObject({ type: "start", item: { lessonId: "c", unitId: "u2" } });
  });

  it("tudo concluído oferece revisão ou outra jornada", () => {
    const s = state({ completed: ["a", "b", "r1", "c", "r2"] });
    expect(nextAction(computeTrackState(units, s), s)).toEqual({ type: "all_done" });
  });

  it("sem conteúdo publicado, não inventa etapa", () => {
    const s = state({});
    expect(nextAction(computeTrackState([], s), s)).toEqual({ type: "no_content" });
  });

  it("nunca aponta para item bloqueado", () => {
    const s = state({ open: { c: 1 } }); // tentativa aberta em item que ficou bloqueado
    const t = computeTrackState(units, s);
    const a = nextAction(t, s);
    expect(a).toMatchObject({ type: "start", item: { lessonId: "a" } });
  });

  it("lição concluída em outra trilha aparece concluída e não é sugerida", () => {
    const s = state({ completed: ["b"] });
    const t = computeTrackState(units, s);
    expect(t.items[1].status).toBe("completed");
    expect(nextAction(t, s)).toMatchObject({ type: "start", item: { lessonId: "a" } });
  });
});
