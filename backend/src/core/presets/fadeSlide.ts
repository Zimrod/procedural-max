// fadeSlide.ts
//
// Animates x position with easeInOut. Supports a `start` frame so multiple
// slide presets on the same entity can be sequenced (approach, then insert).

const easeOut  = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeIn   = (t: number) => t * t * t;

type Params = {
  fromX: number;
  toX: number;
  duration: number;
  start?: number;
  easing?: "easeOut" | "easeIn" | "easeInOut" | "linear";
};

export const fadeSlide = (frame: number, { fromX, toX, duration, start = 0, easing = "easeOut" }: Params) => {
  if (frame < start) return { x: fromX };
  const raw = Math.min((frame - start) / duration, 1);
  const easeFn =
    easing === "easeInOut" ? easeInOut :
    easing === "easeIn"    ? easeIn    :
    easing === "linear"    ? (t: number) => t :
    easeOut;
  return { x: fromX + (toX - fromX) * easeFn(raw) };
};