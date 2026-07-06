// src/remotion/core/presets/phasedCarriageY.ts
//
// Accepts an array of fork carriage Y phases and resolves the active one.
// Replaces multiple sequential forkCarriageY entries in the timeline.

import { forkCarriageY } from './forkCarriageY';

type Phase = {
  from: number;
  to: number;
  start: number;
  duration: number;
};

type Params = {
  phases: Phase[];
};

export const phasedCarriageY = (frame: number, { phases }: Params) => {
  const active = [...phases].reverse().find(p => frame >= p.start) ?? phases[0];
  return forkCarriageY(frame, active);
};