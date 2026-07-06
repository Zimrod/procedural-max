// src/remotion/core/presets/runPreset.ts

import { fadeSlide }       from './fadeSlide';
import { forkLift }        from './forkLift';
import { forkCarriageY }   from './forkCarriageY';
import { wheelRotation }   from './wheelRotation';
import { phasedSlide }     from './phasedSlide';
import { phasedCarriageY } from './phasedCarriageY';
import { walkPhase }       from './walkPhase';
import { blendTo }         from './blendTo';
import { characterMode }   from './characterMode';
import { phasedBlend }     from './phasedBlend';
import { carDrive }        from './carDrive';

const presets: Record<string, (frame: number, params: any) => Record<string, any>> = {
  fadeSlide,
  forkLift,
  forkCarriageY,
  wheelRotation,
  phasedSlide,
  phasedCarriageY,
  walkPhase,
  blendTo,
  characterMode,
  phasedBlend,
  carDrive,
};

export const runPreset = (name: string, frame: number, params: any) => {
  const fn = presets[name];
  if (!fn) {
    console.warn(`[runPreset] Unknown preset: "${name}"`);
    return {};
  }
  return fn(frame, params);
};