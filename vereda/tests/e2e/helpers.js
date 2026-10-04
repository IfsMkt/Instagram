import { expect } from '@playwright/test';
import { SEED_UNITS } from '../../base44/shared/seed/index.js';

const ALL = SEED_UNITS.flatMap((u) => u.lessons.flatMap((l) => l.exercises));

/** Descobre qual exercício está na tela comparando o enunciado com o conteúdo inicial. */
async function currentExercise(page) {
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  const candidates = ALL.filter((ex) => {
    const probe = ex.type === 'completar' ? ex.prompt.split('___')[0].trim() : ex.prompt;
    return probe && text.includes(probe.replace(/\s+/g, ' '));
  });
  candidates.sort((a, b) => b.prompt.length - a.prompt.length);
  if (!candidates.length) throw new Error(`Exercício não identificado: ${text.slice(0, 200)}`);
  return candidates[0];
}

/** Responde o exercício atual (corretamente ou não), clica em Verificar e confere o feedback. */
export async function answer(page, { correct = true, next = 'Continuar' } = {}) {
  await expect(page.getByRole('button', { name: 'Verificar' })).toBeVisible();
  const ex = await currentExercise(page);
  const main = page.locator('main');
  if (ex.type === 'multipla_escolha' || ex.type === 'completar') {
    const opt = correct ? ex.options.find((o) => o.id === ex.answer) : ex.options.find((o) => o.id !== ex.answer);
    await main.getByRole('button', { name: new RegExp(`${opt.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).click();
  } else if (ex.type === 'verdadeiro_falso') {
    const v = correct ? ex.answer : !ex.answer;
    await main.getByRole('button', { name: v ? 'Verdadeiro' : 'Falso' }).click();
  } else if (ex.type === 'ordenar') {
    const byId = Object.fromEntries(ex.items.map((i) => [i.id, i.text]));
    const target = correct ? ex.answer.map((id) => byId[id]) : null;
    if (target) {
      // ordenação por "bolha" usando os botões acessíveis de mover para cima
      for (let pos = 0; pos < target.length; pos++) {
        const items = await main.locator('.order-item .grow').allInnerTexts();
        let idx = items.indexOf(target[pos]);
        while (idx > pos) {
          await main.getByRole('button', { name: `Mover "${target[pos]}" para cima` }).click();
          idx--;
        }
      }
    }
  } else if (ex.type === 'associar') {
    const right = Object.fromEntries(ex.right.map((r) => [r.id, r.text]));
    const lefts = correct ? ex.left : [...ex.left];
    const assigned = correct ? ex.answer : Object.fromEntries(ex.left.map((l, i) => [l.id, ex.answer[ex.left[(i + 1) % ex.left.length].id]]));
    for (const l of lefts) await main.getByLabel(l.text, { exact: true }).selectOption({ label: right[assigned[l.id]] });
  }
  await page.getByRole('button', { name: 'Verificar' }).click();
  await expect(page.getByRole('status').filter({ hasText: correct ? 'Isso mesmo!' : 'Ainda não' })).toBeVisible();
  await expect(page.getByText(`Referência: ${ex.reference}`)).toBeVisible();
  await page.getByRole('button', { name: next }).click();
}

/** Percorre uma lição inteira a partir da tela de apresentação. */
export async function playLesson(page, { wrong = [], reflection } = {}) {
  await page.getByRole('button', { name: 'Começar' }).click();
  // blocos de conteúdo
  while (!(await page.getByRole('button', { name: 'Verificar' }).isVisible())) {
    await page.getByRole('button', { name: 'Continuar' }).click();
  }
  let i = 0;
  while (await page.getByRole('button', { name: 'Verificar' }).isVisible()) {
    await answer(page, { correct: !wrong.includes(i) });
    i++;
  }
  await expect(page.getByRole('heading', { name: 'Resumo do aprendizado' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar' }).click();
  if (reflection) await page.getByRole('textbox').fill(reflection);
  await page.getByRole('button', { name: /concluir/i }).click();
  await expect(page.getByRole('heading', { name: 'Lição concluída!' })).toBeVisible();
  return i;
}

export async function expectNoHorizontalScroll(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}
