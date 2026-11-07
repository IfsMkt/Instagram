# Tutorial da Urna · SemanÁudio 2026

Edição (Remotion + FFmpeg) **sobre a gravação original** da urna. Vertical 1080×1920, 30 fps, MP4.

## Status

| Entrega | Status |
|---|---|
| 1. Análise do vídeo original | **Pendente: o arquivo `copy_780C9D0A-9EAF-44AD-9A4A-1907209853E7.mp4` não chegou a esta sessão** |
| 2. Roteiro com tempos exatos dos cortes | Pendente (depende da análise) |
| 3. Projeto Remotion editável | Pronto (componentes, cenas 1, 2, 4 e 5, trilha e efeitos) |
| 4. Prévia | `out/previa-urna-tutorial.mp4` (540×960, só grafismos; os trechos de vídeo aparecem como espaços reservados) |
| 5. MP4 final | Depois da aprovação: `npm run render` |

Nenhum passo da urna foi inventado. A Cena 3 só ganha passos (PASSO 01, 02…) depois que a gravação for analisada.

## Fluxo

```bash
npm install
# 1) análise: proxy 30 fps, quadros por segundo, pranchas, trocas de plano, silêncios, transcrição
bash scripts/analyze.sh /caminho/copy_780C9D0A-9EAF-44AD-9A4A-1907209853E7.mp4
# 2) voz limpa (redução de ruído + normalização -16 LUFS)
bash scripts/prep-audio.sh
# 3) preencher src/edit.ts (passos, cortes, zoom, destaques, transcrição)
# 4) conferir
npm run studio        # editor no navegador
npm run preview       # prévia leve em out/previa-urna-tutorial.mp4
# 5) final, após aprovação
npm run render        # out/semanaudio-2026-tutorial-urna.mp4
```

A transcrição usa o Whisper (`pip install -U openai-whisper`). Sem ele, o resto da análise roda normalmente.

## Onde editar

Tudo que depende da gravação fica em **`src/edit.ts`**. Tempos em segundos da gravação original; caixas em frações 0–1 do quadro.

```ts
export const SOURCE = 'source/urna.mp4';
export const VOICE = 'audio/voz.wav';
export const OPENING = {in: 12.0, out: 16.5, zoom: {x: .2, y: .3, w: .6, h: .4}};
export const STEPS = [
  {
    title: 'TEXTO CURTO DA AÇÃO REAL',   // definido pela análise
    highlight: ['PALAVRA'],
    segments: [
      {in: 20.4, out: 24.0, zoom: {...}, focus: {...}},   // ação
      {in: 31.2, out: 33.0, result: true},               // resultado
    ],
  },
];
export const SPEECH = [{in: 20.4, out: 23.1, text: 'fala transcrita'}];
```

A duração da Cena 3 (e do vídeo) é a soma dos trechos. A meta é 40 a 60 s no total; as cenas fixas somam 31 s (4 + 8 + 10 + 9), então cabem **9 a 29 s** de demonstração.

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `src/edit.ts` | decisões de edição (preencher após a análise) |
| `src/timeline.ts` | tempos das cenas, calculados a partir de `edit.ts` |
| `src/components/Title.tsx` | títulos animados, faixa laranja, logo oficial |
| `src/components/Caption.tsx` | legendas da fala |
| `src/components/StepBadge.tsx` | indicador PASSO 0N, progresso, selo RESULTADO |
| `src/components/Highlight.tsx` | destaque da área de interação |
| `src/components/Footage.tsx` | trecho da gravação com zoom suave, voz e legenda |
| `src/components/Transition.tsx` | varredura laranja + whoosh entre cenas |
| `src/components/EndCard.tsx` | encerramento com a logo |
| `src/components/Backgrounds.tsx` | fundo grafite, pontilhado, ondas sonoras, luz de palco |
| `src/scenes/*` | as 5 cenas do roteiro |
| `scripts/analyze.sh` | análise da gravação |
| `scripts/prep-audio.sh` | limpeza da voz |
| `scripts/music.py` | trilha instrumental original (100 BPM, discreta) e efeitos |

## Identidade e materiais

- Logo oficial SemanÁudio 2026 e foto do evento: do site oficial (`semanaudio.com.br/salvador2026`), as mesmas do projeto `semanaudio-educa-2026`.
- Laranja `#F58220`, Bebas Neue e Inter.
- Trilha e efeitos sintetizados para este projeto, sem samples de terceiros. A trilha abaixa durante a demonstração para não competir com a voz.
- Encerramento: usa `CLOSING` (imagem real da urna) se definido; senão, a foto oficial do evento.

## Conferir antes de publicar

- [ ] Textos das Cenas 2 e 4 conforme o briefing (1.000 moedas / R$ 1.000 = 1 cupom; Pavilhão Subwoofer; sorteio 12/11 às 17h, Palco Luzbel).
- [ ] Passos da Cena 3 batem com o que aparece na gravação.
