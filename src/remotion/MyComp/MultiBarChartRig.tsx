// src/remotion/MyComp/MultiBarChartRig.tsx

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from 'remotion';

type Series = {
  name: string;
  values: number[];
  color?: string;
};

type Props = {
  data: {
    labels: string[];
    series: Series[];
  };
  maxValue?: number;
  legendPosition?: 'right' | 'bottom';
  groupPadding?: number; // space between groups (0-1, fraction of category width)
};

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0A07C', '#B0A8B9', '#98D8C8', '#F7D794'
];

const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const MultiBarChartRig: React.FC<Props> = ({
  data,
  maxValue: customMaxValue,
  legendPosition = 'right',
  groupPadding = 0.3, // increased from 0.2 to reduce bar width
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, series } = data;

  if (!labels.length || !series.length) return null;

  // Layout (70% container)
  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  // Determine global max value
  const allValues = series.flatMap(s => s.values);
  const rawMax = customMaxValue ?? Math.max(...allValues);
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    if (val > 30) return Math.ceil(val / 10) * 10;
    return Math.ceil(val / 2) * 2;
  };
  const maxValue = getNiceMax(rawMax);

  // Timing
  const axisDuration = fps * 2;
  const seriesDelay = fps * 0.4;
  const barStagger = 4;

  // Axis animation
  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  // Bar dimensions
  const categoryCount = labels.length;
  const seriesCount = series.length;
  const categoryWidth = containerWidth / categoryCount;
  const groupWidth = categoryWidth * (1 - groupPadding);
  const barWidth = groupWidth / seriesCount;
  const groupOffset = (categoryWidth - groupWidth) / 2; // center the group

  // Y-axis ticks & grid
  const yTicks = [0, maxValue / 2, maxValue];
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  // Legend layout
  const legendItemHeight = 32;
  let legendX: number, legendY: number;
  if (legendPosition === 'right') {
    legendX = endX + 40;
    legendY = startY + (containerHeight - series.length * legendItemHeight) / 2;
  } else {
    legendX = startX;
    legendY = endY + 50;
  }

  return (
    <svg width={width} height={height} style={{ backgroundColor: 'transparent' }}>
      {/* Axes */}
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke="#333"
        strokeWidth={3}
        strokeDasharray={totalAxisLength}
        strokeDashoffset={axisProgress}
        strokeLinecap="round"
      />

      {/* Grid lines */}
      {yTicks.map((tick, i) => {
        const yPos = endY - (tick / maxValue) * containerHeight;
        const distanceToTick = yPos - startY;
        const revealFrame = interpolate(distanceToTick, [0, containerHeight], [0, axisDuration]);
        const opacity = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 50 },
        });
        return (
          <line
            key={`grid-${i}`}
            x1={startX}
            y1={yPos}
            x2={endX}
            y2={yPos}
            stroke="#a0d1ff"
            strokeWidth={1.5}
            strokeDasharray="8,6"
            style={{ opacity: opacity * 0.4 }}
          />
        );
      })}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => {
        const yPos = endY - (tick / maxValue) * containerHeight;
        const distanceToTick = yPos - startY;
        const revealFrame = interpolate(distanceToTick, [0, containerHeight], [0, axisDuration]);
        const pop = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 100 },
        });
        return (
          <g key={`y-${i}`} style={{ opacity: pop, transform: `scale(${pop})`, transformOrigin: `${startX}px ${yPos}px` }}>
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke="#333" strokeWidth={2} />
            <text x={startX - 20} y={yPos + 5} textAnchor="end" fontSize={20} fill="#333" fontFamily="sans-serif">
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {/* X-axis category labels */}
      {labels.map((label, idx) => {
        const xPos = startX + idx * categoryWidth + categoryWidth / 2;
        const labelRevealFrame = axisDuration + series.length * seriesDelay;
        const labelProgress = spring({
          frame: frame - labelRevealFrame,
          fps,
          config: { friction: 10 },
        });
        const opacity = interpolate(labelProgress, [0, 1], [0, 1]);
        const translateY = interpolate(labelProgress, [0, 1], [10, 0]);
        return (
          <text
            key={`x-label-${idx}`}
            x={xPos}
            y={endY + 35}
            textAnchor="middle"
            fontSize={22}
            fill="#333"
            fontFamily="sans-serif"
            style={{ opacity, transform: `translateY(${translateY}px)` }}
          >
            {label}
          </text>
        );
      })}

      {/* Bars: adjacent within group, no gaps */}
      {series.map((s, sIdx) => {
        const seriesStartFrame = axisDuration + sIdx * seriesDelay;
        const color = s.color || DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length];
        const barXOffset = groupOffset + sIdx * barWidth;

        return labels.map((_, catIdx) => {
          const value = s.values[catIdx];
          const barHeight = (value / maxValue) * containerHeight;
          const x = startX + catIdx * categoryWidth + barXOffset;
          const y = endY - barHeight;

          const barDelay = seriesStartFrame + catIdx * barStagger;
          const progress = spring({
            frame: frame - barDelay,
            fps,
            config: { damping: 12, mass: 0.8, stiffness: 200 },
          });
          const animatedHeight = barHeight * easeOutBounce(progress);
          const animatedY = endY - animatedHeight;

          if (progress === 0) return null;

          return (
            <rect
              key={`bar-${sIdx}-${catIdx}`}
              x={x}
              y={animatedY}
              width={barWidth}
              height={animatedHeight}
              fill={color}
              rx={4}
              stroke="white"
              strokeWidth={1}
            />
          );
        });
      })}

      {/* Legend */}
      <g opacity={spring({ frame: frame - axisDuration, fps, config: { damping: 10 } })}>
        {series.map((s, idx) => (
          <g
            key={`legend-${idx}`}
            transform={`translate(${legendX}, ${legendY + idx * legendItemHeight})`}
          >
            <rect width={16} height={16} fill={s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]} rx={2} />
            <text x={24} y={13} fontSize={18} fill="#333" fontFamily="sans-serif">
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};