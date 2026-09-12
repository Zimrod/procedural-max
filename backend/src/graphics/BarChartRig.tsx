// src/graphics/BarChartRig.tsx
import React from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
} from 'remotion';
import { normalizeCategoryChartData } from './chartData';

type Props = {
  data: {
    labels: string[];
    values: number[];
  };
  barColors?: string[];
  barColorKeyframes?: Array<{ frame: number; colors: string[] }>;
  barTransformKeyframes?: Array<{ frame: number; scaleX?: number; scaleY?: number; x?: number; y?: number; opacity?: number }>;
  timelineStartFrame?: number;
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
  barColorKeyframes = [],
  barTransformKeyframes = [],
  timelineStartFrame = 0,
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
  const { labels, values } = normalizeCategoryChartData(data);
  const baseBarColors = barColors.length ? barColors : DEFAULT_COLORS;

  const resolvedBarColors = React.useMemo(() => {
    if (!barColorKeyframes.length) return baseBarColors;

    const keyframes = [...barColorKeyframes]
      .filter((keyframe) => Number.isFinite(keyframe.frame) && Array.isArray(keyframe.colors) && keyframe.colors.length > 0)
      .sort((a, b) => a.frame - b.frame);
    if (!keyframes.length) return baseBarColors;

    const absoluteFrame = frame + timelineStartFrame;
    const inputRange = keyframes.map((keyframe) => keyframe.frame);
    const clampedFrame = Math.min(inputRange[inputRange.length - 1], Math.max(inputRange[0], absoluteFrame));
    return baseBarColors.map((fallbackColor, colorIndex) => {
      const outputRange = keyframes.map((keyframe) => keyframe.colors[colorIndex] ?? fallbackColor);
      return interpolateColors(clampedFrame, inputRange, outputRange);
    });
  }, [baseBarColors, barColorKeyframes, frame, timelineStartFrame]);

  const resolvedBarTransform = React.useMemo(() => {
    const keyframes = [...barTransformKeyframes]
      .filter((keyframe) => Number.isFinite(keyframe.frame))
      .sort((a, b) => a.frame - b.frame);
    const defaults = { scaleX: 1, scaleY: 1, x: 0, y: 0, opacity: 1 };
    if (!keyframes.length) return defaults;

    const absoluteFrame = frame + timelineStartFrame;
    const inputRange = keyframes.map((keyframe) => keyframe.frame);
    const clampedFrame = Math.min(inputRange[inputRange.length - 1], Math.max(inputRange[0], absoluteFrame));
    const resolve = (property: 'scaleX' | 'scaleY' | 'x' | 'y' | 'opacity') => interpolate(
      clampedFrame,
      inputRange,
      keyframes.map((keyframe) => Number(keyframe[property] ?? defaults[property])),
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );

    return {
      scaleX: resolve('scaleX'),
      scaleY: resolve('scaleY'),
      x: resolve('x'),
      y: resolve('y'),
      opacity: resolve('opacity'),
    };
  }, [barTransformKeyframes, frame, timelineStartFrame]);

  if (!values.length) return null;

  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  const rawMax = Math.max(...values, 0);
  
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
  const textTransform = (x: number, y: number) =>
    `translate(${x} ${y}) scale(${1 / resolvedBarTransform.scaleX} ${1 / resolvedBarTransform.scaleY}) translate(${-x} ${-y})`;

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
      <g
        transform={`translate(${resolvedBarTransform.x} ${resolvedBarTransform.y}) translate(${width / 2} ${height / 2}) scale(${resolvedBarTransform.scaleX} ${resolvedBarTransform.scaleY}) translate(${-width / 2} ${-height / 2})`}
        opacity={resolvedBarTransform.opacity}
      >
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke={axisColor}
        strokeWidth={3}
        strokeDasharray={totalPathLength}
        strokeDashoffset={lineProgress}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
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
            vectorEffect="non-scaling-stroke"
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
          <g key={`y-${i}`} style={{ opacity: pop }}>
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke={axisColor} strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <text
              x={startX - 20}
              y={yPos + 5}
              transform={textTransform(startX - 20, yPos + 5)}
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
              fill={resolvedBarColors[i % resolvedBarColors.length]}
              rx={borderRadius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={labelX}
              y={endY + 35}
              transform={textTransform(labelX, endY + 35)}
              textAnchor="middle"
              fontSize={labelFontSize}
              fill={labelColor}
              fontFamily={fontFamily}
              style={{ opacity: labelPop }}
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
      </g>
    </svg>
  );
};
