// Lógica de backend do Vereda. Cada handler recebe um contexto:
//   ctx.user       usuário autenticado (ou null)
//   ctx.service    entidades com acesso de serviço (API do SDK do Base44: filter/get/create/update/delete)
//   ctx.now        Date atual (injetável para testes)
//   ctx.allowDraft se true, conteúdo em rascunho é tratado como visível (apenas no modo de demonstração local)
//   ctx.deleteAuthUser  opcional: remove a conta de acesso
// As funções em base44/functions/*/entry.ts e o modo local chamam estes mesmos handlers.

import {
  gradeExercise,
  validateExercise,
  computeLessonXp,
  computeReviewXp,
  levelFor,
  dailyGoalXp,
  advanceStreak,
  scheduleAfterWrong,
  scheduleAfterRight,
  newAchievements,
  buildJourney,
  isLessonUnlocked,
  localDate,
  isValidTimeZone,
  CONTENT_STATUS,
  BLOCK_KINDS,
} from './engine.js';
import { SEED_UNITS, SEED_EDITORIAL_NOTE } from './seed/index.js';

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function requireUser(ctx) {
  if (!ctx.user || !ctx.user.email) throw new HttpError(401, 'É preciso entrar na sua conta.');
  return ctx.user;
}

function requireAdmin(ctx) {
  const user = requireUser(ctx);
  if (user.role !== 'admin') throw new HttpError(403, 'Acesso restrito a administradores.');
  return user;
}

const nowOf = (ctx) => (ctx.now ? new Date(ctx.now) : new Date());
const visible = (ctx, rec) => !!rec && (rec.status === 'publicado' || !!ctx.allowDraft);
const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

async function first(entity, query) {
  const rows = await entity.filter(query);
  return rows && rows.length ? rows[0] : null;
}

async function upsert(entity, query, data) {
  const existing = await first(entity, query);
  if (existing) return entity.update(existing.id, data);
  return entity.create({ ...query, ...data });
}

async function visibleContent(ctx) {
  const units = (await ctx.service.Unit.list()).filter((u) => visible(ctx, u));
  const unitIds = new Set(units.map((u) => u.id));
  const lessons = (await ctx.service.Lesson.list()).filter((l) => visible(ctx, l) && unitIds.has(l.unit_id));
  return { units, lessons };
}

async function userTimeZone(ctx, email) {
  const profile = await first(ctx.service.Profile, { created_by: email });
  return { profile, tz: profile && isValidTimeZone(profile.timezone) ? profile.timezone : 'America/Sao_Paulo' };
}

async function loadStats(ctx, email) {
  return (
    (await first(ctx.service.UserStats, { owner_email: email })) || {
      owner_email: email,
      total_xp: 0,
      lessons_completed: 0,
      units_completed: 0,
      reviews_completed: 0,
      streak_current: 0,
      streak_best: 0,
      last_study_date: null,
    }
  );
}

async function saveStats(ctx, stats) {
  const { id, created_date, updated_date, created_by, ...data } = stats;
  data.level = levelFor(data.total_xp).level;
  if (id) return ctx.service.UserStats.update(id, data);
  return ctx.service.UserStats.create(data);
}

async function grantAchievements(ctx, email, stats, event, nowIso) {
  const earned = await ctx.service.UserAchievement.filter({ owner_email: email });
  const keys = newAchievements(stats, earned.map((a) => a.key), event);
  for (const key of keys) await ctx.service.UserAchievement.create({ owner_email: email, key, earned_at: nowIso });
  return keys;
}

/** Registra estudo do dia: XP, contadores, sequência e meta diária. */
async function recordActivity(ctx, { email, profile, today, xp, lessons = 0, reviews = 0, reviewXp = 0, nowIso }) {
  const goal = dailyGoalXp(profile?.daily_minutes);
  const day = await first(ctx.service.DailyActivity, { owner_email: email, local_date: today });
  const before = day ? day.xp || 0 : 0;
  const after = before + xp;
  const goalMetNow = before < goal && after >= goal;
  const data = {
    xp: after,
    lessons_completed: (day?.lessons_completed || 0) + lessons,
    reviews_completed: (day?.reviews_completed || 0) + reviews,
    review_xp: (day?.review_xp || 0) + reviewXp,
    goal_xp: goal,
    goal_met: after >= goal,
    last_activity_at: nowIso,
  };
  if (day) await ctx.service.DailyActivity.update(day.id, data);
  else await ctx.service.DailyActivity.create({ owner_email: email, local_date: today, ...data });
  return { goalXp: goal, dayXp: after, goalMetNow };
}

