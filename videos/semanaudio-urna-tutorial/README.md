# Tutorial da Urna · SemanÁudio 2026

Edição (Remotion + FFmpeg) **sobre a gravação original** da urna. Vertical 1080×1920, 30 fps, MP4.

## Status

| Entrega | Status |
|---|---|
| 1. Análise do vídeo original | Pronta: [`analysis/ANALISE.md`](analysis/ANALISE.md) (etapas, transcrição, pranchas `analysis/contact-*.jpg`) |
| 2. Roteiro com tempos exatos dos cortes | Pronto: em `analysis/ANALISE.md` e aplicado em `src/edit.ts` |
| 3. Projeto Remotion editável | Pronto |
| 4. Prévia | `out/previa-urna-tutorial.mp4` (540×960, 59,8 s) |
| 5. MP4 final | Depois da aprovação, **a partir do arquivo original** (ver Fluxo B). A prévia atual usa a versão comprimida só para conferência. |

Passos (só os que aparecem na gravação): 01 toque para começar · 02 digite seu e-mail · 03 vote nas 5 categorias · 04 meus cupons do sorteio · 05 imprima seu cupom · 06 retire o cupom impresso · 07 próxima pessoa.

## Fluxo

```bash
npm install

# A) ANÁLISE (pode usar a versão comprimida; nada daqui vai para o vídeo final)
bash scripts/analyze.sh source/tutorial_urna_semanAudio_leve.mov

# B) RENDER FINAL: sempre a partir do ARQUIVO ORIGINAL em alta qualidade
bash scripts/prep-source.sh source/<arquivo-original>.mov
npm run render          # 1080x1920 (formato pedido)
npm run render:nativo   # opcional: resolução nativa do original, se for maior (ex.: 4K -> 2160x3840)
```

### Garantias de qualidade do render final

- **Fonte = arquivo original.** `prep-source.sh` recusa arquivos com lado menor < 1080 px, e `npm run render` só roda quando `src/source-meta.ts` marca `isOriginal: true`. A versão comprimida não chega ao render final.
- **Sem ampliação artificial.** O intermediário (`public/source/urna.mp4`) mantém a resolução nativa do original, sem redimensionar; só corrige rotação e, se for HDR (HLG/PQ do iPhone), converte para SDR BT.709. Codificação H.264 CRF 10, `preset slow`.
- **Zoom limitado pela resolução real:** até `largura_original/1080` sem ampliar pixels (ex.: 4K → 2×). Em fonte 1080×1920 o limite é 1,3× (`ZOOM_FLOOR` em `src/components/Footage.tsx`). O vídeo é posicionado já no tamanho ampliado, e o navegador amostra direto do quadro nativo.
- **Mesmos cortes.** `scripts/align.py` mede por correlação de áudio a diferença de tempo entre o original e a versão leve (onde os cortes foram medidos) e grava em `offset`. Todos os tempos de `src/edit.ts` são ajustados automaticamente.
- **Exportação:** quadros PNG (sem perda) → H.264 CRF 12, `preset slow`, yuv420p, BT.709; áudio AAC 320 kbps. Voz limpa extraída do áudio do original (WAV 24 bits).

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

A duração da Cena 3 (e do vídeo) é a soma dos trechos. A meta é 40 a 60 s no total; as cenas fixas somam 30 s (4 + 8 + 10 + 8), então cabem **10 a 30 s** de demonstração.

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
| `scripts/prep-source.sh` | prepara o arquivo original para o render final (resolução nativa, HDR→SDR, alinhamento) |
| `scripts/align.py` | mede o deslocamento entre original e versão leve |
| `scripts/render-final.mjs` | render final protegido (só com o original) |
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
- [ ] O cupom impresso é retirado no próprio totem no evento? (Na gravação, a impressora está numa bancada de teste. O vídeo só diz "Retire seu cupom impresso".)
- [ ] A gravação mostra votar nas 5 categorias antes de ver os cupons. O vídeo **não** afirma que votar dá cupom.
- [ ] Tela usa a palavra "pontos" em "Cupons já impressos". O briefing fala em "moedas". Confirmar o termo oficial.
