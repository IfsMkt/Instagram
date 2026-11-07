# Análise da gravação original: urna da SemanÁudio 2026

**Arquivo recebido:** `tutorial_urna_semanAudio_leve.mov` (versão leve de `copy_780C9D0A-…mp4`)
2min51,6s · 480×854 · 20 fps · H.264 + AAC estéreo. Cópia em `source/`.

> Por causa da resolução (480×854), o zoom foi limitado a 1,6× e o proxy recebe um leve aumento de nitidez. Se existir o arquivo em resolução cheia, basta rodar `analyze.sh` com ele: os tempos continuam os mesmos.

## O que a urna é

É um **totem vertical com tela touch** e teclado na própria tela. Título da tela inicial: **"Vote e concorra ao sorteio"** (Premiação SemanÁudio). Na gravação, a pessoa vota nas 5 categorias da premiação dos expositores, consulta os cupons do sorteio e imprime o cupom (etiqueta com QR Code e código, ex.: `5381LM`).

## Transcrição

| Tempo (s) | Fala |
|---|---|
| 0,0–4,1 | Premiação dos expositores na vigésima quinta edição da SemanÁudio. *(a 1ª passada da transcrição ouviu "15ª": **confirmar**)* |
| 4,1–8,3 | Quem movimenta o setor merece destaque. Serão cinco categorias de reconhecimento, |
| 8,5–16,6 | concorrendo aos troféus de melhor audição de grande porte, que é o Line Array Outdoor; melhor audição de médio porte, que é o Line Array Indoor; |
| 16,6–24,2 | melhor audição de pequeno porte, que são as Point Source e Verticais; melhor produto de lançamento e melhor atendimento do estande. |
| 24,2–32,2 | Tudo isso com votação pelo público, tanto pelo aplicativo quanto pelos totens espalhados pelo evento. |
| 32,2–35,5 | Vou te mostrar agora como votar pelo totem. É muito simples. |
| 35,5–166 | *(sem fala; só ruído de ambiente)* |
| 166,3–168,2 | Acabou, próxima pessoa. |

Transcrição automática (Whisper small), revisada contra o que aparece na tela (nomes das categorias).

## Etapas demonstradas (ordem real)

| # | Tempo (s) | Tela / ação |
|---|---|---|
| — | 0–35,5 | Apresentador fala para a câmera (premiação e votação). |
| 1 | 35,75–38,7 | Tela inicial **"Vote e concorra ao sorteio · Toque na tela para começar"**. Toque no botão amarelo (≈38,0). |
| 2 | 38,8–53,6 | **"Qual é o seu e-mail? O mesmo que você usou na inscrição do evento."** Digitação no teclado da tela (40–50); toque em **"Começar a votar"** (≈51,1). |
| 3 | 53,7–122,6 | **5 categorias**, uma tela cada. Toque em **"Votar"** no produto escolhido, e aparece **"Voto registrado"**: |
| | 54–69 | Melhor audição de sistemas de pequeno porte (Verticais e Point Source): toque ≈66,1, confirmação 67,6 |
| | 70–78 | Melhor audição de sistemas de médio porte (Line Array Indoor) |
| | 79–97 | Melhor audição de sistemas de grande porte (Line Array Outdoor) |
| | 98–110 | Melhor Lançamento |
| | 111–122 | Melhor Atendimento: última confirmação "Você votou em todas!" |
| 4 | 123–131 | **"Pronto, [nome]! Você votou nas 5 categorias."** Toque em **"Meus cupons do sorteio"** (≈129,6), e aparece "Buscando…". |
| 5 | 140,5–148,7 | **"Seus cupons do sorteio: você tem 1 cupom para imprimir"** (código + DISPONÍVEL). Toque em **"Imprimir 1 cupom"** (≈143,0). Confirmação: **"Você tem 1 cupom para imprimir. Atenção: a impressão é de via única. Depois disso você não poderá pedir de novo."** Toque em **"Sim, imprimir agora"** (≈147,6). |
| 6 | 149–163,5 | Tela carregando (149–158); **"Cupons já impressos"** (159,5); retirada da etiqueta impressa com QR Code e código (161–163,5). |
| 7 | 163,5–171,5 | Cupom em frente ao totem; toque em **"Próxima pessoa"** (≈166,7); volta à tela inicial (169,3). |

**Textos de tela que merecem conferência (160 s, "Cupons já impressos"):**
- "Teste, você já retirou todos os seus cupons" · código `5381LM` marcado como **USADO**.
- "A impressão é de via única. Junte mais **1.000 pontos** para ganhar outro cupom." A tela diz "pontos", e o briefing diz "moedas".
- Sob o código aparece um texto pequeno que parece "pela votação" (ilegível na versão leve). Se for isso, votar gera cupom. O vídeo **não** afirma isso.
- Botão "Perdeu a impressão? Reimprimir", apesar do aviso de via única.

