// src/remotion/MyComp/MultiAreaChartRig.tsx

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
  areaOpacity?: number;
  lineWidth?: number;
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

export const MultiAreaChartRig: React.FC<Props> = ({
  data,
  curveType = 'linear',
  maxValue: customMaxValue,
  legendPosition = 'right',
  areaOpacity = 0.3,
  lineWidth = 3,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, series } = data;

  if (!labels.length || !series.length) return null;

  const containerWidth = width * 0.7;
  const containerHeight = height * 0.7;
  const startX = (width - containerWidth) / 2;
  const startY = (height - containerHeight) / 2;
  const endX = startX + containerWidth;
  const endY = startY + containerHeight;
  const baseY = endY;

  const allValues = series.flatMap(s => s.values);
  const rawMax = customMaxValue ?? Math.max(...allValues);
  const getNiceMax = (val: number) => {
    if (val === 0) return 10;
    if (val > 30) return Math.ceil(val / 10) * 10;
    return Math.ceil(val / 2) * 2;
  };
  const maxValue = getNiceMax(rawMax);

  const axisDuration = fps * 2;
  const clipRevealDuration = fps * 2;
  const clipRevealStart = axisDuration;

  const totalAxisLength = containerHeight + containerWidth;
  const axisProgress = interpolate(
    frame,
    [0, axisDuration],
    [totalAxisLength, 0],
    { extrapolateRight: 'clamp' }
  );

  const clipProgress = spring({
    frame: frame - clipRevealStart,
    fps,
    config: { damping: 12, mass: 0.8, stiffness: 100 },
  });
  const clipWidthPercent = interpolate(clipProgress, [0, 1], [0, 100]);
  const clipId = `area-clip-${Date.now()}`;

  const processedSeries = useMemo(() => {
    return series.map((s, idx) => {
      const points = s.values.map((value, i) => ({
        x: startX + (i / (labels.length - 1)) * containerWidth,
        y: endY - (value / maxValue) * containerHeight,
      }));
      const color = s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
      
      let linePath = '';
      let areaPath = '';
      if (points.length > 0) {
        if (curveType === 'linear') {
          linePath = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
        } else {
          linePath = getCurvedPath(points);
        }
        const firstX = points[0].x;
        const lastX = points[points.length - 1].x;
        areaPath = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
      }
      return { name: s.name, points, color, linePath, areaPath };
    });
  }, [series, labels, startX, endY, containerWidth, maxValue, curveType, baseY]);

  const yTicks = [0, maxValue / 2, maxValue];
  const formatValue = (v: number) => (Number.isInteger(v) ? v.toString() : v.toFixed(1));

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
      <defs>
        <clipPath id={clipId}>
          <rect x={startX} y={startY} width={`${clipWidthPercent}%`} height={containerHeight} />
        </clipPath>
      </defs>

      <path
        d={`M ${startX} ${startY} L ${startX} ${endY} L ${endX} ${endY}`}
        fill="none"
        stroke="#333"
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
            stroke="#a0d1ff"
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
            <line x1={startX - 10} y1={yPos} x2={startX} y2={yPos} stroke="#333" strokeWidth={2} />
            <text x={startX - 20} y={yPos + 5} textAnchor="end" fontSize={20} fill="#333" fontFamily="sans-serif">
              {formatValue(tick)}
            </text>
          </g>
        );
      })}

      {labels.map((label, idx) => {
        const xPos = startX + (idx / (labels.length - 1)) * containerWidth;
        const labelRevealFrame = axisDuration + clipRevealDuration * 0.6;
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

      <g clipPath={`url(#${clipId})`}>
        {processedSeries.map((s, idx) => (
          <g key={`series-${idx}`}>
            <path d={s.areaPath} fill={s.color} fillOpacity={areaOpacity} stroke="none" />
            <path d={s.linePath} fill="none" stroke={s.color} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
      </g>

      <g opacity={spring({ frame: frame - axisDuration, fps, config: { damping: 10 } })}>
        {processedSeries.map((s, idx) => (
          <g key={`legend-${idx}`} transform={`translate(${legendX}, ${legendY + idx * legendItemHeight})`}>
            <rect width={16} height={16} fill={s.color} rx={2} />
            <text x={24} y={13} fontSize={18} fill="#333" fontFamily="sans-serif">
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};