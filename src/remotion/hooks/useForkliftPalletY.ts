// src/remotion/hooks/useForkliftPalletY.ts
import { interpolate, Easing } from 'remotion';

export const useForkliftPalletY = ({
  frame,
  liftStartFrame,
  liftEndFrame,
  groundY,
  liftAmount = 100,
}: {
  frame: number;
  liftStartFrame: number;
  liftEndFrame: number;
  groundY: number;
  liftAmount?: number;
}) => {
  return interpolate(
    frame,
    [liftStartFrame, liftEndFrame],
    [groundY, groundY - liftAmount],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.quad),
    }
  );
};