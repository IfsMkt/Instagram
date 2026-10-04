import { test, expect } from '@playwright/test';
import { answer, playLesson, expectNoHorizontalScroll } from './helpers.js';

const PASSWORD = 'senha-segura-123';

async function signupFromScratch(page, email, name) {
  await page.goto('/bem-vindo');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByLabel('Como você gostaria de ser chamado?').fill(name);
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: 'Estou começando' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: 'Criar uma rotina de estudo' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: /^10 minutos/ }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Pular esta pergunta' }).click();
}

test('fluxo completo: onboarding, lição como visitante, cadastro, revisão, caderno e persistência', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/bem-vindo/);
  await expect(page.getByText('Aprenda a Bíblia, um passo por dia.')).toBeVisible();
  await expectNoHorizontalScroll(page);

  await signupFromScratch(page, 'ana@example.com', 'Ana');
  await expect(page.getByRole('heading', { name: 'Tudo pronto, Ana!' })).toBeVisible();
  await page.getByRole('link', { name: 'Experimentar a primeira lição' }).click();

  // Lição como visitante: erra a primeira questão e acerta o resto.
  await expect(page.getByRole('heading', { name: 'O que é a Bíblia?', exact: true })).toBeVisible();
  await expect(page.getByText('Resumo com nossas palavras — não é citação literal').first()).toBeHidden();
  await expectNoHorizontalScroll(page);
  const count = await playLesson(page, { wrong: [0], reflection: 'Quero entender melhor o Antigo Testamento.' });
  expect(count).toBe(5);
  await expect(page.getByText('+14 XP')).toBeVisible();

  // Cadastro preserva o progresso.
  await page.getByRole('link', { name: 'Criar conta e salvar progresso' }).click();
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  await expect(page.getByRole('heading', { name: 'Ana' })).toBeVisible();
  await expect(page.getByText('Seu progresso da primeira lição foi salvo')).toBeVisible();
  await expect(page.getByRole('img', { name: /Meta diária: 14 de 20 XP/ })).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Jornada: primeira lição concluída, segunda disponível, terceira bloqueada; unidades futuras "Em breve".
  await page.getByRole('navigation').getByRole('link', { name: 'Jornada' }).click();
  await expect(page.getByRole('link', { name: /Lição 1: O que é a Bíblia\? — Concluída/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Lição 2: Como encontrar uma passagem — Disponível/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Lição 3: O Antigo Testamento — Bloqueada/ })).toBeVisible();
  await expect(page.getByText('Em breve')).toHaveCount(8);
  await expectNoHorizontalScroll(page);

  // Repetir a lição não duplica XP completo (só +2 por repetição diária).
  await page.getByRole('link', { name: /Lição 1: O que é a Bíblia\?/ }).click();
  await playLesson(page);
  await expect(page.getByText('+2 XP')).toBeVisible();
  await page.getByRole('button', { name: 'Repetir lição' }).click();
  await playLesson(page);
  await expect(page.getByText('+0 XP')).toBeVisible();
  await expect(page.getByText('Você já recebeu XP por repetir esta lição hoje')).toBeVisible();
  await page.getByRole('button', { name: 'Continuar a jornada' }).click();

  // Revisão da questão errada.
  await page.getByRole('navigation').getByRole('link', { name: 'Revisão' }).click();
  await expect(page.getByRole('heading', { name: 'Vamos lembrar?' })).toBeVisible();
  await expect(page.getByText('1 questão para hoje')).toBeVisible();
  await page.getByRole('button', { name: 'Começar revisão' }).click();
  // na revisão o botão final é "Concluir revisão"
  const before = page.url();
  await answerReview(page);
  await expect(page.getByText('+1 XP')).toBeVisible();
  await expect(page.getByText(/próxima revisão em/)).toBeVisible();
  expect(page.url()).toBe(before);

  // Caderno: a reflexão do visitante foi salva; criar, editar, buscar e excluir anotação.
  await page.getByRole('navigation').getByRole('link', { name: 'Caderno' }).click();
  await page.getByRole('tab', { name: 'Reflexões' }).click();
  await expect(page.getByText('Quero entender melhor o Antigo Testamento.')).toBeVisible();
  await page.getByRole('tab', { name: 'Anotações' }).click();
  await expect(page.getByText('Seu caderno está em branco')).toBeVisible();
  await page.getByRole('button', { name: 'Novo' }).click();
  await page.getByLabel('Título (opcional)').fill('Dúvida sobre Gênesis');
  await page.getByLabel('Referência bíblica (opcional)').fill('Gênesis 1:1');
  await page.getByLabel('Texto').fill('Por que existem dois relatos da criação?');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Por que existem dois relatos da criação?')).toBeVisible();
  await page.getByRole('button', { name: 'Editar Dúvida sobre Gênesis' }).click();
  await page.getByLabel('Texto').fill('Gênesis 1 e 2 têm estilos diferentes.');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Gênesis 1 e 2 têm estilos diferentes.')).toBeVisible();
  await page.getByPlaceholder('Buscar por palavra ou referência').fill('genesis 1:1');
  await expect(page.getByText('Gênesis 1 e 2 têm estilos diferentes.')).toBeVisible();
  await page.getByPlaceholder('Buscar por palavra ou referência').fill('inexistente');
  await expect(page.getByText('Nada encontrado')).toBeVisible();
  await page.getByPlaceholder('Buscar por palavra ou referência').fill('');
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await page.getByRole('button', { name: 'Novo' }).click();
  await page.getByLabel('Referência bíblica').fill('Salmo 23');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Salmo 23')).toBeVisible();
  await page.getByRole('tab', { name: 'Anotações' }).click();
  await page.getByRole('button', { name: 'Excluir Dúvida sobre Gênesis' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Excluir' }).click();
  await expect(page.getByText('Seu caderno está em branco')).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Persistência após recarregar a página.
  await page.reload();
  await page.getByRole('navigation').getByRole('link', { name: 'Perfil' }).click();
  await expect(page.getByText('17 XP', { exact: true })).toBeVisible();
  await expect(page.getByText('Conquistada em').first()).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Área administrativa bloqueada para usuário comum.
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Área restrita' })).toBeVisible();

  // Sair e entrar de novo mantém o progresso.
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page).toHaveURL(/bem-vindo/);
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('ana@example.com');
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).last().click();
  await expect(page.getByRole('heading', { name: 'Ana' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Perfil' }).click();
  await expect(page.getByText('17 XP', { exact: true })).toBeVisible();

  // Outra conta não vê os dados de Ana.
  await page.getByRole('button', { name: 'Sair' }).click();
  await page.goto('/entrar?modo=cadastro');
  await page.getByLabel('E-mail').fill('bia@example.com');
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Criar conta' }).last().click();
  // sem onboarding como visitante, Bia passa pelas perguntas
  await page.getByLabel('Como você gostaria de ser chamado?').fill('Bia');
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: 'Já estudo' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('radio', { name: 'Aprofundar conhecimentos' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Começar minha jornada' }).click();
  await expect(page.getByRole('heading', { name: 'Bia' })).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Caderno' }).click();
  await page.getByRole('tab', { name: 'Reflexões' }).click();
  await expect(page.getByText('Nenhuma reflexão ainda')).toBeVisible();
  await page.getByRole('tab', { name: 'Favoritos' }).click();
  await expect(page.getByText('Nenhum favorito ainda')).toBeVisible();
  await page.getByRole('navigation').getByRole('link', { name: 'Perfil' }).click();
  await expect(page.getByText('0 XP', { exact: true })).toBeVisible();
});

async function answerReview(page) {
  await answer(page, { correct: true, next: 'Concluir revisão' });
}

test('administração: conteúdo, revisão editorial, prévia e teclado', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill('admin@vereda.local');
  await page.getByLabel('Senha').fill('vereda-admin');
  await page.getByRole('button', { name: 'Entrar' }).last().click();
  // admin sem perfil faz o onboarding rapidamente
  await page.getByLabel('Como você gostaria de ser chamado?').fill('Editora');
  for (const pick of ['Já estudo', 'Aprofundar conhecimentos']) {
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('radio', { name: pick }).click();
  }
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'Começar minha jornada' }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Perfil' }).click();
  await page.getByRole('link', { name: 'Administração' }).click();

  await expect(page.getByRole('heading', { name: 'Administração de conteúdo' })).toBeVisible();
  await expect(page.getByText('13 em rascunho · 0 revisadas · 0 publicadas')).toBeVisible();
  await expectNoHorizontalScroll(page);

  // Publicar direto não é possível: primeiro revisar.
  const firstLesson = page.locator('.admin-item').first();
  await expect(firstLesson.getByRole('button', { name: 'Publicar' })).toHaveCount(0);
  await firstLesson.getByRole('button', { name: 'Marcar como revisada' }).click();
  await page.getByRole('button', { name: 'Confirmo a revisão' }).click();
  await expect(firstLesson.getByText('Revisado')).toBeVisible();
  await expect(firstLesson.getByText('revisada por admin@vereda.local')).toBeVisible();
  await firstLesson.getByRole('button', { name: 'Publicar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
  await expect(firstLesson.getByText('Publicado')).toBeVisible();

  // Prévia da lição.
  await firstLesson.getByRole('link', { name: 'Prévia' }).click();
  await expect(page.getByText(/Prévia administrativa/)).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.goto('/admin');

  // Editar exercício publicado devolve a lição para rascunho.
  await page.locator('.admin-item').first().getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByText(/Esta lição está publicado/)).toBeVisible();
  await page.getByRole('button', { name: 'Editar' }).first().click();
  await page.getByLabel('Explicação (por que a resposta está certa)').fill('Explicação revisada pela equipe editorial.');
  await page.getByRole('button', { name: /Salvar exercício/ }).click();
  await expect(page.getByText('Rascunho').first()).toBeVisible();

  // Exercício inválido é bloqueado antes de salvar.
  await page.getByRole('button', { name: 'Novo' }).click();
  await page.getByLabel('Enunciado').fill('Pergunta sem explicação');
  await expect(page.getByText('A explicação é obrigatória.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Salvar exercício/ })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Navegação por teclado: o link "pular para o conteúdo" e a barra inferior.
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
});