// ====================================================================== lições

/**
 * Conclui uma lição. O servidor recorrige todas as respostas, calcula XP (sem
 * duplicação), atualiza progresso, sequência, revisões e conquistas.
 */
export async function completeLesson(ctx, input = {}) {
  const user = requireUser(ctx);
  const email = user.email;
  const { lesson_id, answers, client_attempt_id } = input;
  if (!lesson_id || !Array.isArray(answers)) throw new HttpError(400, 'Dados da lição incompletos.');
  if (!client_attempt_id || typeof client_attempt_id !== 'string') throw new HttpError(400, 'Identificador da tentativa ausente.');

  // Idempotência: a mesma tentativa enviada duas vezes devolve o mesmo resultado, sem novo XP.
  const repeated = await first(ctx.service.LessonAttempt, { owner_email: email, client_attempt_id });
  if (repeated) return { ...repeated.result, duplicate: true };

  const lesson = await ctx.service.Lesson.get(lesson_id).catch(() => null);
  if (!visible(ctx, lesson)) throw new HttpError(404, 'Lição não encontrada.');

  const { units, lessons } = await visibleContent(ctx);
  const progressRows = await ctx.service.LessonProgress.filter({ owner_email: email });
  const completedIds = progressRows.filter((p) => p.completed).map((p) => p.lesson_id);
  if (!isLessonUnlocked(buildJourney(units, lessons, completedIds), lesson_id))
    throw new HttpError(409, 'Esta lição ainda está bloqueada. Conclua a etapa anterior primeiro.');

  const exercises = (await ctx.service.Exercise.filter({ lesson_id })).filter((e) => visible(ctx, e)).sort(byOrder);
  if (!exercises.length) throw new HttpError(409, 'Esta lição ainda não tem exercícios publicados.');
  const byId = new Map(answers.map((a) => [a && a.exercise_id, a && a.response]));
  if (exercises.some((ex) => !byId.has(ex.id))) throw new HttpError(400, 'Responda a todos os exercícios antes de concluir.');

  const results = exercises.map((ex) => ({ exercise_id: ex.id, response: byId.get(ex.id), correct: gradeExercise(ex, byId.get(ex.id)) }));
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;

  // Momento da conclusão: agora, ou (para progresso de visitante) um instante recente informado.
  const now = nowOf(ctx);
  let completedAt = now;
  if (input.completed_at) {
    const t = new Date(input.completed_at);
    if (!Number.isNaN(t.getTime()) && t <= now && now - t < 14 * 86400000) completedAt = t;
  }
  const nowIso = completedAt.toISOString();
  const { profile, tz } = await userTimeZone(ctx, email);
  const today = localDate(completedAt, tz);

  const progress = progressRows.find((p) => p.lesson_id === lesson_id) || null;
  const firstCompletion = !progress || !progress.completed;
  const xpCalc = computeLessonXp({
    firstCompletion,
    correct,
    total,
    repeatAwardedToday: !!progress && progress.last_repeat_xp_date === today,
    repeatAwardsTotal: progress?.repeat_xp_awards || 0,
  });

  // Progresso da lição (histórico preservado: cada tentativa é um registro separado).
  const attemptNumber = (progress?.attempts_count || 0) + 1;
  const progressData = {
    owner_email: email,
    lesson_id,
    unit_id: lesson.unit_id,
    completed: true,
    attempts_count: attemptNumber,
    best_score: Math.max(progress?.best_score || 0, total ? correct / total : 0),
    last_score: total ? correct / total : 0,
    first_completed_at: progress?.first_completed_at || nowIso,
    last_completed_at: nowIso,
    xp_earned_total: (progress?.xp_earned_total || 0) + xpCalc.xp,
    repeat_xp_awards: (progress?.repeat_xp_awards || 0) + (xpCalc.reason === 'repeticao' ? 1 : 0),
    last_repeat_xp_date: xpCalc.reason === 'repeticao' ? today : progress?.last_repeat_xp_date || null,
  };
  if (progress) await ctx.service.LessonProgress.update(progress.id, progressData);
  else await ctx.service.LessonProgress.create(progressData);

  if (xpCalc.xp > 0)
    await ctx.service.XPEvent.create({ owner_email: email, amount: xpCalc.xp, reason: xpCalc.reason, source_type: 'licao', source_id: lesson_id, local_date: today, created_at: nowIso });

  // Revisões: cada erro agenda (ou antecipa) a revisão da questão.
  for (const r of results.filter((x) => !x.correct)) {
    const item = await first(ctx.service.ReviewItem, { owner_email: email, exercise_id: r.exercise_id });
    const data = { ...scheduleAfterWrong(item, today), lesson_id, unit_id: lesson.unit_id };
    if (item) await ctx.service.ReviewItem.update(item.id, data);
    else await ctx.service.ReviewItem.create({ owner_email: email, exercise_id: r.exercise_id, ...data });
  }

  const activity = await recordActivity(ctx, { email, profile, today, xp: xpCalc.xp, lessons: 1, nowIso });

  // Estatísticas, sequência e unidades.
  const stats = await loadStats(ctx, email);
  const allCompleted = new Set([...completedIds, lesson_id]);
  const journey = buildJourney(units, lessons, [...allCompleted]);
  const unit = journey.find((u) => u.unit.id === lesson.unit_id);
  const unitJustCompleted = !!unit && unit.completed && firstCompletion;
  Object.assign(stats, advanceStreak(stats, today), {
    total_xp: (stats.total_xp || 0) + xpCalc.xp,
    lessons_completed: (stats.lessons_completed || 0) + (firstCompletion ? 1 : 0),
    units_completed: journey.filter((u) => u.completed).length,
  });
  const saved = await saveStats(ctx, stats);
  const achievements = await grantAchievements(ctx, email, saved, { perfectLesson: total > 0 && correct === total, dailyGoalMet: activity.goalMetNow }, nowIso);

  const result = {
    lesson_id,
    correct,
    total,
    results: results.map(({ exercise_id, correct: c }) => ({ exercise_id, correct: c })),
    xp_awarded: xpCalc.xp,
    xp_reason: xpCalc.reason,
    first_completion: firstCompletion,
    attempt_number: attemptNumber,
    unit_completed: unitJustCompleted,
    daily: { goal_xp: activity.goalXp, xp_today: activity.dayXp, goal_met_now: activity.goalMetNow },
    stats: publicStats(saved),
    new_achievements: achievements,
    local_date: today,
  };
  await ctx.service.LessonAttempt.create({
    owner_email: email,
    client_attempt_id,
    lesson_id,
    unit_id: lesson.unit_id,
    attempt_number: attemptNumber,
    started_at: typeof input.started_at === 'string' ? input.started_at : null,
    completed_at: nowIso,
    local_date: today,
    answers: results,
    correct,
    total,
    xp_awarded: xpCalc.xp,
    result,
  });
  return result;
}

