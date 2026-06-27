// src/remotion/MyComp/DonutChartRig.tsx

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
    values: number[];
  };
  pieColors?: string[];
  strokeColor?: string;
  strokeWidth?: number;
  labelColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

const generateColor = (index: number, saturation: number = 70, lightness: number = 80) => {
  const goldenRatio = 0.618033988749895;
  let hue = (index * goldenRatio * 360) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Path generator for a donut slice (two concentric arcs)
const donutSlice = (cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number) => {
  const startRad = degToRad(startAngle);
  const endRad = degToRad(endAngle);
  
  const x1_outer = cx + outerR * Math.cos(startRad);
  const y1_outer = cy + outerR * Math.sin(startRad);
  const x2_outer = cx + outerR * Math.cos(endRad);
  const y2_outer = cy + outerR * Math.sin(endRad);
  
  const x1_inner = cx + innerR * Math.cos(endRad);
  const y1_inner = cy + innerR * Math.sin(endRad);
  const x2_inner = cx + innerR * Math.cos(startRad);
  const y2_inner = cy + innerR * Math.sin(startRad);

  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return `
    M ${x1_outer} ${y1_outer}
    A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2_outer} ${y2_outer}
    L ${x1_inner} ${y1_inner}
    A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x2_inner} ${y2_inner}
    Z
  `;
};

export const DonutChartRig: React.FC<Props> = ({
  data,
  pieColors,
  strokeColor = '#ffffff',
  strokeWidth = 2,
  labelColor = '#333',
  backgroundColor = 'transparent',
  fontFamily = 'Poppins, sans-serif',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
  if (total === 0) return null;

  const outerRadius = Math.min(width, height) * 0.28;
  const innerRadius = outerRadius * 0.5; // Creates the "donut" hole
  const centerX = width * 0.4;
  const centerY = height / 2;

  const slices = useMemo(() => {
    const result = [];
    let currentAngle = -90;
    for (let i = 0; i < values.length; i++) {
      const percent = values[i] / total;
      const angle = percent * 360;
      const start = currentAngle;
      const end = start + angle;
      const color = pieColors ? pieColors[i % pieColors.length] : generateColor(i);
      result.push({
        label: labels[i],
        value: values[i],
        percent,
        startAngle: start,
        endAngle: end,
        color,
      });
      currentAngle = end;
    }
    return result;
  }, [values, labels, total, pieColors]);

  // Pointer spacing logic
  const outerPointer1 = outerRadius * 1.1;
  const outerPointer2 = outerRadius * 1.25;
  const textPadding = 12;

  const maxPointerX = useMemo(() => {
    let maxX = centerX + outerRadius + 70;
    slices.forEach((slice, idx) => {
      if (slice.percent >= 0.05) return;
      const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
      if (Math.cos(degToRad(midAngle)) <= 0) return;
      const pRadius = idx % 2 === 0 ? outerPointer1 : outerPointer2;
      const textX = centerX + pRadius * Math.cos(degToRad(midAngle)) + textPadding;
      if (textX > maxX) maxX = textX;
    });
    return maxX + 40;
  }, [slices, centerX, outerRadius, outerPointer1, outerPointer2]);

  const legendX = Math.max(centerX + outerRadius + 70, maxPointerX);
  const legendY = centerY - (labels.length * 35) / 2;

  return (
    <svg width={width} height={height} style={{ display: 'block', backgroundColor }}>
      {slices.map((slice, idx) => {
        const progress = spring({
          frame: frame - (idx * 5),
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 150 },
        });

        if (progress === 0) return null;

        const animatedEnd = slice.startAngle + (slice.endAngle - slice.startAngle) * progress;
        const pathData = donutSlice(centerX, centerY, outerRadius, innerRadius, slice.startAngle, animatedEnd);

        const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
        const isSmall = slice.percent < 0.05;

        // Positioning for internal labels (centered in the ring)
        const ringMidRadius = (outerRadius + innerRadius) / 2;
        const internalX = centerX + ringMidRadius * Math.cos(degToRad(midAngle));
        const internalY = centerY + ringMidRadius * Math.sin(degToRad(midAngle));

        // Positioning for external pointers
        const pRadius = idx % 2 === 0 ? outerPointer1 : outerPointer2;
        const textX = centerX + (pRadius + textPadding) * Math.cos(degToRad(midAngle));
        const textY = centerY + (pRadius + textPadding) * Math.sin(degToRad(midAngle));

        return (
          <g key={idx}>
            <path d={pathData} fill={slice.color} stroke={strokeColor} strokeWidth={strokeWidth} />
            
            {progress > 0.8 && (
              <g opacity={interpolate(progress, [0.8, 1], [0, 1])}>
                {isSmall ? (
                  <>
                    <line
                      x1={centerX + outerRadius * Math.cos(degToRad(midAngle))}
                      y1={centerY + outerRadius * Math.sin(degToRad(midAngle))}
                      x2={centerX + pRadius * Math.cos(degToRad(midAngle))}
                      y2={centerY + pRadius * Math.sin(degToRad(midAngle))}
                      stroke={labelColor}
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={textX} y={textY}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={outerRadius * 0.15} fill={labelColor}
                      fontFamily={fontFamily} fontWeight="600"
                    >
                      {`${(slice.percent * 100).toFixed(0)}%`}
                    </text>
                  </>
                ) : (
                  <text
                    x={internalX} y={internalY}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={outerRadius * 0.15} fill={labelColor}
                    fontFamily={fontFamily} fontWeight="600"
                  >
                    {`${(slice.percent * 100).toFixed(0)}%`}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Unified Legend */}
      <g opacity={spring({ frame: frame - 15, fps, config: { damping: 10 } })}>
        {slices.map((slice, idx) => (
          <g key={`legend-${idx}`} transform={`translate(${legendX}, ${legendY + idx * 35})`}>
            <rect width={20} height={20} fill={slice.color} rx={4} />
            <text x={32} y={16} fontSize={22} fill={labelColor} fontFamily={fontFamily} fontWeight="500">
              {slice.label}: {slice.value}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};
