// src/remotion/MyComp/MultiLineChartRig.tsx

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
  curveType?: 'linear' | 'curved';
  maxValue?: number;
  legendPosition?: 'right' | 'bottom';
  lineWidth?: number;
  pointRadius?: number;
};

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0A07C', '#B0A8B9', '#98D8C8', '#F7D794'
];

const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);

const bezierPoint = (t: number, p0: number, cp1: number, cp2: number, p1: number) => {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * cp1 + 3 * mt * t * t * cp2 + t * t * t * p1;
};

const getCurvedPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  const path: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 0.5;
    const cp1x = p1.x + (p2.x - p0.x) * tension / 3;
    const cp1y = p1.y + (p2.y - p0.y) * tension / 3;
    const cp2x = p2.x - (p3.x - p1.x) * tension / 3;
    const cp2y = p2.y - (p3.y - p1.y) * tension / 3;
    path.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return path.join(' ');
};

const getCurvedPathLength = (points: { x: number; y: number }[], samplesPerSegment = 20) => {
  if (points.length < 2) return 0;
  if (points.length === 2) return distance(points[0].x, points[0].y, points[1].x, points[1].y);
  let totalLen = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const tension = 0.5;
    const cp1 = { x: p1.x + (p2.x - p0.x) * tension / 3, y: p1.y + (p2.y - p0.y) * tension / 3 };
    const cp2 = { x: p2.x - (p3.x - p1.x) * tension / 3, y: p2.y - (p3.y - p1.y) * tension / 3 };
    let prevX = p1.x, prevY = p1.y;
    for (let s = 1; s <= samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const currX = bezierPoint(t, p1.x, cp1.x, cp2.x, p2.x);
      const currY = bezierPoint(t, p1.y, cp1.y, cp2.y, p2.y);
      totalLen += distance(prevX, prevY, currX, currY);
      prevX = currX;
      prevY = currY;
    }
  }
  return totalLen;
};

const getLinearPathLength = (points: { x: number; y: number }[]) => {
  let len = 0;
  for (let i = 0; i < points.length - 1; i++) {
    len += distance(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
  }
  return len;
};

export const MultiLineChartRig: React.FC<Props> = ({
  data,
  curveType = 'linear',
  maxValue: customMaxValue,
  legendPosition = 'right',
  lineWidth = 3,
  pointRadius = 6,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, series } = data;

  if (!labels.length || !series.length) return null;

  // Layout: chart area (70% of canvas)
  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;

  // Determine global max value across all series
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
  const seriesDelay = fps * 0.5; // delay between series
  const pointStagger = 3; // frames per point within a series
  const lineDrawDuration = fps * 1.2;

  // Axis animation
  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  // Precompute points for each series
  const processedSeries = useMemo(() => {
    return series.map((s, sIdx) => {
      const points = s.values.map((value, i) => ({
        x: startX + (i / (labels.length - 1)) * containerWidth,
        y: endY - (value / maxValue) * containerHeight,
        value,
      }));
      const color = s.color || DEFAULT_COLORS[sIdx % DEFAULT_COLORS.length];
      const fullPath = curveType === 'linear'
        ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
        : getCurvedPath(points);
      const pathLength = curveType === 'linear'
        ? getLinearPathLength(points)
        : getCurvedPathLength(points);
      return { ...s, points, color, fullPath, pathLength };
    });
  }, [series, labels, startX, endY, containerWidth, maxValue, curveType]);

  // Y-axis ticks & grid
  const yTicks = [0, maxValue / 2, maxValue];
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  // Legend layout
  const legendItemHeight = 32;
  const legendWidth = 200;
  const legendPadding = 20;
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

      {/* X-axis labels */}
      {labels.map((label, idx) => {
        const xPos = startX + (idx / (labels.length - 1)) * containerWidth;
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

      {/* Lines and points per series */}
      {processedSeries.map((series, sIdx) => {
        const seriesStartFrame = axisDuration + sIdx * seriesDelay;
        const pointsStartFrame = seriesStartFrame;
        const lineStartFrame = pointsStartFrame + series.points.length * pointStagger;

        // Line drawing progress
        const lineProgress = spring({
          frame: frame - lineStartFrame,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 100 },
        });
        const strokeDashoffset = interpolate(lineProgress, [0, 1], [series.pathLength, 0], {
          extrapolateRight: 'clamp',
        });

        // Points
        const pointElements = series.points.map((point, pIdx) => {
          const pointFrame = pointsStartFrame + pIdx * pointStagger;
          const pointProgress = spring({
            frame: frame - pointFrame,
            fps,
            config: { damping: 12, mass: 0.6, stiffness: 200 },
          });
          if (pointProgress === 0) return null;
          const r = pointRadius * pointProgress;
          return (
            <circle
              key={`point-${sIdx}-${pIdx}`}
              cx={point.x}
              cy={point.y}
              r={r}
              fill={series.color}
              stroke="#fff"
              strokeWidth={2}
              style={{ transform: `scale(${pointProgress})`, transformOrigin: `${point.x}px ${point.y}px` }}
            />
          );
        });

        return (
          <g key={`series-${sIdx}`}>
            {/* Line */}
            {frame >= lineStartFrame && lineProgress > 0 && (
              <path
                d={series.fullPath}
                fill="none"
                stroke={series.color}
                strokeWidth={lineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={series.pathLength}
                strokeDashoffset={strokeDashoffset}
              />
            )}
            {/* Points */}
            {pointElements}
          </g>
        );
      })}

      {/* Legend */}
      <g opacity={spring({ frame: frame - axisDuration, fps, config: { damping: 10 } })}>
        {processedSeries.map((series, idx) => (
          <g
            key={`legend-${idx}`}
            transform={`translate(${legendX}, ${legendY + idx * legendItemHeight})`}
          >
            <rect width={16} height={16} fill={series.color} rx={2} />
            <text x={24} y={13} fontSize={18} fill="#333" fontFamily="sans-serif">
              {series.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};