// src/remotion/MyComp/LineChartRig.tsx

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
  lineColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  pointColors?: string[];
  curveType?: 'linear' | 'curved';
  maxValue?: number;
  axisColor?: string;
  gridColor?: string;
  labelColor?: string;
  backgroundColor?: string;
};

const DEFAULT_POINT_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#F0A07C', '#B0A8B9'];

const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.hypot(x2 - x1, y2 - y1);

// Cubic bezier evaluation
const bezierPoint = (t: number, p0: number, cp1: number, cp2: number, p1: number) => {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * cp1 + 3 * mt * t * t * cp2 + t * t * t * p1;
};

// Generate smooth curved path through all points (Catmull-Rom to Bezier)
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

// Compute exact length of curved path by sampling each cubic Bezier segment
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

export const LineChartRig: React.FC<Props> = ({
  data,
  lineColor = '#FF6B6B',
  strokeColor,
  strokeWidth = 12,
  pointColors = DEFAULT_POINT_COLORS,
  curveType = 'linear',
  maxValue: customMaxValue,
  axisColor = '#7f7f7f',
  gridColor = '#a0d1ff',
  labelColor = '#7f7f7f',
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

  const rawMax = customMaxValue ?? Math.max(...values);
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    if (val > 30) return Math.ceil(val / 10) * 10;
    return Math.ceil(val / 2) * 2;
  };
  const maxValue = getNiceMax(rawMax);

  const axisDuration = fps * 2;
  const pointDelayStart = axisDuration;
  const pointStagger = 4;
  const lineDrawStart = pointDelayStart + values.length * pointStagger;
  const lineDrawDuration = fps * 1.5;

  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  const points = values.map((value, i) => ({
    x: startX + (i / (values.length - 1)) * containerWidth,
    y: endY - (value / maxValue) * containerHeight,
    value,
    label: labels[i],
  }));

  const fullPath = curveType === 'linear'
    ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
    : getCurvedPath(points);

  const pathTotalLength = curveType === 'linear'
    ? getLinearPathLength(points)
    : getCurvedPathLength(points);

  const lineDrawProgress = spring({
    frame: frame - lineDrawStart,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 100 },
  });
  const strokeDashoffset = interpolate(lineDrawProgress, [0, 1], [pathTotalLength, 0], {
    extrapolateRight: 'clamp',
  });

  const yTicks = [0, maxValue / 2, maxValue];
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

  return (
    <svg width={width} height={height} style={{ backgroundColor }}>
      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke={axisColor}
        strokeWidth={3}
        strokeDasharray={totalAxisLength}
        strokeDashoffset={axisProgress}
        strokeLinecap="round"
      />

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
            stroke={gridColor}
            strokeWidth={1.5}
            strokeDasharray="8,6"
            style={{ opacity: opacity * 0.4 }}
          />
        );
      })}

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
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke={axisColor} strokeWidth={2} />
            <text x={startX - 20} y={yPos + 5} textAnchor="end" fontSize={20} fill={labelColor} fontFamily="sans-serif">
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {frame >= lineDrawStart && lineDrawProgress > 0 && (
      <path
        d={fullPath}
        fill="none"
        stroke={strokeColor ?? lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
          strokeDasharray={pathTotalLength}
          strokeDashoffset={strokeDashoffset}
        />
      )}

      {points.map((point, idx) => {
        const pointFrame = pointDelayStart + idx * pointStagger;
        const pointProgress = spring({
          frame: frame - pointFrame,
          fps,
          config: { damping: 12, mass: 0.6, stiffness: 200 },
        });
        if (pointProgress === 0) return null;
        const radius = 8 * pointProgress;
        const color = pointColors[idx % pointColors.length];
        return (
          <circle
            key={`point-${idx}`}
            cx={point.x}
            cy={point.y}
            r={radius}
            fill={color}
            stroke={strokeColor ?? '#fff'}
            strokeWidth={2}
            style={{ transform: `scale(${pointProgress})`, transformOrigin: `${point.x}px ${point.y}px` }}
          />
        );
      })}

      {points.map((point, idx) => {
        const labelRevealFrame = lineDrawStart + lineDrawDuration * 0.6;
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
            x={point.x}
            y={endY + 35}
            textAnchor="middle"
            fontSize={22}
            fill={labelColor}
            fontFamily="sans-serif"
            style={{ opacity, transform: `translateY(${translateY}px)` }}
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
};
