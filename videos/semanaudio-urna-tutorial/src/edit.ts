/**
 * DECISÕES DE EDIÇÃO — único arquivo a preencher depois da análise.
 *
 * Todos os tempos são em SEGUNDOS da gravação original
 * (copy_780C9D0A-9EAF-44AD-9A4A-1907209853E7.mp4, convertida por
 * scripts/analyze.sh em public/source/urna.mp4).
 *
 * Caixas (Box) são frações 0–1 do quadro vertical original:
 * x/y = canto superior esquerdo, w/h = largura/altura.
 *
 * Regra do projeto: só entram aqui passos que APARECEM na gravação.
 */
export type Box = {x: number; y: number; w: number; h: number};

export type Segment = {
  /** início e fim do trecho na gravação original (s) */
  in: number;
  out: number;
  /** área a aproximar com zoom suave (opcional) */
  zoom?: Box;
  /** área da interação, destacada com moldura laranja (opcional) */
  focus?: Box;
  /** trecho que mostra o resultado da ação (mostra selo "RESULTADO") */
  result?: boolean;
  /** velocidade (1 = normal). Use só em trechos sem fala. */
  speed?: number;
  /** etiqueta curta no rodapé (ex.: "CATEGORIA 2/5") */
  label?: string;
};

export type Step = {
  /** instrução curta na tela */
  title: string;
  /** palavras do título destacadas em laranja */
  highlight?: string[];
  /** complemento opcional (uma linha) */
  note?: string;
  segments: Segment[];
};

export type Speech = {in: number; out: number; text: string};

/** Vídeo convertido pelo analyze.sh. */
export const SOURCE: string | null = 'source/urna.mp4';

/** Voz limpa por prep-audio.sh. */
export const VOICE: string | null = 'audio/voz.wav';

/** Cena 1: totem inteiro na tela inicial "Vote e concorra ao sorteio". */
export const OPENING: Segment | null = {in: 35.75, out: 39.75};

/** Cena 5: totem com o cupom impresso na mão (câmera lenta, sem som). */
export const CLOSING: Segment | null = {in: 163.6, out: 166.0, speed: 0.3};

// Áreas recorrentes (frações do quadro vertical)
const LOWER = {x: 0.0, y: 0.35, w: 0.85, h: 0.6};

/**
 * Passo a passo — na ordem da gravação (ver analysis/ANALISE.md).
 * Trechos acelerados (speed > 1) não têm fala; ficam sem áudio.
 */
export const STEPS: Step[] = [
  {
    title: 'TOQUE PARA COMEÇAR',
    highlight: ['COMEÇAR'],
    note: 'Tela inicial: “Vote e concorra ao sorteio”',
    segments: [
      {in: 37.25, out: 38.75, zoom: {x: 0.15, y: 0.45, w: 0.7, h: 0.5}, focus: {x: 0.36, y: 0.75, w: 0.28, h: 0.06}},
      {in: 38.75, out: 39.75, result: true},
    ],
  },
  {
    title: 'DIGITE SEU E-MAIL',
    highlight: ['E-MAIL'],
    note: 'O mesmo usado na inscrição do evento',
    segments: [
      {in: 39.75, out: 49.75, speed: 5, zoom: {x: 0.05, y: 0.35, w: 0.9, h: 0.6}},
      {in: 49.9, out: 51.6, focus: {x: 0.02, y: 0.62, w: 0.96, h: 0.1}},
      {in: 53.7, out: 54.9, result: true},
    ],
  },
  {
    title: 'VOTE NAS 5 CATEGORIAS',
    highlight: ['5', 'CATEGORIAS'],
    note: 'Toque em “Votar” no produto escolhido',
    segments: [
      {in: 64.75, out: 66.75, zoom: {x: 0.3, y: 0.15, w: 0.7, h: 0.6}, focus: {x: 0.76, y: 0.37, w: 0.2, h: 0.08}, label: 'CATEGORIA 1/5'},
      {in: 67.6, out: 68.8, result: true},
      {in: 70.0, out: 78.6, speed: 7, label: 'CATEGORIA 2/5'},
      {in: 88.0, out: 97.0, speed: 7, label: 'CATEGORIA 3/5'},
      {in: 100.0, out: 109.5, speed: 7, label: 'CATEGORIA 4/5'},
      {in: 114.0, out: 122.6, speed: 7, label: 'CATEGORIA 5/5'},
    ],
  },
  {
    title: 'TOQUE EM MEUS CUPONS DO SORTEIO',
    highlight: ['MEUS', 'CUPONS'],
    segments: [
      {in: 127.75, out: 130.6, zoom: LOWER, focus: {x: 0.0, y: 0.62, w: 0.7, h: 0.08}},
      {in: 140.5, out: 141.6, result: true},
    ],
  },
  {
    title: 'IMPRIMA SEU CUPOM',
    highlight: ['IMPRIMA'],
    note: 'Atenção: a impressão é de via única',
    segments: [
      {in: 141.6, out: 143.6, focus: {x: 0.04, y: 0.52, w: 0.92, h: 0.09}, label: 'IMPRIMIR 1 CUPOM'},
      {in: 146.4, out: 148.6, focus: {x: 0.03, y: 0.54, w: 0.86, h: 0.09}, label: 'SIM, IMPRIMIR AGORA'},
    ],
  },
  {
    title: 'RETIRE SEU CUPOM IMPRESSO',
    highlight: ['CUPOM'],
    segments: [{in: 161.25, out: 163.4, result: true}],
  },
  {
    title: 'FINALIZE EM PRÓXIMA PESSOA',
    highlight: ['PRÓXIMA', 'PESSOA'],
    segments: [
      {in: 166.0, out: 168.6, focus: {x: 0.3, y: 0.42, w: 0.42, h: 0.06}},
      {in: 169.2, out: 170.4, result: true},
    ],
  },
];

/** Fala original (Whisper + revisão). Só a fala da demonstração entra no vídeo. */
export const SPEECH: Speech[] = [{in: 166.3, out: 168.2, text: 'Acabou, próxima pessoa.'}];
