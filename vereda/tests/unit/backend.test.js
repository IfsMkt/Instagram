import { describe, it, expect } from 'vitest';
import { makeBackend, signup, correctAnswers, orderedLessons } from './helpers.js';

const complete = (backend, lesson_id, answers, id) => backend.fn('complete-lesson', { lesson_id, answers, client_attempt_id: id });

describe('conclusão de lições', () => {
  it('corrige no servidor, concede XP uma vez e preserva o histórico ao repetir', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const [l1] = await orderedLessons(backend);

    const r1 = await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'a1');
    expect(r1).toMatchObject({ correct: 5, total: 5, xp_awarded: 19, first_completion: true });
    expect(r1.new_achievements).toEqual(expect.arrayContaining(['primeira_licao', 'licao_perfeita', 'meta_diaria']));

    // Reenvio da mesma tentativa (duplo clique, rede instável): nada muda.
    const dup = await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'a1');
    expect(dup.duplicate).toBe(true);

    // Repetições: 2 XP no máximo uma vez por dia.
    const r2 = await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'a2');
    const r3 = await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'a3');
    expect([r2.xp_awarded, r3.xp_awarded]).toEqual([2, 0]);

    const stats = (await backend.entities.UserStats.list())[0];
    expect(stats.total_xp).toBe(21);
    expect(stats.lessons_completed).toBe(1);
    const attempts = await backend.entities.LessonAttempt.filter({ lesson_id: l1.id });
    expect(attempts).toHaveLength(3);
    const xpEvents = await backend.entities.XPEvent.list();
    expect(xpEvents.reduce((s, e) => s + e.amount, 0)).toBe(21);
  });

  it('limita o XP de repetição ao longo de vários dias', async () => {
    const { backend, clock } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const [l1] = await orderedLessons(backend);
    const answers = await correctAnswers(backend, l1.id);
    await complete(backend, l1.id, answers, 'first');
    let repeatXp = 0;
    for (let d = 1; d <= 8; d++) {
      clock.t = new Date(clock.t.getTime() + 86400000);
      repeatXp += (await complete(backend, l1.id, answers, `rep${d}`)).xp_awarded;
    }
    expect(repeatXp).toBe(10); // 5 repetições pontuadas × 2 XP
  });

  it('bloqueia lições fora de ordem e libera a próxima após concluir', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const [l1, l2] = await orderedLessons(backend);
    await expect(complete(backend, l2.id, await correctAnswers(backend, l2.id), 'x')).rejects.toMatchObject({ status: 409 });
    await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'y');
    await expect(complete(backend, l2.id, await correctAnswers(backend, l2.id), 'z')).resolves.toMatchObject({ first_completion: true });
  });

  it('exige resposta para todos os exercícios', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const [l1] = await orderedLessons(backend);
    const answers = (await correctAnswers(backend, l1.id)).slice(1);
    await expect(complete(backend, l1.id, answers, 'p')).rejects.toMatchObject({ status: 400 });
  });

  it('marca a unidade como concluída ao terminar todas as etapas', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const lessons = await orderedLessons(backend);
    const u1 = lessons.filter((l) => l.unit_id === lessons[0].unit_id);
    let last;
    for (const l of u1) last = await complete(backend, l.id, await correctAnswers(backend, l.id), `u-${l.id}`);
    expect(last.unit_completed).toBe(true);
    expect(last.stats.units_completed).toBe(1);
    expect(last.new_achievements).toContain('primeira_unidade');
  });
});

describe('sequência e fuso horário', () => {
  it('conta dias pela data local do usuário', async () => {
    const { backend, clock } = await makeBackend({ start: '2026-10-04T23:00:00Z' }); // 20h em São Paulo
    await signup(backend, 'ana@example.com');
    const [l1, l2, l3] = await orderedLessons(backend);
    await complete(backend, l1.id, await correctAnswers(backend, l1.id), 'a');
    clock.t = new Date('2026-10-05T02:00:00Z'); // ainda 4/10 em São Paulo
    const r2 = await complete(backend, l2.id, await correctAnswers(backend, l2.id), 'b');
    expect(r2.stats.streak_current).toBe(1);
    clock.t = new Date('2026-10-05T13:00:00Z'); // 5/10
    const r3 = await complete(backend, l3.id, await correctAnswers(backend, l3.id), 'c');
    expect(r3.stats.streak_current).toBe(2);
  });
});

