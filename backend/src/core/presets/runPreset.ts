// src/remotion/core/presets/runPreset.ts

import { fadeSlide }       from './fadeSlide.js';
import { forkLift }        from './forkLift.js';
import { forkCarriageY }   from './forkCarriageY.js';
import { wheelRotation }   from './wheelRotation.js';
import { phasedSlide }     from './phasedSlide.js';
import { phasedCarriageY } from './phasedCarriageY.js';
import { walkPhase }       from './walkPhase.js';
import { blendTo }         from './blendTo.js';
import { characterMode }   from './characterMode.js';
import { phasedBlend }     from './phasedBlend.js';
import { carDrive }        from './carDrive.js';

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