**Fica de fora (não aparece com clareza ou não é passo):** carregamento da impressão (149–158), "Perdeu a impressão? Reimprimir" (só aparece, não é usado) e a introdução falada (0–35,5).

**Observação:** na gravação, a impressora fica numa bancada separada (ambiente de teste). Por isso o passo 6 diz só "Retire seu cupom impresso", sem indicar onde fica a impressora no evento.

## Roteiro de edição: tempos exatos (30 fps, 59,8 s)

| Saída | Origem (s) | Vel. | Conteúdo / texto na tela |
|---|---|---|---|
| 0,00–4,00 | 35,75–39,75 | 1× | **Cena 1.** Totem real na tela inicial (escurecido, luz laranja) · "JÁ SABE COMO PARTICIPAR DO SORTEIO?", em seguida "APRENDA A USAR A URNA DA SEMANÁUDIO!" + impacto |
| 4,00–12,00 | — | — | **Cena 2.** "COMO CONSEGUIR CUPONS?" · 1.000 moedas nas missões = 1 cupom · R$ 1.000 em compras = 1 cupom · "As duas formas são independentes" |
| 12,00–13,50 | 37,25–38,75 | 1× | **PASSO 01 · TOQUE PARA COMEÇAR**: zoom + destaque no botão |
| 13,50–14,50 | 38,75–39,75 | 1× | resultado: tela do e-mail |
| 14,50–16,50 | 39,75–49,75 | 5× | **PASSO 02 · DIGITE SEU E-MAIL** ("o mesmo usado na inscrição do evento"): digitação acelerada |
| 16,50–18,20 | 49,90–51,60 | 1× | destaque em "Começar a votar" |
| 18,20–19,40 | 53,70–54,90 | 1× | resultado: primeira categoria |
| 19,40–21,40 | 64,75–66,75 | 1× | **PASSO 03 · VOTE NAS 5 CATEGORIAS** ("toque em Votar no produto escolhido"): zoom + destaque · CATEGORIA 1/5 |
| 21,40–22,60 | 67,60–68,80 | 1× | resultado: "Voto registrado" |
| 22,60–23,83 | 70,00–78,60 | 7× | CATEGORIA 2/5 |
| 23,83–25,13 | 88,00–97,00 | 7× | CATEGORIA 3/5 |
| 25,13–26,50 | 100,00–109,50 | 7× | CATEGORIA 4/5 |
| 26,50–27,73 | 114,00–122,60 | 7× | CATEGORIA 5/5 |
| 27,73–30,57 | 127,75–130,60 | 1× | **PASSO 04 · TOQUE EM MEUS CUPONS DO SORTEIO**: zoom + destaque |
| 30,57–31,67 | 140,50–141,60 | 1× | resultado: "Seus cupons do sorteio" |
| 31,67–33,67 | 141,60–143,60 | 1× | **PASSO 05 · IMPRIMA SEU CUPOM** ("Atenção: a impressão é de via única") · IMPRIMIR 1 CUPOM |
| 33,67–35,87 | 146,40–148,60 | 1× | SIM, IMPRIMIR AGORA |
| 35,87–38,03 | 161,25–163,40 | 1× | **PASSO 06 · RETIRE SEU CUPOM IMPRESSO**: resultado (etiqueta com QR Code) |
| 38,03–40,63 | 166,00–168,60 | 1× | **PASSO 07 · FINALIZE EM PRÓXIMA PESSOA**: voz original + legenda "Acabou, próxima pessoa." |
| 40,63–41,83 | 169,20–170,40 | 1× | resultado: volta à tela inicial |
| 41,83–51,83 | — | — | **Cena 4.** Central de troca de cupons · Pavilhão Subwoofer / Sorteio: 12/11, às 17h · Palco Luzbel |
| 51,83–59,83 | 163,60–166,00 | 0,3× | **Cena 5.** Totem com o cupom impresso (câmera lenta) · "PARTICIPE E BOA SORTE!" · SemanÁudio 2026 · 10 a 12 de novembro, Salvador – BA · logo oficial |

Transições laranja nos cortes entre cenas (4,00 · 12,00 · 41,83 · 51,83) e no meio da Cena 4.

### Áudio
- Voz original limpa (`prep-audio.sh`: passa-altas, redução de ruído, compressão, −16 LUFS) nos trechos em 1×.
- Trechos acelerados ou em câmera lenta ficam sem som original.
- Trilha instrumental original em volume baixo (mais baixo ainda no passo a passo) + whoosh/pop/impacto.

### Decisão: introdução falada (0–35,5 s)
Ficou fora porque explica a premiação, não o uso da urna, e sozinha ocuparia 35 s. Se quiser, o trecho 32,2–35,5 ("Vou te mostrar agora como votar pelo totem. É muito simples.") cabe como ponte antes do PASSO 01, somando 3,3 s ao vídeo.
