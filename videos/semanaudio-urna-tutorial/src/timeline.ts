import {FPS} from './theme';
import {Segment, STEPS} from './edit';

export const segFrames = (s: Segment) => Math.max(1, Math.round(((s.out - s.in) / (s.speed ?? 1)) * FPS));
export const stepFrames = STEPS.map((st) => st.segments.reduce((a, s) => a + segFrames(s), 0));

/** Sem gravação: espaço reservado curto, sem passos inventados. */
const STEPS_PLACEHOLDER = 6 * FPS;

const opening = 4 * FPS;
const coupons = 8 * FPS;
const steps = STEPS.length ? stepFrames.reduce((a, b) => a + b, 0) : STEPS_PLACEHOLDER;
const info = 10 * FPS;
const closing = 8 * FPS;

const at = (arr: number[]) => arr.reduce<number[]>((acc, d, i) => [...acc, i === 0 ? 0 : acc[i - 1] + arr[i - 1]], []);
const durs = [opening, coupons, steps, info, closing];
const starts = at(durs);

export const T = {
  opening: {from: starts[0], dur: durs[0]},
  coupons: {from: starts[1], dur: durs[1]},
  steps: {from: starts[2], dur: durs[2]},
  info: {from: starts[3], dur: durs[3]},
  closing: {from: starts[4], dur: durs[4]},
};
export const TOTAL = starts[4] + durs[4];
/** cortes entre cenas (onde entram as transições laranja) */
export const CUTS = starts.slice(1);
