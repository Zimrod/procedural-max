// forkCarriageY.ts
//
// Animates the fork carriage's raw Y offset from pivot_ground.
// This replaces the normalised forkLift (0→1) which couldn't represent
// positions below the rest position (needed for pallet insertion alignment).
//
// `value` is the target carriageOffsetY in world pixels.
// The component reads props.forkCarriageOffsetY when present.

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const forkCarriageY = (
  frame: number,
  { from, to, start, duration }: { from: number; to: number; start: number; duration: number }
) => {
  if (frame < start) return { forkCarriageOffsetY: from };
  const raw = Math.min((frame - start) / duration, 1);
  const t = easeInOut(raw);
  return { forkCarriageOffsetY: from + (to - from) * t };
};