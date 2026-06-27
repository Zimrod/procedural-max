// src/remotion/MyComp/DonutComparisonRig.tsx

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type Props = {
  data: {
    labels: string[];
    values: number[]; // 0-100 scores
  };
  donutColors?: string[];
  maxValue?: number; // default 100
  columns?: number; // default 3
};

const generateColor = (index: number, saturation: number = 70, lightness: number = 80) => {
  const goldenRatio = 0.618033988749895;
  let hue = (index * goldenRatio * 360) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const donutSlice = (
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number
) => {
  const span = endAngle - startAngle;
  const clampedEnd = span >= 360 ? startAngle + 359.99 : endAngle;
  const startRad = degToRad(startAngle);
  const endRad = degToRad(clampedEnd);

  const x1_outer = cx + outerR * Math.cos(startRad);
  const y1_outer = cy + outerR * Math.sin(startRad);
  const x2_outer = cx + outerR * Math.cos(endRad);
  const y2_outer = cy + outerR * Math.sin(endRad);

  const x1_inner = cx + innerR * Math.cos(endRad);
  const y1_inner = cy + innerR * Math.sin(endRad);
  const x2_inner = cx + innerR * Math.cos(startRad);
  const y2_inner = cy + innerR * Math.sin(startRad);

  const largeArcFlag = (clampedEnd - startAngle) > 180 ? 1 : 0;

  return `
    M ${x1_outer} ${y1_outer}
    A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2_outer} ${y2_outer}
    L ${x1_inner} ${y1_inner}
    A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x2_inner} ${y2_inner}
    Z
  `;
};

export const DonutComparisonRig: React.FC<Props> = ({
  data,
  donutColors,
  maxValue = 100,
  columns = 3,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  const count = values.length;
  if (count === 0) return null;

  const rows = Math.ceil(count / columns);
  
  // --- Donut radius scales with both columns and rows ---
  const maxRadiusByWidth = (width / columns) * 0.35;
  // Base radius from available height per row (with some margin)
  const maxRadiusByHeight = (height / rows) * 0.45;
  let donutRadius = Math.min(maxRadiusByWidth, maxRadiusByHeight);
  
  // Additional shrink factor: reduces radius by 12% per extra row (more aggressive)
  const rowShrink = Math.pow(0.88, rows - 1);
  donutRadius = donutRadius * rowShrink;
  donutRadius = Math.max(donutRadius, 35); // absolute minimum
  
  const innerRadius = donutRadius * 0.65;
  
  // --- Horizontal spacing: gap decreases with more columns ---
  const horizontalGap = Math.max(8, 20 - (columns - 3) * 3);
  const donutDiameter = donutRadius * 2;
  const totalGridWidth = columns * donutDiameter + (columns - 1) * horizontalGap;
  const startX = (width - totalGridWidth) / 2 + donutRadius;
  
  // --- Vertical spacing: compact but readable ---
  const verticalGap = Math.max(10, 20 - rows * 1.5);
  const rowHeight = donutDiameter + verticalGap;
  const gridHeight = rows * rowHeight;
  const startY = (height - gridHeight) / 2 + donutRadius;

  const donuts = useMemo(() => {
    return values.map((value, idx) => {
      const percent = Math.min(1, Math.max(0, value / maxValue));
      const angle = percent * 360;
      const color = donutColors ? donutColors[idx % donutColors.length] : generateColor(idx);
      
      const row = Math.floor(idx / columns);
      const col = idx % columns;
      
      const centerX = startX + col * (donutDiameter + horizontalGap);
      const centerY = startY + row * rowHeight;
      
      return { label: labels[idx], value, percent, angle, color, centerX, centerY };
    });
  }, [values, labels, maxValue, donutColors, columns, startX, donutDiameter, horizontalGap, startY, rowHeight]);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {donuts.map((donut, idx) => {
        const progress = spring({
          frame: frame - (idx * 4),
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 150 },
        });

        if (progress === 0) return null;

        const startAngle = -90;
        const animatedEnd = startAngle + donut.angle * progress;

        const slicePath = donutSlice(donut.centerX, donut.centerY, donutRadius, innerRadius, startAngle, animatedEnd);
        const fullPath = donutSlice(donut.centerX, donut.centerY, donutRadius, innerRadius, startAngle, startAngle + donut.angle);

        const fontSizeName = donutRadius * 0.22;
        const fontSizePercent = donutRadius * 0.3;
        const textOpacity = interpolate(progress, [0.7, 1], [0, 1]);

        return (
          <g key={idx}>
            <path d={fullPath} fill="#e6e6e6" stroke="white" strokeWidth="1.5" />
            <path d={slicePath} fill={donut.color} stroke="white" strokeWidth="1.5" />
            
            <text
              x={donut.centerX} y={donut.centerY - fontSizeName * 0.7}
              textAnchor="middle" fontSize={fontSizeName} fill="#333"
              fontFamily="Poppins, sans-serif" fontWeight="600" opacity={textOpacity}
            >
              {donut.label}
            </text>
            <text
              x={donut.centerX} y={donut.centerY + fontSizePercent * 0.4}
              textAnchor="middle" fontSize={fontSizePercent} fill="#1a1a1a"
              fontFamily="Poppins, sans-serif" fontWeight="700" opacity={textOpacity}
            >
              {`${Math.round(donut.percent * 100)}%`}
            </text>
          </g>
        );
      })}
    </svg>
  );
};