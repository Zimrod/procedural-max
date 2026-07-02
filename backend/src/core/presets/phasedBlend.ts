// src/remotion/core/presets/phasedBlend.ts
//
// Same phase-array pattern as phasedSlide, but for numeric blend values.
// Avoids last-write-wins when multiple blendTo entries share the same outputKey.

import { blendTo } from './blendTo';

type Phase = {
  from: number;
  to: number;
  start: number;
  duration: number;
  easing?: 'easeInOut' | 'linear';
};

type Params = {
  phases: Phase[];
  outputKey: string;
};

export const phasedBlend = (frame: number, { phases, outputKey }: Params) => {
  const active = [...phases].reverse().find(p => frame >= p.start) ?? phases[0];
  return blendTo(frame, { ...active, outputKey });
};