describe('revisão', () => {
  it('agenda questões erradas e reprograma após acerto ou novo erro', async () => {
    const { backend, clock } = await makeBackend();
    await signup(backend, 'ana@example.com');
    const [l1] = await orderedLessons(backend);
    const answers = await correctAnswers(backend, l1.id, { wrong: [0, 3] });
    const r = await complete(backend, l1.id, answers, 'w');
    expect(r.correct).toBe(3);
    const items = await backend.entities.ReviewItem.list();
    expect(items).toHaveLength(2);
    expect(items.every((i) => i.due_date === '2026-10-04')).toBe(true);

    const exs = await backend._db.service().Exercise.filter({ lesson_id: l1.id });
    const answerFor = (item, right) => {
      const ex = exs.find((e) => e.id === item.exercise_id);
      return right ? ex.answer : ex.type === 'verdadeiro_falso' ? !ex.answer : '__errado__';
    };
    const rev = await backend.fn('submit-review', {
      client_session_id: 's1',
      answers: [
        { review_item_id: items[0].id, response: answerFor(items[0], true) },
        { review_item_id: items[1].id, response: answerFor(items[1], false) },
      ],
    });
    expect(rev.correct).toBe(1);
    expect(rev.xp_awarded).toBe(1);
    const after = await backend.entities.ReviewItem.list();
    const right = after.find((i) => i.id === items[0].id);
    const wrong = after.find((i) => i.id === items[1].id);
    expect(right).toMatchObject({ interval_index: 1, due_date: '2026-10-05' });
    expect(wrong).toMatchObject({ interval_index: 0, due_date: '2026-10-04', times_wrong: 2 });
    expect(rev.new_achievements).toContain('primeira_revisao');

    // Repetir a mesma sessão não concede XP de novo.
    const again = await backend.fn('submit-review', { client_session_id: 's1', answers: [{ review_item_id: items[0].id, response: null }] });
    expect(again.duplicate).toBe(true);
    clock.t = new Date('2026-10-05T15:00:00Z');
  });
});

describe('visitante', () => {
  it('oferece a primeira lição sem conta e preserva o progresso no cadastro', async () => {
    const { backend } = await makeBackend();
    const trial = await backend.fn('trial-lesson');
    expect(trial.exercises.length).toBeGreaterThanOrEqual(4);
    await expect(backend.fn('complete-lesson', { lesson_id: trial.lesson.id, answers: [], client_attempt_id: 'g' })).rejects.toMatchObject({ status: 401 });

    const answers = trial.exercises.map((e) => ({ exercise_id: e.id, response: e.answer }));
    await signup(backend, 'novo@example.com');
    const claimed = await backend.fn('claim-guest-progress', { trial: { lesson_id: trial.lesson.id, answers, client_attempt_id: 'guest-1', completed_at: new Date().toISOString() } });
    expect(claimed.xp_awarded).toBe(19);
    const progress = await backend.entities.LessonProgress.list();
    expect(progress).toHaveLength(1);
  });
});

describe('privacidade entre contas', () => {
  it('um usuário não lê nem altera dados de outro', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com', 'Ana');
    const note = await backend.entities.Note.create({ kind: 'anotacao', title: 'Minha nota', body: 'texto privado' });
    const [l1] = await orderedLessons(backend);
    await complete(backend, l1.id, await correctAnswers(backend, l1.id, { wrong: [0] }), 'a');
    await backend.auth.logout();

    await signup(backend, 'bia@example.com', 'Bia');
    const e = backend.entities;
    expect(await e.Note.list()).toEqual([]);
    expect(await e.Profile.list()).toHaveLength(1);
    expect(await e.UserStats.list()).toEqual([]);
    expect(await e.LessonAttempt.list()).toEqual([]);
    expect(await e.ReviewItem.list()).toEqual([]);
    await expect(e.Note.get(note.id)).rejects.toMatchObject({ status: 404 });
    await expect(e.Note.update(note.id, { body: 'invadido' })).rejects.toMatchObject({ status: 404 });
    await expect(e.Note.delete(note.id)).rejects.toMatchObject({ status: 404 });
    // Dados de progresso só podem ser escritos pelo backend.
    await expect(e.UserStats.create({ owner_email: 'bia@example.com', total_xp: 9999 })).rejects.toMatchObject({ status: 403 });
    await expect(e.XPEvent.create({ owner_email: 'bia@example.com', amount: 500 })).rejects.toMatchObject({ status: 403 });
    // Mesmo se criar um registro com o e-mail de outra pessoa, ela não o vê como seu.
    await expect(e.LessonProgress.create({ owner_email: 'ana@example.com', lesson_id: 'x' })).rejects.toMatchObject({ status: 403 });
  });
});

