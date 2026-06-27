// src/remotion/MyComp/WaterfallChartRig.tsx

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
    values: number[]; // positive = increase, negative = decrease
    startValue?: number; // starting value (default 0)
    finalLabel?: string; // label for the final bar (default "Total")
  };
  increaseColor?: string;
  decreaseColor?: string;
  startEndColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  borderRadius?: number;
  maxValue?: number;
  showConnectors?: boolean;
  axisColor?: string;
  gridColor?: string;
  labelColor?: string;
  backgroundColor?: string;
};

const DEFAULT_INCREASE = '#4ECDC4';
const DEFAULT_DECREASE = '#FF6B6B';
const DEFAULT_START_END = '#45B7D1';

const easeOutBounce = (t: number) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

export const WaterfallChartRig: React.FC<Props> = ({
  data,
  increaseColor = DEFAULT_INCREASE,
  decreaseColor = DEFAULT_DECREASE,
  startEndColor = DEFAULT_START_END,
  strokeColor = '#ffffff',
  strokeWidth = 1,
  borderRadius = 4,
  maxValue: customMaxValue,
  showConnectors = true,
  axisColor = '#333',
  gridColor = '#a0d1ff',
  labelColor = '#333',
  backgroundColor = 'transparent',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values, startValue = 0, finalLabel = 'Total' } = data;

  if (!labels.length || !values.length) return null;

  // Build waterfall steps with start and end values for each bar
  const steps: {
    label: string;
    value: number;
    start: number;
    end: number;
    isEnd?: boolean;
  }[] = [];
  let current = startValue;
  for (let i = 0; i < values.length; i++) {
    const stepStart = current;
    const stepEnd = current + values[i];
    steps.push({
      label: labels[i],
      value: values[i],
      start: stepStart,
      end: stepEnd,
    });
    current = stepEnd;
  }
  const finalValue = current;
  steps.push({
    label: finalLabel,
    value: 0,
    start: finalValue,
    end: finalValue,
    isEnd: true,
  });

  // Determine min and max for y-axis scaling (add 10% padding)
  const allValues = steps.flatMap(s => [s.start, s.end]);
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  let chartMin = minValue - padding;
  let chartMax = maxValue + padding;
  if (customMaxValue !== undefined) chartMax = customMaxValue;
  if (chartMin > 0) chartMin = 0;

  // Layout (70% container)
  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  const totalSteps = steps.length;
  const barWidth = containerWidth / totalSteps;
  const chartRange = chartMax - chartMin;
  const yToPixel = (yValue: number) => endY - ((yValue - chartMin) / chartRange) * containerHeight;

  // Timing
  const axisDuration = fps * 2;
  const barsStartFrame = axisDuration;
  const barStagger = 5;

  // Axis animation (L-shape)
  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  // Y-axis ticks (nice numbers)
  const getNiceTicks = (min: number, max: number, count = 5) => {
    const step = (max - min) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i++) {
      ticks.push(min + i * step);
    }
    return ticks;
  };
  const yTicks = getNiceTicks(chartMin, chartMax, 5);
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  // Determine bar color
  const getBarColor = (step: typeof steps[0]) => {
    if (step.isEnd) return startEndColor;
    if (step.value > 0) return increaseColor;
    if (step.value < 0) return decreaseColor;
    return '#ccc';
  };

  return (
    <svg width={width} height={height} style={{ backgroundColor }}>
      {/* Axes */}
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke={axisColor}
        strokeWidth={3}
        strokeDasharray={totalAxisLength}
        strokeDashoffset={axisProgress}
        strokeLinecap="round"
      />

      {/* Horizontal grid lines */}
      {yTicks.map((tick, i) => {
        const yPos = yToPixel(tick);
        if (yPos < startY || yPos > endY) return null;
        const distanceToTick = Math.abs(yPos - startY);
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
            stroke={gridColor}
            strokeWidth={1.5}
            strokeDasharray="8,6"
            style={{ opacity: opacity * 0.4 }}
          />
        );
      })}

      {/* Y-axis labels */}
      {yTicks.map((tick, i) => {
        const yPos = yToPixel(tick);
        if (yPos < startY || yPos > endY) return null;
        const distanceToTick = Math.abs(yPos - startY);
        const revealFrame = interpolate(distanceToTick, [0, containerHeight], [0, axisDuration]);
        const pop = spring({
          frame: frame - revealFrame,
          fps,
          config: { stiffness: 100 },
        });
        return (
          <g key={`y-${i}`} style={{ opacity: pop, transform: `scale(${pop})`, transformOrigin: `${startX}px ${yPos}px` }}>
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke={axisColor} strokeWidth={2} />
            <text x={startX - 20} y={yPos + 5} textAnchor="end" fontSize={20} fill={labelColor} fontFamily="sans-serif">
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {/* Connectors (lines between bars) */}
      {showConnectors && (
        <g opacity={spring({ frame: frame - axisDuration, fps, config: { damping: 10 } })}>
          {steps.slice(0, -1).map((step, idx) => {
            const currentTop = yToPixel(step.end);
            const nextTop = yToPixel(steps[idx + 1].start);
            const x1 = startX + (idx + 1) * barWidth - barWidth * 0.2;
            const x2 = startX + (idx + 1) * barWidth;
            return (
              <line
                key={`connector-${idx}`}
                x1={x1}
                y1={currentTop}
                x2={x2}
                y2={currentTop}
                stroke={labelColor}
                strokeWidth={2}
                strokeDasharray="4,4"
              />
            );
          })}
        </g>
      )}

      {/* Bars */}
      {steps.map((step, idx) => {
        const startPixel = yToPixel(step.start);
        const endPixel = yToPixel(step.end);
        // Bar should span from the higher Y (lower value) to the lower Y (higher value)
        const barTop = Math.min(startPixel, endPixel);
        const barBottom = Math.max(startPixel, endPixel);
        const barHeight = barBottom - barTop;
        const y = barTop;
        const barColor = getBarColor(step);

        const barProgress = spring({
          frame: frame - barsStartFrame - idx * barStagger,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 200 },
        });
        const animatedHeight = barHeight * easeOutBounce(barProgress);
        const animatedY = step.value >= 0 ? y + (barHeight - animatedHeight) : y;

        // X-axis label
        const labelRevealFrame = barsStartFrame + totalSteps * barStagger;
        const labelProgress = spring({
          frame: frame - labelRevealFrame,
          fps,
          config: { friction: 10 },
        });
        const labelOpacity = interpolate(labelProgress, [0, 1], [0, 1]);
        const labelTranslateY = interpolate(labelProgress, [0, 1], [10, 0]);

        return (
          <g key={`bar-${idx}`}>
            <rect
              x={startX + idx * barWidth + barWidth * 0.15}
              y={animatedY}
              width={barWidth * 0.7}
              height={animatedHeight}
              fill={barColor}
              rx={borderRadius}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <text
              x={startX + idx * barWidth + barWidth / 2}
              y={endY + 35}
              textAnchor="middle"
              fontSize={20}
              fill={labelColor}
              fontFamily="sans-serif"
              style={{ opacity: labelOpacity, transform: `translateY(${labelTranslateY}px)` }}
            >
              {step.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
