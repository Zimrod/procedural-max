// src/remotion/core/presets/blendTo.ts
//
// Animates a named prop from `from` to `to` over `duration` frames starting at `start`.
// Used to blend walk/point states in and out smoothly.
// outputKey lets you target any prop name: walkBlend, pointBlend, opacity, etc.

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Params = {
  from: number;
  to: number;
  start: number;
  duration: number;
  outputKey: string;
  easing?: 'easeInOut' | 'linear';
};

export const blendTo = (
  frame: number,
  { from, to, start, duration, outputKey, easing = 'easeInOut' }: Params
) => {
  if (frame < start)  return { [outputKey]: from };
  if (frame > start + duration) return { [outputKey]: to };
  const raw = (frame - start) / duration;
  const t   = easing === 'linear' ? raw : easeInOut(raw);
  return { [outputKey]: from + (to - from) * t };
};