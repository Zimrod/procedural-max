// src/graphics/BarChartRig.tsx
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
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  axisColor?: string;
  gridColor?: string;
  labelColor?: string;
  labelFontSize?: number;
  fontFamily?: string;
  backgroundColor?: string;
};

const DEFAULT_COLORS = ['#FFB3BA', '#B5EAD7', '#FFDAC1', '#E2F0CB', '#B5E3FF', '#C7CEE6', '#FFC8DD', '#FDE2C4'];

export const BarChartRig: React.FC<Props> = ({
  data,
  barColors = DEFAULT_COLORS,
  strokeColor = '#ffffff',
  strokeWidth = 1,
  borderRadius = 6,
  axisColor = '#333',
  gridColor = '#a0d1ff',
  labelColor = '#333',
  labelFontSize = 20,
  fontFamily = 'sans-serif',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  if (!values.length) return null;

  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  const rawMax = Math.max(...values);
  
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    if (val > 30) {
      return Math.ceil(val / 10) * 10;
    } else {
      return Math.ceil(val / 2) * 2;
    }
  };

  const maxValue = getNiceMax(rawMax);
  const barWidth = containerWidth / values.length;
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  const introDuration = fps * 1.5;
  const axisDrawDuration = fps * 2;
  const barsStartFrame = introDuration;

  const totalPathLength = containerHeight + containerWidth;
  const lineProgress = interpolate(
    frame,
    [0, axisDrawDuration],
    [totalPathLength, 0],
    { extrapolateRight: 'clamp' }
  );

  const easeOutBounce = (t: number) => {
    const n1 = 7.5625; const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  };

  return (
    <svg width={width} height={height} style={{ backgroundColor }}>
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke={axisColor}
        strokeWidth={3}
        strokeDasharray={totalPathLength}
        strokeDashoffset={lineProgress}
        strokeLinecap="round"
      />

      {[maxValue / 2, maxValue].map((tickValue, i) => {
        const yPos = endY - (tickValue / maxValue) * containerHeight;
        const lineRevealFrame = interpolate(
          yPos - startY, 
          [0, containerHeight], 
          [0, axisDrawDuration]
        );

        const lineOpacity = spring({
          frame: frame - lineRevealFrame,
          fps,
          config: { stiffness: 50 },
        });

        return (
          <line
            key={`grid-line-${i}`}
            x1={startX}
            y1={yPos}
            x2={endX}
            y2={yPos}
            stroke={gridColor}
            strokeWidth={1}
            strokeDasharray="15,5"
            style={{ opacity: lineOpacity * 0.5 }}
          />
        );
      })}

      {[0, maxValue / 2, maxValue].map((tick, i) => {
        const yPos = endY - (tick / maxValue) * containerHeight;
        const distanceToTick = yPos - startY;
        const revealFrame = interpolate(distanceToTick, [0, containerHeight], [0, axisDrawDuration]);
        
        const pop = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 100 },
        });

        return (
          <g key={`y-${i}`} style={{ opacity: pop, transform: `scale(${pop})`, transformOrigin: `${startX}px ${yPos}px` }}>
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke={axisColor} strokeWidth={2} />
            <text
              x={startX - 20}
              y={yPos + 5}
              textAnchor="end"
              fontSize={labelFontSize}
              fill={labelColor}
              fontFamily={fontFamily}
            >
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {values.map((value, i) => {
        const xPos = startX + i * barWidth;
        const labelX = xPos + barWidth / 2;
        
        const distanceToLabel = containerHeight + (i + 0.5) * barWidth;
        const labelRevealFrame = interpolate(distanceToLabel, [0, totalPathLength], [0, axisDrawDuration]);
        const labelPop = spring({ frame: frame - labelRevealFrame, fps, config: { damping: 10 } });

        const barProgress = spring({
          frame: frame - barsStartFrame - i * 5,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 200 },
        });
        const animatedHeight = (value / maxValue) * containerHeight * easeOutBounce(barProgress);

        return (
          <g key={i}>
            <rect
              x={xPos + barWidth * 0.15}
              y={endY - animatedHeight}
              width={barWidth * 0.7}
              height={animatedHeight}
              fill={barColors[i % barColors.length]}
              rx={borderRadius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={labelX}
              y={endY + 35}
              textAnchor="middle"
              fontSize={labelFontSize}
              fill={labelColor}
              fontFamily={fontFamily}
              style={{ opacity: labelPop, transform: `translateY(${(1 - labelPop) * 10}px)` }}
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
};