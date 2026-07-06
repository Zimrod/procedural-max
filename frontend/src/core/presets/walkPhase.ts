// src/remotion/core/presets/walkPhase.ts
//
// Increments walkPhase at a given speed during the active window.
// Outside the window the phase holds at its last value — so the character
// freezes mid-stride rather than snapping back to 0.
//
// speed: phase increments per frame (0.02 = one full cycle per 50 frames at 30fps)

type Params = {
  start: number;
  end: number;
  speed?: number;
  startPhase?: number; // phase value at frame=start (default 0)
};

export const walkPhase = (
  frame: number,
  { start, end, speed = 0.02, startPhase = 0 }: Params
) => {
  if (frame < start) return { walkPhase: startPhase };
  const elapsed = Math.min(frame - start, end - start);
  const phase = (startPhase + elapsed * speed) % 1;
  return { walkPhase: phase };
};