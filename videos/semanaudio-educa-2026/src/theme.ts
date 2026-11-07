// Identidade alinhada ao site oficial da SemanÁudio Salvador 2026
// (laranja #F58220, Bebas Neue para títulos, Inter para textos).
export const FPS = 30;
export const W = 1080;
export const H = 1920;

export const C = {
  black: '#000000',
  ink: '#0A0705',
  orange: '#F58220',
  orangeHot: '#FF9A42',
  orangeDeep: '#C2560A',
  white: '#FFFFFF',
  grey: '#EAEAEA',
};

export const FONT_DISPLAY = 'Bebas Neue, Inter, sans-serif';
export const FONT_TEXT = 'Inter, sans-serif';

// 120 BPM -> 1 tempo a cada 15 frames
export const BEAT = 15;

// Cenas (em frames). Total = 960 frames = 32 s.
export const SCENES = {
  hook: {from: 0, dur: 150},
  intro: {from: 150, dur: 150},
  discount: {from: 300, dur: 180},
  prize: {from: 480, dur: 210},
  deadline: {from: 690, dur: 120},
  close: {from: 810, dur: 150},
};
export const TOTAL = 960;

// Pulso que decai a cada batida da trilha (0..1)
export const beatPulse = (frame: number, decay = 6) => {
  const since = frame % BEAT;
  return Math.exp(-since / decay);
};