function publicStats(s) {
  return {
    total_xp: s.total_xp || 0,
    level: levelFor(s.total_xp || 0).level,
    lessons_completed: s.lessons_completed || 0,
    units_completed: s.units_completed || 0,
    reviews_completed: s.reviews_completed || 0,
    streak_current: s.streak_current || 0,
    streak_best: s.streak_best || 0,
    last_study_date: s.last_study_date || null,
  };
}

// ====================================================================== revisão

export async function submitReview(ctx, input = {}) {
  const user = requireUser(ctx);
  const email = user.email;
  const { client_session_id, answers } = input;
  if (!client_session_id || !Array.isArray(answers) || !answers.length) throw new HttpError(400, 'Nenhuma resposta enviada.');

  const repeated = await first(ctx.service.ReviewSession, { owner_email: email, client_session_id });
  if (repeated) return { ...repeated.result, duplicate: true };

  const now = nowOf(ctx);
  const nowIso = now.toISOString();
  const { profile, tz } = await userTimeZone(ctx, email);
  const today = localDate(now, tz);

  const results = [];
  for (const a of answers.slice(0, 50)) {
    const item = await ctx.service.ReviewItem.get(a?.review_item_id).catch(() => null);
    if (!item || item.owner_email !== email) throw new HttpError(404, 'Item de revisão não encontrado.');
    const ex = await ctx.service.Exercise.get(item.exercise_id).catch(() => null);
    if (!visible(ctx, ex)) continue; // conteúdo retirado de publicação: ignora sem penalizar
    const correct = gradeExercise(ex, a.response);
    const data = correct ? scheduleAfterRight(item, today) : scheduleAfterWrong(item, today);
    await ctx.service.ReviewItem.update(item.id, data);
    results.push({ review_item_id: item.id, exercise_id: ex.id, correct, next_due: data.due_date, status: data.status });
  }
  if (!results.length) throw new HttpError(409, 'Nenhuma das questões está disponível no momento.');

  const correctCount = results.filter((r) => r.correct).length;
  const dayBefore = await first(ctx.service.DailyActivity, { owner_email: email, local_date: today });
  const xp = computeReviewXp({ correct: correctCount, reviewXpToday: dayBefore?.review_xp || 0 });
  if (xp > 0)
    await ctx.service.XPEvent.create({ owner_email: email, amount: xp, reason: 'revisao', source_type: 'revisao', source_id: client_session_id, local_date: today, created_at: nowIso });
  const activity = await recordActivity(ctx, { email, profile, today, xp, reviews: 1, reviewXp: xp, nowIso });

  const stats = await loadStats(ctx, email);
  Object.assign(stats, advanceStreak(stats, today), {
    total_xp: (stats.total_xp || 0) + xp,
    reviews_completed: (stats.reviews_completed || 0) + 1,
  });
  const saved = await saveStats(ctx, stats);
  const achievements = await grantAchievements(ctx, email, saved, { dailyGoalMet: activity.goalMetNow }, nowIso);

  const result = {
    results,
    correct: correctCount,
    total: results.length,
    xp_awarded: xp,
    daily: { goal_xp: activity.goalXp, xp_today: activity.dayXp, goal_met_now: activity.goalMetNow },
    stats: publicStats(saved),
    new_achievements: achievements,
  };
  await ctx.service.ReviewSession.create({ owner_email: email, client_session_id, local_date: today, result });
  return result;
}

