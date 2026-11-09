# Missão SemanÁudio: gamificação em pixel art

Vídeo vertical 1080×1920, 30 fps, 42 s, feito em Remotion. Mostra como funciona a gamificação do evento como um jogo de plataforma em pixel art.

- Vídeo: `out/gamificacao-pixel-art.mp4`
- `npm run studio` abre o editor; `npm run render` exporta.
- `python3 scripts/chiptune.py` regenera a trilha 8-bit e os efeitos sonoros a partir de `src/timeline.json`.

## Roteiro

| Tempo | O que acontece |
|---|---|
| 0–4 s | Tela de título "MISSÃO SEMANÁUDIO". Aperte START. |
| 4–8 s | FASE 1: o personagem (técnico de som com fone) entra. |
| 6–8 s | Diálogo "NOVA MISSÃO: vá pulando até a moeda" → ACEITAR MISSÃO. |
| 8–13 s | Pula os cases de transporte e pega 4 moedas (+100 cada). MISSÃO COMPLETA +100. |
| 14–20 s | LOJA DO EVENTO → COMPRAR → compra realizada (fone de ouvido). |
| 21–26 s | Bate no bloco musical e saem 5 moedas: "COMPROU? GANHOU MOEDAS!" (total 1.000). |
| 26–31 s | CENTRAL DE TROCA: 1.000 moedas = 1 cupom → TROCAR → +1 CUPOM. |
| 33–38 s | BAÚ DE PRÊMIOS → USAR CUPOM → o baú abre: PRÊMIO DESBLOQUEADO. |
| 38–42 s | Resumo: Missões + Compras → Moedas → Cupons → Prêmios + logo SemanÁudio. |

## Onde editar

- **Tempos:** todos ficam em `src/timeline.json`. Ele é lido pelo vídeo e pela trilha, então ajustar ali mantém o som sincronizado.
- **Textos dos diálogos:** `src/Game.tsx`.
- **Sprites:** `src/pixel.tsx` (1 caractere = 1 pixel).
- **Cenário e construções:** `src/world.tsx`.

---

# Programa Grandes Compradores (composição `GrandesCompradores`)

Vídeo 1080×1920, 45 s, no mesmo mundo em pixel art. Arquivo: `out/grandes-compradores-pixel-art.mp4`.
Tempos em `src/compradores.json`. A trilha sai de `python3 scripts/compradores_audio.py`.

| Tempo | O que acontece |
|---|---|
| 0–3,5 s | Título com as 4 medalhas. |
| 3,5–8 s | "SUAS COMPRAS VALEM MUITO MAIS!" e "QUANTO MAIOR O VALOR DAS SUAS COMPRAS, MAIOR O SEU NÍVEL!". |
| 8–27 s | 4 compras em expositores. O placar soma o total (R$ 120 mil → 450 mil → 780 mil → 1,2 mi) e os cupons (R$ 1.000 = 1 cupom). Cada nível mostra sua faixa oficial. |
| 29–33 s | Checklist "COMO CONQUISTAR SEU BROCHE?" com os 4 passos e a Central de Troca de Cupons (Pavilhão Subwoofer). |
| 33–35 s | Broche da categoria recebido. |
| 35–40 s | Cupons: R$ 1.000 em compras = 1 cupom; 1.000 moedas nas missões do app Comunidade SemanÁudio = 1 cupom. |
| 40–45 s | Pódio com as 4 categorias e as faixas, chamada final e logo. |

Faixas: Bronze R$ 50–300 mil · Prata R$ 301–600 mil · Ouro R$ 601–999 mil · Platinum acima de R$ 999 mil.
Os valores das compras do personagem são exemplos dentro de cada faixa.
