// src/remotion/MyComp/HorizontalBarChartRig.tsx

import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

type Props = {
  data: {
    labels: string[];
    values: number[];
  };
  barColors?: string[];
  maxValue?: number;
};

const DEFAULT_COLORS = ['#FFB3BA', '#B5EAD7', '#FFDAC1', '#E2F0CB', '#B5E3FF', '#C7CEE6', '#FFC8DD', '#FDE2C4'];

const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const HorizontalBarChartRig: React.FC<Props> = ({
  data,
  barColors = DEFAULT_COLORS,
  maxValue: customMaxValue,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  if (!values.length) return null;

  // Layout (70% container)
  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  // Nice max value (for x‑axis)
  const rawMax = customMaxValue ?? Math.max(...values);
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    if (val > 30) return Math.ceil(val / 10) * 10;
    return Math.ceil(val / 2) * 2;
  };
  const maxValue = getNiceMax(rawMax);
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  // Timing
  const axisDuration = fps * 2;
  const barsStartFrame = axisDuration;
  const barStagger = 5; // frames between bars

  // Axis animation (L‑shape: from top‑left to bottom‑left to bottom‑right)
  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  // Pre‑compute bar dimensions
  const barCount = values.length;
  const categoryHeight = containerHeight / barCount;
  const barHeight = categoryHeight * 0.7;
  const barOffset = (categoryHeight - barHeight) / 2;

  // X‑axis ticks & grid (vertical lines)
  const xTicks = [0, maxValue / 2, maxValue];

  return (
    <svg width={width} height={height} style={{ backgroundColor: 'transparent' }}>
      {/* Animated Axes (L‑shape) */}
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke="#333"
        strokeWidth={3}
        strokeDasharray={totalAxisLength}
        strokeDashoffset={axisProgress}
        strokeLinecap="round"
      />

      {/* Vertical Grid Lines (aligned with x‑axis ticks) */}
      {xTicks.map((tick, i) => {
        const xPos = startX + (tick / maxValue) * containerWidth;
        const revealFrame = interpolate(xPos - startX, [0, containerWidth], [0, axisDuration]);
        const opacity = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 50 },
        });
        return (
          <line
            key={`grid-${i}`}
            x1={xPos}
            y1={startY}
            x2={xPos}
            y2={endY}
            stroke="#a0d1ff"
            strokeWidth={1.5}
            strokeDasharray="8,6"
            style={{ opacity: opacity * 0.4 }}
          />
        );
      })}

      {/* X‑axis Ticks & Labels (bottom) */}
      {xTicks.map((tick, i) => {
        const xPos = startX + (tick / maxValue) * containerWidth;
        const revealFrame = interpolate(xPos - startX, [0, containerWidth], [0, axisDuration]);
        const pop = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 100 },
        });
        return (
          <g key={`x-${i}`} style={{ opacity: pop, transform: `scale(${pop})`, transformOrigin: `${xPos}px ${endY}px` }}>
            <line x1={xPos} y1={endY} x2={xPos} y2={endY + 10} stroke="#333" strokeWidth={2} />
            <text
              x={xPos}
              y={endY + 35}
              textAnchor="middle"
              fontSize={20}
              fill="#333"
              fontFamily="sans-serif"
            >
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {/* Bars (horizontal) & Y‑axis Labels */}
      {values.map((value, idx) => {
        const barLength = (value / maxValue) * containerWidth;
        const yCenter = startY + idx * categoryHeight + categoryHeight / 2;
        const yRect = yCenter - barHeight / 2;

        const barProgress = spring({
          frame: frame - barsStartFrame - idx * barStagger,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 200 },
        });
        const animatedLength = barLength * easeOutBounce(barProgress);

        // Y‑axis label (category)
        const labelRevealFrame = interpolate(
          yCenter - startY,
          [0, containerHeight],
          [0, axisDuration]
        );
        const labelPop = spring({
          frame: frame - labelRevealFrame,
          fps,
          config: { friction: 10 },
        });

        return (
          <g key={idx}>
            {/* Horizontal bar */}
            <rect
              x={startX}
              y={yRect}
              width={animatedLength}
              height={barHeight}
              fill={barColors[idx % barColors.length]}
              rx={6}
            />
            {/* Y‑axis label (category) */}
            <text
              x={startX - 20}
              y={yCenter + 6}
              textAnchor="end"
              fontSize={22}
              fill="#333"
              fontFamily="sans-serif"
              style={{ opacity: labelPop, transform: `translateX(${(1 - labelPop) * 10}px)` }}
            >
              {labels[idx]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};