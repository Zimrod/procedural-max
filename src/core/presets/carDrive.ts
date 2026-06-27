// src/core/presets/carDrive.ts
//
// Drives a car across the scene. Outputs:
//   x          — current canvas px position
//   wheelRotDeg — wheel rotation derived from distance travelled
//   shakePx    — vertical shake for rough terrain (optional)
//
// The car entity's transform.x is driven by x.
// wheelRotDeg and shakePx go into props.

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Params = {
  fromX:           number;   // start canvas px (off-screen left = negative)
  toX:             number;   // end canvas px (off-screen right = > canvasWidth)
  start:           number;   // start frame
  duration:        number;   // frames to travel fromX → toX
  wheelRadius:     number;   // wheel radius in canvas px (wheelViewBoxH/2 * scale)
  easing?:         'easeInOut' | 'linear' | 'easeIn' | 'easeOut';
  shakeAmplitude?: number;   // px, 0 = no shake
  shakeSpeed?:     number;   // oscillations per second
};

const easeFns: Record<string, (t: number) => number> = {
  easeInOut,
  linear:   (t) => t,
  easeIn:   (t) => t * t * t,
  easeOut:  (t) => 1 - Math.pow(1 - t, 3),
};

export const carDrive = (frame: number, params: Params) => {
  const {
    fromX,
    toX,
    start,
    duration,
    wheelRadius,
    easing = 'easeInOut',
    shakeAmplitude = 0,
    shakeSpeed = 15,
  } = params;

  const raw  = Math.max(0, Math.min((frame - start) / duration, 1));
  const t    = easeFns[easing]?.(raw) ?? raw;
  const x    = fromX + (toX - fromX) * t;

  // Wheel rotation: distance / circumference * 360
  const distanceTravelled = x - fromX;
  const circumference     = 2 * Math.PI * wheelRadius;
  const wheelRotDeg       = (distanceTravelled / circumference) * 360;

  // Shake
  const shakePx = shakeAmplitude > 0
    ? Math.sin((frame / 30) * shakeSpeed * Math.PI * 2) * shakeAmplitude
    : 0;

  return { x, wheelRotDeg, shakePx };
};