// src/remotion/MyComp/StatRevealRig.tsx

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';

type Props = {
  text: string;                 // REQUIRED now
  durationInFrames?: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

export const StatRevealRig: React.FC<Props> = ({
  text,
  durationInFrames = 120,
  fontSize = 36,
  color = '#111',
  backgroundColor = 'transparent',
  fontFamily = 'Poppins, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // --- Hard fail (dev clarity) ---
  if (!text) {
    throw new Error("StatRevealRig requires 'text' prop");
  }

  const words = useMemo(() => text.split(/\s+/), [text]);
  const totalWords = words.length;

  // Reveal words progressively
  const progress = interpolate(
    frame,
    [0, durationInFrames],
    [0, totalWords],
    { extrapolateRight: 'clamp' }
  );

  const visibleCount = Math.floor(progress);
  const visibleText = words.slice(0, visibleCount).join(" ");

  // Smooth fade-in
  const opacity = interpolate(frame, [0, 10], [0, 1]);

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 80px',
        fontSize,
        fontWeight: 600,
        lineHeight: 1.4,
        color,
        opacity,
        fontFamily,
      }}
    >
      {visibleText}
    </div>
  );
};
