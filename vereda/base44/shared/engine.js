// Regras puras do Vereda: correção de exercícios, XP, níveis, sequência,
// revisões espaçadas e conquistas. Sem dependências — este arquivo é usado
// tanto pelo frontend (modo local) quanto pelas funções de backend do Base44.

export const CONTENT_STATUS = ['rascunho', 'revisado', 'publicado'];

export const EXERCISE_TYPES = {
  multipla_escolha: 'Múltipla escolha',
  verdadeiro_falso: 'Verdadeiro ou falso',
  ordenar: 'Ordenação de acontecimentos',
  associar: 'Associação',
  completar: 'Completar a frase',
};

export const BLOCK_KINDS = {
  biblia_resumo: 'Resumo do texto bíblico',
  contexto: 'Contexto histórico',
  conceito: 'Explicação',
  interpretacao: 'Interpretação religiosa',
  glossario: 'Palavra difícil',
};

// ---------------------------------------------------------------- datas

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimeZone(tz) {
  if (!tz || typeof tz !== 'string') return false;
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Data local (YYYY-MM-DD) de um instante no fuso informado. */
export function localDate(instant, timeZone) {
  const tz = isValidTimeZone(timeZone) ? timeZone : 'America/Sao_Paulo';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(dateStr, days) {
  if (!DATE_RE.test(dateStr)) throw new Error(`Data inválida: ${dateStr}`);
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

// ---------------------------------------------------------------- exercícios

function sameArray(a, b) {
  return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]);
}

/** Corrige uma resposta. Retorna true/false. Respostas malformadas contam como incorretas. */
export function gradeExercise(exercise, response) {
  const { type, answer } = exercise;
  switch (type) {
    case 'multipla_escolha':
    case 'completar':
      return typeof response === 'string' && response === answer;
    case 'verdadeiro_falso':
      return typeof response === 'boolean' && response === answer;
    case 'ordenar':
      return sameArray(response, answer);
    case 'associar': {
      if (!response || typeof response !== 'object' || Array.isArray(response)) return false;
      const keys = Object.keys(answer);
      return keys.length === Object.keys(response).length && keys.every((k) => response[k] === answer[k]);
    }
    default:
      return false;
  }
}

/** Valida a coerência de um exercício. Retorna lista de problemas (vazia = ok). */
export function validateExercise(ex) {
  const problems = [];
  if (!EXERCISE_TYPES[ex.type]) problems.push('Tipo de exercício inválido.');
  if (!ex.prompt || !String(ex.prompt).trim()) problems.push('O enunciado é obrigatório.');
  if (!ex.explanation || !String(ex.explanation).trim()) problems.push('A explicação é obrigatória.');
  if (!ex.reference || !String(ex.reference).trim()) problems.push('A referência bíblica é obrigatória.');
  const ids = (list) => (Array.isArray(list) ? list.map((o) => o && o.id) : []);
  const unique = (arr) => new Set(arr).size === arr.length;
  switch (ex.type) {
    case 'multipla_escolha':
    case 'completar': {
      const opts = ids(ex.options);
      if (opts.length < 2) problems.push('Inclua pelo menos duas opções.');
      if (!unique(opts)) problems.push('As opções precisam ter identificadores únicos.');
      if (!opts.includes(ex.answer)) problems.push('A resposta correta precisa ser uma das opções.');
      if (ex.type === 'completar' && !String(ex.prompt || '').includes('___'))
        problems.push('A frase precisa conter "___" no lugar da lacuna.');
      if ((ex.options || []).some((o) => !o.text || !String(o.text).trim())) problems.push('Toda opção precisa de texto.');
      break;
    }
    case 'verdadeiro_falso':
      if (typeof ex.answer !== 'boolean') problems.push('Defina se a afirmação é verdadeira ou falsa.');
      break;
    case 'ordenar': {
      const items = ids(ex.items);
      if (items.length < 3) problems.push('Inclua pelo menos três itens para ordenar.');
      if (!unique(items)) problems.push('Os itens precisam ter identificadores únicos.');
      if (!Array.isArray(ex.answer) || ex.answer.length !== items.length || !items.every((i) => ex.answer.includes(i)))
        problems.push('A ordem correta precisa conter todos os itens uma única vez.');
      else if (sameArray(items, ex.answer)) problems.push('Apresente os itens embaralhados (diferentes da ordem correta).');
      break;
    }
    case 'associar': {
      const left = ids(ex.left);
      const right = ids(ex.right);
      if (left.length < 2) problems.push('Inclua pelo menos dois pares.');
      if (!unique(left) || !unique(right)) problems.push('Os itens precisam ter identificadores únicos.');
      const ans = ex.answer && typeof ex.answer === 'object' ? ex.answer : {};
      if (!left.every((l) => right.includes(ans[l]))) problems.push('Cada item da esquerda precisa de um par válido.');
      const used = left.map((l) => ans[l]);
      if (!unique(used)) problems.push('Cada item da direita deve ser usado uma única vez.');
      break;
    }
    default:
      break;
  }
  return problems;
}

// ---------------------------------------------------------------- XP e níveis

export const XP_RULES = {
  firstCompletionBase: 10,
  perCorrect: 1,
  perfectBonus: 4,
  repeatXp: 2,
  maxRepeatAwardsPerLesson: 5,
  reviewPerCorrect: 1,
  reviewDailyCap: 15,
};

/**
 * XP de uma conclusão de lição.
 * - Primeira conclusão: base + 1 por acerto + bônus por lição perfeita.
 * - Repetição: pequeno XP, no máximo uma vez por dia por lição e com teto total.
 */
export function computeLessonXp({ firstCompletion, correct, total, repeatAwardedToday, repeatAwardsTotal }) {
  if (firstCompletion) {
    const perfect = total > 0 && correct === total;
    return {
      xp: XP_RULES.firstCompletionBase + correct * XP_RULES.perCorrect + (perfect ? XP_RULES.perfectBonus : 0),
      reason: 'primeira_conclusao',
    };
  }
  if (repeatAwardedToday) return { xp: 0, reason: 'repeticao_ja_pontuada_hoje' };
  if (repeatAwardsTotal >= XP_RULES.maxRepeatAwardsPerLesson) return { xp: 0, reason: 'limite_de_repeticoes' };
  return { xp: XP_RULES.repeatXp, reason: 'repeticao' };
}

export function computeReviewXp({ correct, reviewXpToday }) {
  const room = Math.max(0, XP_RULES.reviewDailyCap - reviewXpToday);
  return Math.min(room, correct * XP_RULES.reviewPerCorrect);
}

export const LEVELS = [
  { level: 1, min: 0, name: 'Primeiros passos' },
  { level: 2, min: 40, name: 'Caminhante' },
  { level: 3, min: 100, name: 'Explorador' },
  { level: 4, min: 180, name: 'Leitor atento' },
  { level: 5, min: 280, name: 'Estudante dedicado' },
  { level: 6, min: 400, name: 'Conhecedor das trilhas' },
  { level: 7, min: 550, name: 'Guia de estudos' },
  { level: 8, min: 750, name: 'Pesquisador' },
];

export function levelFor(totalXp = 0) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (totalXp >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const span = next ? next.min - cur.min : 1;
  return {
    level: cur.level,
    name: cur.name,
    xpIntoLevel: totalXp - cur.min,
    xpForNext: next ? next.min - totalXp : 0,
    progress: next ? Math.min(1, (totalXp - cur.min) / span) : 1,
    isMax: !next,
  };
}

export function dailyGoalXp(dailyMinutes) {
  return { 5: 10, 10: 20, 15: 30 }[Number(dailyMinutes)] || 10;
}

// ---------------------------------------------------------------- sequência

/** Atualiza a sequência ao registrar estudo na data `today` (data local). */
export function advanceStreak(stats, today) {
  const last = stats.last_study_date || null;
  let current = stats.streak_current || 0;
  if (last === today) {
    // nada muda
  } else if (last && addDays(last, 1) === today) {
    current += 1;
  } else {
    current = 1;
  }
  return {
    streak_current: current,
    streak_best: Math.max(stats.streak_best || 0, current),
    last_study_date: last && last > today ? last : today,
  };
}

/** Sequência como deve ser exibida hoje (zera se o último estudo foi antes de ontem). */
export function displayStreak(stats, today) {
  const last = stats && stats.last_study_date;
  if (!last) return { days: 0, studiedToday: false, lost: false };
  if (last === today) return { days: stats.streak_current || 0, studiedToday: true, lost: false };
  if (addDays(last, 1) === today) return { days: stats.streak_current || 0, studiedToday: false, lost: false };
  return { days: 0, studiedToday: false, lost: (stats.streak_current || 0) > 0 };
}

// ---------------------------------------------------------------- revisão espaçada

export const REVIEW_INTERVALS = [1, 3, 7, 14];

/** Estado de revisão após um erro (na lição ou na revisão): volta ao início e fica disponível já. */
export function scheduleAfterWrong(item, today) {
  return {
    interval_index: 0,
    due_date: today,
    status: 'ativo',
    times_wrong: (item?.times_wrong || 0) + 1,
    times_right: item?.times_right || 0,
    last_result: 'errou',
    last_reviewed_date: today,
  };
}

/** Estado após um acerto na revisão: avança para o próximo intervalo (1, 3, 7, 14 dias). */
export function scheduleAfterRight(item, today) {
  const idx = item?.interval_index || 0;
  if (idx >= REVIEW_INTERVALS.length) {
    return {
      interval_index: idx,
      due_date: item?.due_date || today,
      status: 'dominado',
      times_wrong: item?.times_wrong || 0,
      times_right: (item?.times_right || 0) + 1,
      last_result: 'acertou',
      last_reviewed_date: today,
    };
  }
  return {
    interval_index: idx + 1,
    due_date: addDays(today, REVIEW_INTERVALS[idx]),
    status: 'ativo',
    times_wrong: item?.times_wrong || 0,
    times_right: (item?.times_right || 0) + 1,
    last_result: 'acertou',
    last_reviewed_date: today,
  };
}

export function isDue(item, today) {
  return item.status === 'ativo' && item.due_date <= today;
}

// ---------------------------------------------------------------- conquistas

export const ACHIEVEMENTS = [
  { key: 'primeira_licao', title: 'Primeiro passo', description: 'Concluiu a primeira lição.', icon: 'passo' },
  { key: 'licao_perfeita', title: 'Atenção aos detalhes', description: 'Acertou todas as questões de uma lição.', icon: 'estrela' },
  { key: 'cinco_licoes', title: 'Ritmo constante', description: 'Concluiu cinco lições diferentes.', icon: 'livros' },
  { key: 'primeira_unidade', title: 'Unidade concluída', description: 'Concluiu todas as etapas de uma unidade.', icon: 'marco' },
  { key: 'meta_diaria', title: 'Meta do dia', description: 'Alcançou a meta diária pela primeira vez.', icon: 'alvo' },
  { key: 'primeira_revisao', title: 'Memória em dia', description: 'Concluiu a primeira sessão de revisão.', icon: 'folha' },
  { key: 'sequencia_3', title: 'Três dias de estudo', description: 'Estudou em três dias seguidos.', icon: 'chama' },
  { key: 'sequencia_7', title: 'Sete dias de estudo', description: 'Estudou em sete dias seguidos.', icon: 'sol' },
];

/** Conquistas que o usuário passa a merecer, dadas as estatísticas e o que já tem. */
export function newAchievements(stats, earnedKeys, event = {}) {
  const has = new Set(earnedKeys);
  const out = [];
  const add = (k, cond) => cond && !has.has(k) && out.push(k);
  add('primeira_licao', (stats.lessons_completed || 0) >= 1);
  add('licao_perfeita', !!event.perfectLesson);
  add('cinco_licoes', (stats.lessons_completed || 0) >= 5);
  add('primeira_unidade', (stats.units_completed || 0) >= 1);
  add('meta_diaria', !!event.dailyGoalMet);
  add('primeira_revisao', (stats.reviews_completed || 0) >= 1);
  add('sequencia_3', (stats.streak_best || 0) >= 3);
  add('sequencia_7', (stats.streak_best || 0) >= 7);
  return out;
}

// ---------------------------------------------------------------- trilha

/**
 * Monta a trilha: unidades ordenadas, lições ordenadas e o estado de cada lição
 * ('concluida' | 'disponivel' | 'bloqueada'). Uma lição só abre quando a anterior
 * (na ordem global da trilha) foi concluída.
 */
export function buildJourney(units, lessons, completedLessonIds) {
  const done = new Set(completedLessonIds);
  const sortedUnits = [...units].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let previousDone = true;
  return sortedUnits.map((unit) => {
    const ls = lessons.filter((l) => l.unit_id === unit.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const items = ls.map((lesson) => {
      const completed = done.has(lesson.id);
      const state = completed ? 'concluida' : previousDone ? 'disponivel' : 'bloqueada';
      previousDone = completed;
      return { lesson, state };
    });
    const completedCount = items.filter((i) => i.state === 'concluida').length;
    return {
      unit,
      lessons: items,
      comingSoon: items.length === 0,
      completed: items.length > 0 && completedCount === items.length,
      completedCount,
      total: items.length,
    };
  });
}

export function isLessonUnlocked(journey, lessonId) {
  for (const u of journey) for (const i of u.lessons) if (i.lesson.id === lessonId) return i.state !== 'bloqueada';
  return false;
}