describe('administração', () => {
  it('nega ações administrativas e escrita de conteúdo para não administradores', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'ana@example.com');
    await expect(backend.fn('admin-content', { action: 'list' })).rejects.toMatchObject({ status: 403 });
    const [l1] = await orderedLessons(backend);
    await expect(backend.entities.Lesson.update(l1.id, { title: 'hack' })).rejects.toMatchObject({ status: expect.any(Number) });
    await expect(backend.entities.Unit.create({ title: 'x' })).rejects.toMatchObject({ status: 403 });
    await backend.auth.logout();
    await expect(backend.fn('admin-content', { action: 'list' })).rejects.toMatchObject({ status: 401 });
  });

  it('só publica conteúdo revisado e esconde rascunhos dos estudantes', async () => {
    const { backend } = await makeBackend({ demoPreview: false });
    // Sem prévia de demonstração, nada está publicado no início.
    await expect(backend.fn('trial-lesson')).rejects.toMatchObject({ status: 404 });

    await backend.auth.login('admin@vereda.local', 'vereda-admin');
    const { units, lessons } = await backend.fn('admin-content', { action: 'list' });
    const u1 = units[0];
    const l1 = lessons.find((l) => l.unit_id === u1.id && l.order === 0);
    await expect(backend.fn('admin-content', { action: 'set_status', entity: 'Lesson', id: l1.id, status: 'publicado' })).rejects.toMatchObject({ status: 409 });
    const reviewed = await backend.fn('admin-content', { action: 'set_status', entity: 'Lesson', id: l1.id, status: 'revisado' });
    expect(reviewed.reviewed_by).toBe('admin@vereda.local');
    await backend.fn('admin-content', { action: 'set_status', entity: 'Lesson', id: l1.id, status: 'publicado' });
    await backend.fn('admin-content', { action: 'set_status', entity: 'Unit', id: u1.id, status: 'revisado' });
    await backend.fn('admin-content', { action: 'set_status', entity: 'Unit', id: u1.id, status: 'publicado' });
    await backend.auth.logout();

    await signup(backend, 'ana@example.com');
    expect((await backend.entities.Lesson.list()).map((l) => l.id)).toEqual([l1.id]);
    expect(await backend.entities.Exercise.filter({ lesson_id: l1.id })).toHaveLength(5);
    expect((await backend.entities.Unit.list()).map((u) => u.id)).toEqual([u1.id]);

    // Editar conteúdo publicado o devolve para rascunho (e para revisão).
    await backend.auth.logout();
    await backend.auth.login('admin@vereda.local', 'vereda-admin');
    const ex = (await backend.entities.Exercise.filter({ lesson_id: l1.id }))[0];
    await backend.fn('admin-content', { action: 'save_exercise', id: ex.id, data: { ...ex, explanation: 'Nova explicação.' } });
    const l1after = await backend.entities.Lesson.get(l1.id);
    expect(l1after.status).toBe('rascunho');
  });

  it('valida exercícios inconsistentes', async () => {
    const { backend } = await makeBackend();
    await backend.auth.login('admin@vereda.local', 'vereda-admin');
    const { lessons } = await backend.fn('admin-content', { action: 'list' });
    const bad = { type: 'multipla_escolha', prompt: 'P?', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], answer: 'z', explanation: 'x', reference: 'Gn 1:1' };
    await expect(backend.fn('admin-content', { action: 'save_exercise', lesson_id: lessons[0].id, data: bad })).rejects.toMatchObject({ status: 400 });
  });
});

describe('exclusão de conta', () => {
  it('remove todos os dados do usuário e mantém os de outros', async () => {
    const { backend } = await makeBackend();
    await signup(backend, 'bia@example.com', 'Bia');
    await backend.entities.Note.create({ body: 'da Bia' });
    await backend.auth.logout();
    await signup(backend, 'ana@example.com');
    const [l1] = await orderedLessons(backend);
    await complete(backend, l1.id, await correctAnswers(backend, l1.id, { wrong: [1] }), 'a');
    await backend.entities.Note.create({ body: 'nota' });
    await backend.entities.Favorite.create({ reference: 'Salmo 23' });
    const res = await backend.fn('delete-account', { confirm: 'EXCLUIR' });
    expect(res.account_removed).toBe(true);
    const s = backend._db.service();
    for (const name of ['UserStats', 'LessonProgress', 'LessonAttempt', 'XPEvent', 'DailyActivity', 'ReviewItem', 'UserAchievement'])
      expect(await s[name].filter({ owner_email: 'ana@example.com' })).toEqual([]);
    expect(await s.Note.filter({ created_by: 'ana@example.com' })).toEqual([]);
    expect(await s.Note.filter({ created_by: 'bia@example.com' })).toHaveLength(1);
  });
});

describe('conteúdo', () => {
  it('estudantes só recebem conteúdo publicado (fora da prévia de demonstração)', async () => {
    const { backend } = await makeBackend({ demoPreview: false });
    await signup(backend, 'ana@example.com');
    expect(await backend.fn('content')).toEqual({ units: [], lessons: [] });
    const { backend: demo } = await makeBackend({ demoPreview: true });
    const c = await demo.fn('content');
    expect(c.units).toHaveLength(10);
    expect(c.lessons).toHaveLength(13);
    const one = await demo.fn('content', { lesson_id: c.lessons[0].id });
    expect(one.exercises).toHaveLength(5);
  });
});