// ====================================================================== conteúdo

/**
 * Conteúdo visível para estudantes (somente publicado em produção).
 * - sem parâmetros: unidades e lições (sem exercícios)
 * - { lesson_id }: a lição e seus exercícios
 * - { exercise_ids }: exercícios específicos (usado na revisão)
 */
export async function getContent(ctx, input = {}) {
  const { units, lessons } = await visibleContent(ctx);
  if (input.lesson_id) {
    const lesson = lessons.find((l) => l.id === input.lesson_id);
    if (!lesson) throw new HttpError(404, 'Lição não encontrada ou ainda não publicada.');
    const exercises = (await ctx.service.Exercise.filter({ lesson_id: lesson.id })).filter((e) => visible(ctx, e)).sort(byOrder);
    return { unit: units.find((u) => u.id === lesson.unit_id), lesson, exercises };
  }
  if (Array.isArray(input.exercise_ids)) {
    const lessonIds = new Set(lessons.map((l) => l.id));
    const out = [];
    for (const id of input.exercise_ids.slice(0, 100)) {
      const ex = await ctx.service.Exercise.get(id).catch(() => null);
      if (visible(ctx, ex) && lessonIds.has(ex.lesson_id)) out.push(ex);
    }
    return { exercises: out };
  }
  return { units: units.sort(byOrder), lessons: lessons.sort(byOrder) };
}

// ====================================================================== visitante

