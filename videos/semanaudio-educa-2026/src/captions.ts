// Legendas da narração (frames a 30 fps). Também usadas para gerar o .srt
// (scripts/srt.mjs). Se a locução gravada tiver outro ritmo, ajuste aqui.
export type Cue = {from: number; to: number; text: string};

export const NARRATION: {scene: string; text: string}[] = [
  {scene: 'Cena 1', text: 'Você trabalha com áudio? Então presta atenção nessa oportunidade que a SemanÁudio preparou pra você!'},
  {scene: 'Cena 2', text: 'Em parceria com o Educa Áudio, você vai ter benefícios especiais para continuar evoluindo profissionalmente!'},
  {scene: 'Cena 3', text: 'Durante a SemanÁudio, você garante quinze por cento de desconto em qualquer curso do Educa Áudio!'},
  {scene: 'Cena 4', text: 'E não para por aí! Também teremos o sorteio de dez cupons de acesso total do Educa Áudio!'},
  {scene: 'Cena 5', text: 'Uma oportunidade especial para quem quer crescer no mercado de áudio profissional!'},
];

export const CUES: Cue[] = [
  {from: 6, to: 66, text: 'Você trabalha com áudio?'},
  {from: 70, to: 106, text: 'Então presta atenção nessa oportunidade'},
  {from: 106, to: 148, text: 'que a SemanÁudio preparou pra você!'},
  {from: 156, to: 222, text: 'Em parceria com o Educa Áudio, você vai ter'},
  {from: 222, to: 296, text: 'benefícios especiais para continuar evoluindo profissionalmente!'},
  {from: 304, to: 390, text: 'Durante a SemanÁudio, você garante 15% de desconto'},
  {from: 390, to: 476, text: 'em qualquer curso do Educa Áudio!'},
  {from: 484, to: 540, text: 'E não para por aí!'},
  {from: 544, to: 616, text: 'Também teremos o sorteio de dez cupons'},
  {from: 616, to: 686, text: 'de acesso total do Educa Áudio!'},
  {from: 694, to: 752, text: 'Uma oportunidade especial para quem quer'},
  {from: 752, to: 808, text: 'crescer no mercado de áudio profissional!'},
];
