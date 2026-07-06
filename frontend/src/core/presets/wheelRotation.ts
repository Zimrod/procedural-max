// wheelRotation.ts
//
// Computes wheel rotation angle from the forklift's current x position.
// outputKey lets back and front wheels write to separate props keys
// without overwriting each other when both run as timeline entries.

const easeOut   = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeIn    = (t: number) => t * t * t;

type Phase = {
  fromX: number;
  toX: number;
  start: number;
  duration: number;
  easing?: "easeOut" | "easeIn" | "easeInOut" | "linear";
};

type Params = {
  phases: Phase[];
  degsPerPixel: number;
  // Which prop key to write the result into.
  // Defaults to 'rotateDeg' for backwards compat.
  // Use 'wheelBackRotDeg' / 'wheelFrontRotDeg' for separate wheels.
  outputKey?: string;
};

const getX = (frame: number, phase: Phase): number => {
  if (frame < phase.start) return phase.fromX;
  if (frame > phase.start + phase.duration) return phase.toX;
  const raw = (frame - phase.start) / phase.duration;
  const easeFn =
    phase.easing === "easeInOut" ? easeInOut :
    phase.easing === "easeIn"    ? easeIn    :
    phase.easing === "linear"    ? (t: number) => t :
    easeOut;
  return phase.fromX + (phase.toX - phase.fromX) * easeFn(raw);
};

export const wheelRotation = (
  frame: number,
  { phases, degsPerPixel, outputKey = 'rotateDeg' }: Params
) => {
  const originX = phases[0].fromX;
  let currentX = originX;

  for (const phase of phases) {
    if (frame > phase.start + phase.duration) {
      currentX = phase.toX;
    } else {
      currentX = getX(frame, phase);
      break;
    }
  }

  const distanceTravelled = currentX - originX;
  return { [outputKey]: distanceTravelled * degsPerPixel };
};