/** Primeira lição da trilha, disponível sem conta para experimentar. */
export async function getTrialLesson(ctx) {
  const { units, lessons } = await visibleContent(ctx);
  const unit = [...units].sort(byOrder).find((u) => lessons.some((l) => l.unit_id === u.id));
  if (!unit) throw new HttpError(404, 'Ainda não há lições publicadas.');
  const lesson = lessons.filter((l) => l.unit_id === unit.id).sort(byOrder)[0];
  const exercises = (await ctx.service.Exercise.filter({ lesson_id: lesson.id })).filter((e) => visible(ctx, e)).sort(byOrder);
  return { unit, lesson, exercises };
}

/** Ao criar a conta, registra a lição feita como visitante (respostas recorrigidas no servidor). */
export async function claimGuestProgress(ctx, input = {}) {
  requireUser(ctx);
  const trial = input.trial;
  if (!trial || !trial.lesson_id) throw new HttpError(400, 'Nenhum progresso de visitante para salvar.');
  const { lesson } = await getTrialLesson(ctx);
  if (lesson.id !== trial.lesson_id) throw new HttpError(409, 'O progresso de visitante só vale para a primeira lição.');
  return completeLesson(ctx, {
    lesson_id: trial.lesson_id,
    answers: trial.answers,
    client_attempt_id: trial.client_attempt_id,
    started_at: trial.started_at,
    completed_at: trial.completed_at,
  });
}

// ====================================================================== conta

export async function deleteAccount(ctx, input = {}) {
  const user = requireUser(ctx);
  if (input.confirm !== 'EXCLUIR') throw new HttpError(400, 'Confirmação inválida.');
  const email = user.email;
  const owned = ['UserStats', 'LessonProgress', 'LessonAttempt', 'XPEvent', 'DailyActivity', 'ReviewItem', 'ReviewSession', 'UserAchievement'];
  const created = ['Profile', 'Note', 'Favorite'];
  let removed = 0;
  for (const name of owned) for (const r of await ctx.service[name].filter({ owner_email: email })) (await ctx.service[name].delete(r.id), removed++);
  for (const name of created) for (const r of await ctx.service[name].filter({ created_by: email })) (await ctx.service[name].delete(r.id), removed++);
  let accountRemoved = false;
  if (ctx.deleteAuthUser) {
    try {
      accountRemoved = !!(await ctx.deleteAuthUser(user));
    } catch {
      accountRemoved = false;
    }
  }
  return { removed_records: removed, account_removed: accountRemoved };
}

// ====================================================================== administração

const UNIT_FIELDS = ['title', 'description', 'icon'];
const LESSON_FIELDS = ['title', 'kind', 'duration_min', 'objective', 'references', 'context', 'blocks', 'summary', 'reflection_prompt', 'sources', 'editorial_notes'];
const EXERCISE_FIELDS = ['type', 'prompt', 'options', 'items', 'left', 'right', 'answer', 'explanation', 'reference'];
const ENTITY_OF = { Unit: 'Unit', Lesson: 'Lesson', Exercise: 'Exercise' };

const pickFields = (data, fields) => Object.fromEntries(fields.filter((f) => data && data[f] !== undefined).map((f) => [f, data[f]]));

export function validateLesson(lesson, exercises) {
  const problems = [];
  if (!lesson.title?.trim()) problems.push('Título obrigatório.');
  if (!lesson.objective?.trim()) problems.push('Objetivo de aprendizado obrigatório.');
  if (!Array.isArray(lesson.references) || !lesson.references.filter(Boolean).length) problems.push('Inclua ao menos uma referência bíblica.');
  if (!lesson.context?.trim()) problems.push('Explicação de contexto obrigatória.');
  if (!Array.isArray(lesson.blocks) || !lesson.blocks.length) problems.push('Inclua ao menos um bloco de conteúdo.');
  (lesson.blocks || []).forEach((b, i) => {
    if (!BLOCK_KINDS[b.kind]) problems.push(`Bloco ${i + 1}: tipo inválido.`);
    if (!b.body?.trim()) problems.push(`Bloco ${i + 1}: texto obrigatório.`);
    if (b.kind === 'interpretacao' && !b.tradition?.trim()) problems.push(`Bloco ${i + 1}: identifique a tradição da interpretação.`);
  });
  if (!Array.isArray(lesson.summary) || !lesson.summary.filter(Boolean).length) problems.push('Resumo do aprendizado obrigatório.');
  if (exercises.length < 4 || exercises.length > 6) problems.push(`A lição deve ter de 4 a 6 exercícios (tem ${exercises.length}).`);
  exercises.forEach((ex, i) => validateExercise(ex).forEach((p) => problems.push(`Exercício ${i + 1}: ${p}`)));
  return problems;
}

