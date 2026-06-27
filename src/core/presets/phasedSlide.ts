// src/remotion/core/presets/phasedSlide.ts
//
// Accepts an array of x-motion phases and resolves the active one at each frame.
// Replaces multiple sequential fadeSlide entries in the timeline which caused
// last-write-wins overwriting in Puppeteer.
//
// Mirrors ForkliftScene's phase-array pattern exactly:
//   const activePhase = [...phases].reverse().find(p => frame >= p.start) ?? phases[0];

import { fadeSlide } from './fadeSlide';

type Phase = {
  fromX: number;
  toX: number;
  start: number;
  duration: number;
  easing?: 'easeOut' | 'easeIn' | 'easeInOut' | 'linear';
};

type Params = {
  phases: Phase[];
};

export const phasedSlide = (frame: number, { phases }: Params) => {
  const active = [...phases].reverse().find(p => frame >= p.start) ?? phases[0];
  return fadeSlide(frame, { ...active, start: active.start });
};