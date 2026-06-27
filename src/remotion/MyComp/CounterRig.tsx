// src/remotion/MyComp/CounterRig.tsx
import React from 'react';
import { useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';

type Props = {
  value: number;
  prefix?: string;   // e.g. "$"
  suffix?: string;   // e.g. "M"
  durationFrames?: number;
  fontSize?: number;
  color?: string;
};

export const CounterRig: React.FC<Props> = ({
  value,
  prefix = '',
  suffix = '',
  durationFrames = 30,
  fontSize = 72,
  color = '#333',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 120 },
    durationInFrames: durationFrames,
  });

  const currentValue = Math.floor(interpolate(progress, [0, 1], [0, value]));
  const displayValue = currentValue.toLocaleString();

  return (
    <div
      style={{
        fontSize,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color,
        textAlign: 'center',
        padding: 20,
      }}
    >
      {prefix}{displayValue}{suffix}
    </div>
  );
};