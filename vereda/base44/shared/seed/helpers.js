// Atalhos para escrever o conteúdo inicial de forma compacta e consistente.
// Ids de opções são estáveis para que respostas possam ser verificadas.

const LETTERS = 'abcdefgh';

/** Múltipla escolha. `correct` é o índice (0-based) da opção correta em `options`. */
export function mc(prompt, options, correct, explanation, reference) {
  return {
    type: 'multipla_escolha',
    prompt,
    options: options.map((text, i) => ({ id: LETTERS[i], text })),
    answer: LETTERS[correct],
    explanation,
    reference,
  };
}

/** Verdadeiro ou falso. */
export function tf(prompt, answer, explanation, reference) {
  return { type: 'verdadeiro_falso', prompt, answer, explanation, reference };
}

/** Completar frase (o enunciado deve conter "___"). */
export function fill(prompt, options, correct, explanation, reference) {
  return { ...mc(prompt, options, correct, explanation, reference), type: 'completar' };
}

/**
 * Ordenação. `inOrder` traz os itens na ordem correta; `shown` é a ordem de exibição
 * (lista de índices de `inOrder`).
 */
export function order(prompt, inOrder, shown, explanation, reference) {
  const items = inOrder.map((text, i) => ({ id: `i${i + 1}`, text }));
  return {
    type: 'ordenar',
    prompt,
    items: shown.map((i) => items[i]),
    answer: items.map((it) => it.id),
    explanation,
    reference,
  };
}

/**
 * Associação. `pairs` é uma lista [esquerda, direita]; `rightShown` é a ordem de exibição
 * da coluna da direita (lista de índices de `pairs`).
 */
export function match(prompt, pairs, rightShown, explanation, reference) {
  const left = pairs.map(([text], i) => ({ id: `l${i + 1}`, text }));
  const right = pairs.map(([, text], i) => ({ id: `r${i + 1}`, text }));
  const answer = Object.fromEntries(left.map((l, i) => [l.id, right[i].id]));
  return {
    type: 'associar',
    prompt,
    left,
    right: rightShown.map((i) => right[i]),
    answer,
    explanation,
    reference,
  };
}

/** Bloco de conteúdo. `kind`: biblia_resumo | contexto | conceito | interpretacao | glossario. */
export function block(kind, title, body, extra = {}) {
  return { kind, title, body, ...extra };
}
