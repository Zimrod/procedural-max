// src/remotion/MyComp/ValuationRig.tsx

import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

type Props = {
  value?: number;              // e.g. 42 (million)
  prefix?: string;             // "$"
  suffix?: string;             // "M"
  text?: string;               // fallback
  label?: string;              // "Total Project Cost"
  color?: string;              // primary color
  durationInFrames?: number;
};

const formatNumber = (num: number) => {
  return num.toLocaleString("en-US");
};

export const ValuationRig: React.FC<Props & { text?: string }> = ({
  value,
  prefix = "$",
  suffix = "M",
  label,
  text, // Accept text from JSON as a fallback
  color = "#00C2A8",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // --- Animation progress ---
  const progress = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.8,
    },
  });

  // --- Count-up animation ---
  const animatedValue = interpolate(progress, [0, 1], [0, value], {
    extrapolateRight: "clamp",
  });

  // --- Scale pop ---
  const scale = interpolate(progress, [0, 0.6, 1], [0.8, 1.1, 1], {
    easing: Easing.out(Easing.exp),
  });

  // --- Fade in ---
  const opacity = interpolate(progress, [0, 0.3], [0, 1]);

  // --- Layout ---
  const centerX = width / 2;
  const centerY = height / 2;

  const cardWidth = width * 0.5;
  const cardHeight = height * 0.25;

  const resolvedValue = value ?? 0;
  const resolvedLabel = label ?? text ?? 'Value';

  return (
    <svg width={width} height={height}>
      {/* Card background */}
      <g
        transform={`translate(${centerX}, ${centerY}) scale(${scale})`}
        opacity={opacity}
      >
        <rect
          x={-cardWidth / 2}
          y={-cardHeight / 2}
          width={cardWidth}
          height={cardHeight}
          rx={20}
          fill="white"
          stroke="#e6e6e6"
          strokeWidth={2}
        />

        {/* Accent bar */}
        <rect
          x={-cardWidth / 2}
          y={-cardHeight / 2}
          width={6}
          height={cardHeight}
          fill={color}
        />

        {/* Label */}
        <text
          x={0}
          y={-cardHeight * 0.20}
          textAnchor="middle"
          fontSize={cardHeight * 0.18}
          fill="#666"
          fontFamily="Poppins, sans-serif"
          fontWeight="500"
        >
          {resolvedLabel}
        </text>

        {/* Value */}
        <text
          x={0}
          y={cardHeight * 0.2}
          textAnchor="middle"
          fontSize={cardHeight * 0.32}
          fill="#111"
          fontFamily="Poppins, sans-serif"
          fontWeight="700"
        >
          {`${prefix}${formatNumber(animatedValue.toFixed(1))}${suffix}`}
        </text>
      </g>
    </svg>
  );
};