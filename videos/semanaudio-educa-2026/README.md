# Reels: SemanÁudio 2026 + Educa Áudio

Composição Remotion editável. Vertical 1080×1920, 30 fps, 32 s.

- Prévia exportada: `out/semanaudio-educa-2026-reels.mp4`
- Legendas: `out/semanaudio-educa-2026-reels.srt` (também queimadas no vídeo)

## Comandos

```bash
npm install
npm run studio      # editar/visualizar no navegador
npm run render      # exporta o MP4
node scripts/srt.mjs        # regenera o .srt a partir de src/captions.ts
python3 scripts/music.py    # regenera a trilha (public/audio/trilha.wav)
```

## Estrutura

| Arquivo | O que tem |
|---|---|
| `src/theme.ts` | cores, fontes e tempo de cada cena (em frames) |
| `src/scenes.tsx` | as 6 cenas do roteiro |
| `src/captions.ts` | texto da narração e tempos das legendas |
| `src/Video.tsx` | montagem, trilha, locução e legendas |
| `scripts/music.py` | trilha original sintetizada, 120 BPM (1 tempo = 15 frames), com impactos nos cortes |

## Materiais

- **Logo SemanÁudio 2026, ícone de onda e fotos** (mesa de som, truss e ondas laranja) baixados do site oficial `semanaudio.com.br/salvador2026`.
- Laranja `#F58220`, Bebas Neue e Inter: as mesmas cores e fontes do site oficial.
- **Logo Educa Áudio: PENDENTE.** O site `educaaudio.com.br` bloqueia acesso automatizado, então a logo não foi obtida. No vídeo aparece um espaço reservado identificado como "[ INSERIR LOGO OFICIAL ]". Não foi criada nenhuma logo fictícia. Para trocar:
  1. salve o PNG oficial (fundo transparente, versão para fundo escuro) em `public/brand/educa-audio-logo.png`;
  2. em `src/Root.tsx`, mude para `educaLogo: 'brand/educa-audio-logo.png'`;
  3. rode `npm run render`.
- **Locução: PENDENTE.** Grave a narração (texto em `src/captions.ts`, campo `NARRATION`) e salve em `public/audio/narracao.mp3`. Depois use `narration: 'audio/narracao.mp3'` em `src/Root.tsx`. A trilha abaixa automaticamente quando há locução. Se o ritmo da gravação for diferente, ajuste os tempos em `CUES`.

## Conferir antes de publicar (regra 5)

- [ ] 15% de desconto em **qualquer** curso do Educa Áudio: confirmar validade e se há exceções.
- [ ] 10 cupons de acesso total por sorteio: o vídeo **não** informa duração do acesso, cursos contemplados nem mecânica do sorteio.
- [ ] Prazo "prorrogada até 13/11, às 23h59": confirmar com a organização.
- [ ] Nada no vídeo fala em bolsa de inglês, acesso vitalício, cupons de compras/missões ou certificação MEC.
