// Avaliador das regras RLS do Base44 usado pelo modo local. Ele lê as mesmas
// regras declaradas em base44/entities/*.jsonc, de modo que os testes locais
// exercitam exatamente as permissões que serão aplicadas no Base44.
// Suporta: true/false, created_by, data.<campo> (igualdade, $in, $nin, $ne, $all),
// user_condition (igualdade) e os operadores lógicos $or, $and, $nor.

function resolveTemplate(value, user) {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{user\.(.+)\}\}$/);
  if (!m) return value;
  if (!user) return undefined;
  return m[1].split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), user);
}

function matchField(actual, expected, user) {
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    return Object.entries(expected).every(([op, v]) => {
      const val = Array.isArray(v) ? v.map((x) => resolveTemplate(x, user)) : resolveTemplate(v, user);
      switch (op) {
        case '$in': return val.includes(actual);
        case '$nin': return !val.includes(actual);
        case '$ne': return actual !== val;
        case '$all': return Array.isArray(actual) && val.every((x) => actual.includes(x));
        default: throw new Error(`Operador RLS não suportado: ${op}`);
      }
    });
  }
  const want = resolveTemplate(expected, user);
  return want !== undefined && actual === want;
}

export function evaluateRule(rule, record, user) {
  if (rule === true) return true;
  if (rule === false || rule == null) return false;
  return Object.entries(rule).every(([key, cond]) => {
    if (key === '$or') return cond.some((r) => evaluateRule(r, record, user));
    if (key === '$and') return cond.every((r) => evaluateRule(r, record, user));
    if (key === '$nor') return !cond.some((r) => evaluateRule(r, record, user));
    if (key === 'user_condition') {
      if (!user) return false;
      return Object.entries(cond).every(([k, v]) => user[k] === resolveTemplate(v, user));
    }
    if (key === 'created_by') return matchField(record.created_by, cond, user);
    if (key.startsWith('data.')) return matchField(record[key.slice(5)], cond, user);
    if (['id', 'created_date', 'updated_date'].includes(key)) return matchField(record[key], cond, user);
    throw new Error(`Chave RLS não suportada: ${key}`);
  });
}

/** Remove comentários de linha inteira de um arquivo .jsonc e faz o parse. */
export function parseJsonc(text) {
  return JSON.parse(text.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n'));
}