async function resetToDraft(ctx, entity, rec) {
  if (rec && rec.status !== 'rascunho') await ctx.service[entity].update(rec.id, { status: 'rascunho', reviewed_by: null, reviewed_at: null, published_at: null });
}

export async function adminContent(ctx, input = {}) {
  const admin = requireAdmin(ctx);
  const s = ctx.service;
  const nowIso = nowOf(ctx).toISOString();
  const { action } = input;

  switch (action) {
    case 'list': {
      const [units, lessons, exercises] = await Promise.all([s.Unit.list(), s.Lesson.list(), s.Exercise.list()]);
      return { units: units.sort(byOrder), lessons: lessons.sort(byOrder), exercises: exercises.sort(byOrder) };
    }

    case 'seed': {
      if ((await s.Unit.list()).length) throw new HttpError(409, 'O conteúdo inicial já foi importado.');
      return seedContent(ctx, admin.email);
    }

    case 'save_unit': {
      const data = pickFields(input.data, UNIT_FIELDS);
      if (input.id) {
        const rec = await s.Unit.get(input.id);
        await resetToDraft(ctx, 'Unit', rec);
        return s.Unit.update(input.id, { ...data, updated_by: admin.email });
      }
      if (!data.title?.trim()) throw new HttpError(400, 'Título obrigatório.');
      const count = (await s.Unit.list()).length;
      return s.Unit.create({ ...data, order: count, status: 'rascunho', updated_by: admin.email });
    }

    case 'delete_unit': {
      const lessons = await s.Lesson.filter({ unit_id: input.id });
      if (lessons.length) throw new HttpError(409, 'Remova ou mova as lições desta unidade antes de excluí-la.');
      await s.Unit.delete(input.id);
      return { ok: true };
    }

    case 'save_lesson': {
      const data = pickFields(input.data, LESSON_FIELDS);
      if (input.id) {
        const rec = await s.Lesson.get(input.id);
        await resetToDraft(ctx, 'Lesson', rec);
        for (const ex of await s.Exercise.filter({ lesson_id: input.id })) await resetToDraft(ctx, 'Exercise', ex);
        return s.Lesson.update(input.id, { ...data, updated_by: admin.email });
      }
      if (!input.unit_id) throw new HttpError(400, 'Escolha a unidade.');
      await s.Unit.get(input.unit_id);
      if (!data.title?.trim()) throw new HttpError(400, 'Título obrigatório.');
      const count = (await s.Lesson.filter({ unit_id: input.unit_id })).length;
      return s.Lesson.create({ kind: 'licao', duration_min: 5, references: [], blocks: [], summary: [], sources: [], ...data, unit_id: input.unit_id, order: count, status: 'rascunho', updated_by: admin.email });
    }

    case 'delete_lesson': {
      const rec = await s.Lesson.get(input.id);
      if (rec.status === 'publicado') throw new HttpError(409, 'Retire a lição de publicação antes de excluí-la.');
      for (const ex of await s.Exercise.filter({ lesson_id: input.id })) await s.Exercise.delete(ex.id);
      await s.Lesson.delete(input.id);
      return { ok: true };
    }

    case 'save_exercise': {
      const data = pickFields(input.data, EXERCISE_FIELDS);
      const problems = validateExercise(data);
      if (problems.length) throw new HttpError(400, 'O exercício tem problemas.', problems);
      if (input.id) {
        const rec = await s.Exercise.get(input.id);
        await resetToDraft(ctx, 'Lesson', await s.Lesson.get(rec.lesson_id));
        const clean = Object.fromEntries(EXERCISE_FIELDS.map((f) => [f, data[f] ?? null]));
        return s.Exercise.update(input.id, { ...clean, status: 'rascunho', updated_by: admin.email });
      }
      const lesson = await s.Lesson.get(input.lesson_id);
      await resetToDraft(ctx, 'Lesson', lesson);
      const count = (await s.Exercise.filter({ lesson_id: lesson.id })).length;
      return s.Exercise.create({ ...data, lesson_id: lesson.id, order: count, status: 'rascunho', updated_by: admin.email });
    }

    case 'delete_exercise': {
      const rec = await s.Exercise.get(input.id);
      await resetToDraft(ctx, 'Lesson', await s.Lesson.get(rec.lesson_id));
      await s.Exercise.delete(input.id);
      return { ok: true };
    }

    case 'reorder': {
      const entity = ENTITY_OF[input.entity];
      if (!entity || !Array.isArray(input.ids)) throw new HttpError(400, 'Reordenação inválida.');
      for (let i = 0; i < input.ids.length; i++) await s[entity].update(input.ids[i], { order: i });
      return { ok: true };
    }

    case 'set_status':
      return setStatus(ctx, admin, input, nowIso);

    default:
      throw new HttpError(400, 'Ação administrativa desconhecida.');
  }
}

