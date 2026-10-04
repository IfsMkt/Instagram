import { describe, it, expect } from 'vitest';
import * as E from '../../base44/shared/engine.js';
import { SEED_UNITS } from '../../base44/shared/seed/index.js';
import { validateLesson } from '../../base44/shared/handlers.js';

describe('datas e fuso horário', () => {
  it('calcula a data local no fuso do usuário', () => {
    // 02:30 UTC de 5/10 ainda é 4/10 em São Paulo (UTC-3)
    expect(E.localDate('2026-10-05T02:30:00Z', 'America/Sao_Paulo')).toBe('2026-10-04');
    expect(E.localDate('2026-10-05T02:30:00Z', 'Europe/Lisbon')).toBe('2026-10-05');
    expect(E.addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('sequência', () => {
  it('avança em dias consecutivos, não duplica no mesmo dia e reinicia após falha', () => {
    let s = { streak_current: 0, streak_best: 0, last_study_date: null };
    s = { ...s, ...E.advanceStreak(s, '2026-10-01') };
    s = { ...s, ...E.advanceStreak(s, '2026-10-01') };
    expect(s.streak_current).toBe(1);
    s = { ...s, ...E.advanceStreak(s, '2026-10-02') };
    expect(s.streak_current).toBe(2);
    s = { ...s, ...E.advanceStreak(s, '2026-10-05') };
    expect(s.streak_current).toBe(1);
    expect(s.streak_best).toBe(2);
  });
  it('exibe sequência perdida de forma acolhedora', () => {
    const st = { streak_current: 4, last_study_date: '2026-10-01' };
    expect(E.displayStreak(st, '2026-10-02')).toMatchObject({ days: 4, studiedToday: false, lost: false });
    expect(E.displayStreak(st, '2026-10-04')).toMatchObject({ days: 0, lost: true });
  });
});

describe('XP', () => {
  it('dá XP completo só na primeira conclusão e limita repetições', () => {
    expect(E.computeLessonXp({ firstCompletion: true, correct: 5, total: 5 }).xp).toBe(19);
    expect(E.computeLessonXp({ firstCompletion: true, correct: 3, total: 5 }).xp).toBe(13);
    expect(E.computeLessonXp({ firstCompletion: false, repeatAwardedToday: false, repeatAwardsTotal: 0 }).xp).toBe(2);
    expect(E.computeLessonXp({ firstCompletion: false, repeatAwardedToday: true, repeatAwardsTotal: 1 }).xp).toBe(0);
    expect(E.computeLessonXp({ firstCompletion: false, repeatAwardedToday: false, repeatAwardsTotal: 5 }).xp).toBe(0);
    expect(E.computeReviewXp({ correct: 10, reviewXpToday: 10 })).toBe(5);
  });
  it('calcula níveis', () => {
    expect(E.levelFor(0).level).toBe(1);
    expect(E.levelFor(40).level).toBe(2);
    expect(E.levelFor(70).progress).toBeCloseTo(0.5);
  });
});

describe('revisão espaçada', () => {
  it('segue 1, 3, 7 e 14 dias e volta ao início após erro', () => {
    let item = E.scheduleAfterWrong(null, '2026-10-01');
    expect(item).toMatchObject({ interval_index: 0, due_date: '2026-10-01' });
    const dues = [];
    let day = '2026-10-01';
    for (let i = 0; i < 4; i++) {
      item = { ...item, ...E.scheduleAfterRight(item, day) };
      dues.push(E.daysBetween(day, item.due_date));
      day = item.due_date;
    }
    expect(dues).toEqual([1, 3, 7, 14]);
    item = { ...item, ...E.scheduleAfterRight(item, day) };
    expect(item.status).toBe('dominado');
    const reset = E.scheduleAfterWrong({ interval_index: 3, times_wrong: 1 }, '2026-11-01');
    expect(reset).toMatchObject({ interval_index: 0, due_date: '2026-11-01', times_wrong: 2 });
  });
});

describe('correção de exercícios', () => {
  it('corrige cada tipo e rejeita respostas malformadas', () => {
    expect(E.gradeExercise({ type: 'multipla_escolha', answer: 'b' }, 'b')).toBe(true);
    expect(E.gradeExercise({ type: 'verdadeiro_falso', answer: false }, 'false')).toBe(false);
    expect(E.gradeExercise({ type: 'ordenar', answer: ['i1', 'i2'] }, ['i1', 'i2'])).toBe(true);
    expect(E.gradeExercise({ type: 'associar', answer: { l1: 'r1', l2: 'r2' } }, { l1: 'r1', l2: 'r2' })).toBe(true);
    expect(E.gradeExercise({ type: 'associar', answer: { l1: 'r1', l2: 'r2' } }, { l1: 'r2', l2: 'r1' })).toBe(false);
    expect(E.gradeExercise({ type: 'associar', answer: { l1: 'r1' } }, null)).toBe(false);
  });
});

describe('conteúdo inicial', () => {
  const units = SEED_UNITS.filter((u) => u.lessons.length);
  it('tem duas unidades completas, com ao menos cinco lições e uma revisão final', () => {
    expect(units).toHaveLength(2);
    for (const u of units) {
      expect(u.lessons.filter((l) => l.kind === 'licao').length).toBeGreaterThanOrEqual(5);
      expect(u.lessons.at(-1).kind).toBe('revisao_unidade');
    }
    expect(SEED_UNITS).toHaveLength(10);
  });
  it('todas as lições passam na validação editorial estrutural', () => {
    for (const u of units)
      for (const l of u.lessons) {
        expect(validateLesson(l, l.exercises), `${l.key}`).toEqual([]);
      }
  });
  it('usa vários tipos de exercício e não contém aspas de citação literal em resumos bíblicos', () => {
    const types = new Set(units.flatMap((u) => u.lessons.flatMap((l) => l.exercises.map((e) => e.type))));
    expect([...types].sort()).toEqual(['associar', 'completar', 'multipla_escolha', 'ordenar', 'verdadeiro_falso']);
    for (const u of units)
      for (const l of u.lessons)
        for (const b of l.blocks.filter((x) => x.kind === 'biblia_resumo')) expect(b.body, `${l.key}: ${b.title}`).not.toMatch(/[“”«»]/);
  });
  it('as respostas corretas são aceitas pelo corretor', () => {
    for (const u of units) for (const l of u.lessons) for (const ex of l.exercises) expect(E.gradeExercise(ex, ex.answer), ex.prompt).toBe(true);
  });
});
