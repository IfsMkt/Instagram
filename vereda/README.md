# Vereda

**Aprenda a Bíblia, um passo por dia.** Aplicativo web responsivo (foco em celular) com lições curtas, exercícios com feedback, jornada com progresso, revisão espaçada, caderno privado e área editorial.

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # testes unitários e de backend (Vitest)
npm run test:e2e     # testes ponta a ponta em tela de celular (Playwright)
```

Sem configuração, o app roda em **modo de demonstração local**: contas e dados ficam apenas no navegador, e o conteúdo inicial — que está em **rascunho** — aparece com um aviso de “prévia, aguardando revisão editorial”. Conta administradora de demonstração: `admin@vereda.local` / `vereda-admin` (só existe no modo local; troque com `VITE_LOCAL_ADMIN_PASSWORD`).

## Arquitetura

```
base44/
  config.jsonc                 projeto Base44
  entities/*.jsonc             14 entidades com regras RLS
  functions/<nome>/entry.ts    funções de backend (finas: chamam os handlers)
  shared/engine.js             regras puras: correção, XP, níveis, sequência, revisão 1-3-7-14, conquistas, trilha
  shared/handlers.js           lógica de backend (concluir lição, revisão, visitante, admin, exclusão de conta)
  shared/serve.ts              adaptador HTTP do Base44 (auth via request + service role)
  shared/seed/                 conteúdo inicial (unidades 1 e 2 completas; 3–10 “em breve”)
src/
  api/backend.js               escolhe Base44 (VITE_BASE44_APP_ID) ou backend local
  api/local/                   simulação local: mesmas regras RLS lidas dos .jsonc e mesmos handlers
  pages/                       Início, Jornada, Revisão, Caderno, Perfil, lição, onboarding, admin
```

O mesmo código de backend (`base44/shared/handlers.js`) roda nas funções do Base44 e no modo local, e o modo local aplica exatamente as regras RLS declaradas em `base44/entities/*.jsonc`. Assim, os testes automatizados exercitam as permissões reais.

### Segurança e privacidade
- **Dados privados** (`Profile`, `Note`, `Favorite`): leitura e escrita só pelo dono (`created_by`).
- **Progresso** (`UserStats`, `LessonProgress`, `LessonAttempt`, `XPEvent`, `DailyActivity`, `ReviewItem`, `ReviewSession`, `UserAchievement`): o usuário só lê os próprios registros (`owner_email`); **escrita apenas pelo backend** (service role). XP não pode ser forjado pelo cliente.
- **Conteúdo** (`Unit`, `Lesson`, `Exercise`): leitura do que está `publicado` (ou por admin); escrita apenas pela função `admin-content`, que verifica `role === 'admin'` e o fluxo editorial.
- **Correção no servidor:** `complete-lesson` e `submit-review` recorrigem todas as respostas, verificam desbloqueio da lição e são idempotentes (o mesmo envio não gera XP duas vezes).

### Regras de gamificação
- Primeira conclusão: 10 XP + 1 por acerto + 4 se acertar tudo. Repetição: 2 XP, no máximo 1 vez por dia por lição e 5 vezes no total. Revisão: 1 XP por acerto, até 15 XP/dia.
- Meta diária: 10/20/30 XP para 5/10/15 minutos. Sequência calculada pela data local no fuso do perfil.
- Revisão: erro agenda a questão para hoje; acertos levam a 1, 3, 7 e 14 dias; novo erro volta ao início.
- Sem vidas, sem ranking público. Pontos medem atividades, nunca fé.

## Publicando no Base44

1. Crie o app no Base44 e faça login na CLI: `npx base44 login`.
2. Vincule este diretório ao app e envie entidades e funções (`npx base44 entities push`, `npx base44 functions deploy` — confira os comandos atuais na documentação da CLI).
3. Defina `VITE_BASE44_APP_ID` (veja `.env.example`) e faça o build/deploy do site.
4. Promova sua conta a `admin` no painel do Base44, entre no app, vá em **Perfil → Administração → Importar conteúdo inicial**. Tudo entra como rascunho.
5. Revise cada lição (**Marcar como revisada**), publique as lições e as unidades. Publique também as unidades 3–10 para que apareçam como “Em breve”.

Pontos a validar no primeiro deploy (não foi possível testar contra o Base44 real neste ambiente):
- O campo `answer` de `Exercise` e `response` de `LessonAttempt` usam `anyOf` (texto, booleano, lista ou objeto). Se o Base44 recusar o schema, troque por `string` contendo JSON e ajuste `gradeExercise`.
- `delete-account` tenta remover o usuário com `asServiceRole.entities.User.delete`. Se não for permitido, o app apaga os dados e avisa que a conta de acesso precisa ser removida pelo suporte.
- O cadastro no Base44 exige código de verificação por e-mail; a tela de cadastro já tem essa etapa.

## Conteúdo e revisão editorial
Veja [docs/REVISAO_EDITORIAL.md](docs/REVISAO_EDITORIAL.md).