async function setStatus(ctx, admin, { entity, id, status }, nowIso) {
  const s = ctx.service;
  if (!['Unit', 'Lesson'].includes(entity)) throw new HttpError(400, 'Só unidades e lições têm status editorial.');
  if (!CONTENT_STATUS.includes(status)) throw new HttpError(400, 'Status inválido.');
  const rec = await s[entity].get(id);
  const from = rec.status || 'rascunho';
  const allowed = {
    rascunho: ['revisado'],
    revisado: ['publicado', 'rascunho'],
    publicado: ['rascunho'],
  };
  if (from === status) return rec;
  if (!allowed[from].includes(status)) {
    const msg = status === 'publicado' ? 'Só é possível publicar conteúdo que já foi revisado.' : `Não é possível passar de "${from}" para "${status}".`;
    throw new HttpError(409, msg);
  }

  let exercises = [];
  if (entity === 'Lesson') {
    exercises = (await s.Exercise.filter({ lesson_id: id })).sort(byOrder);
    if (status === 'revisado') {
      const problems = validateLesson(rec, exercises);
      if (problems.length) throw new HttpError(400, 'A lição ainda não está pronta para revisão.', problems);
    }
  }

  const patch = { status };
  if (status === 'revisado') Object.assign(patch, { reviewed_by: admin.email, reviewed_at: nowIso });
  if (status === 'publicado') Object.assign(patch, { published_by: admin.email, published_at: nowIso });
  if (status === 'rascunho') Object.assign(patch, { reviewed_by: null, reviewed_at: null, published_at: null });
  const updated = await s[entity].update(id, patch);
  // Os exercícios acompanham o status editorial da lição.
  for (const ex of exercises) await s.Exercise.update(ex.id, { status });
  return updated;
}

/** Importa o conteúdo inicial como rascunho. */
export async function seedContent(ctx, by = 'sistema') {
  const s = ctx.service;
  let lessonsCount = 0;
  let exercisesCount = 0;
  for (let u = 0; u < SEED_UNITS.length; u++) {
    const su = SEED_UNITS[u];
    const unit = await s.Unit.create({ seed_key: su.key, title: su.title, description: su.description, icon: su.icon, order: u, status: 'rascunho', editorial_notes: SEED_EDITORIAL_NOTE, updated_by: by });
    for (let l = 0; l < su.lessons.length; l++) {
      const { exercises, key, ...ld } = su.lessons[l];
      const lesson = await s.Lesson.create({ ...ld, seed_key: key, unit_id: unit.id, order: l, status: 'rascunho', editorial_notes: SEED_EDITORIAL_NOTE, updated_by: by });
      lessonsCount++;
      await s.Exercise.bulkCreate(exercises.map((ex, i) => ({ ...ex, lesson_id: lesson.id, order: i, status: 'rascunho', updated_by: by })));
      exercisesCount += exercises.length;
    }
  }
  return { units: SEED_UNITS.length, lessons: lessonsCount, exercises: exercisesCount };
}
