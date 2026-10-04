import { createLocalBackend } from '../../src/api/local/localBackend.js';

export function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

/** Backend local com relógio controlável. */
export async function makeBackend({ demoPreview = true, start = '2026-10-04T15:00:00Z' } = {}) {
  const clock = { t: new Date(start) };
  const storage = memoryStorage();
  const backend = createLocalBackend({ storage, demoPreview, now: () => clock.t });
  await backend.ready;
  return { backend, clock, storage };
}

export async function signup(backend, email, name = 'Ana') {
  await backend.auth.register({ email, password: 'senha-segura', full_name: name });
  await backend.entities.Profile.create({ display_name: name, daily_minutes: 5, timezone: 'America/Sao_Paulo', onboarded: true });
}

/** Respostas corretas para todos os exercícios de uma lição (usa acesso de serviço, só em testes). */
export async function correctAnswers(backend, lessonId, { wrong = [] } = {}) {
  const exs = (await backend._db.service().Exercise.filter({ lesson_id: lessonId })).sort((a, b) => a.order - b.order);
  return exs.map((ex, i) => {
    let response = ex.answer;
    if (wrong.includes(i)) {
      if (ex.type === 'verdadeiro_falso') response = !ex.answer;
      else if (ex.type === 'ordenar') response = [...ex.answer].reverse();
      else if (ex.type === 'associar') response = {};
      else response = ex.options.find((o) => o.id !== ex.answer).id;
    }
    return { exercise_id: ex.id, response };
  });
}

export async function orderedLessons(backend) {
  const s = backend._db.service();
  const units = (await s.Unit.list()).sort((a, b) => a.order - b.order);
  const lessons = await s.Lesson.list();
  return units.flatMap((u) => lessons.filter((l) => l.unit_id === u.id).sort((a, b) => a.order - b.order));
}
