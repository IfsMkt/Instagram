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

/** Vídeo convertido pelo analyze.sh. null = gravação ainda não disponível. */
export const SOURCE: string | null = null; // 'source/urna.mp4'

/** Voz limpa por prep-audio.sh. null = usa o áudio do próprio vídeo. */
export const VOICE: string | null = null; // 'audio/voz.wav'

/** Enquadramento real da urna para a abertura (Cena 1). */
export const OPENING: Segment | null = null;

/** Enquadramento real da urna/evento para o encerramento (Cena 5). */
export const CLOSING: Segment | null = null;

/** Passo a passo (Cena 3), na ordem em que aparece na gravação. */
export const STEPS: Step[] = [];

/** Transcrição da fala original (legendas), tempos da gravação original. */
export const SPEECH: Speech[] = [];
