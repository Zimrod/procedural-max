// src/remotion/MyComp/DonutStepChartRig.tsx

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
};

const DEFAULT_COLORS = ['#FFB3BA', '#B5EAD7', '#FFDAC1', '#E2F0CB', '#B5E3FF', '#C7CEE6', '#FFC8DD', '#FDE2C4'];

const degToRad = (deg: number) => (deg * Math.PI) / 180;

// Path generator for a donut slice with specific outer and inner radii
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

export const DonutStepChartRig: React.FC<Props> = ({ data, pieColors = DEFAULT_COLORS }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
  if (total === 0) return null;

  // Layout calculations
  const centerX = width * 0.4;
  const centerY = height / 2;
  const baseOuterRadius = Math.min(width, height) * 0.22;
  const innerRadius = baseOuterRadius * 0.5;
  const stepSize = 15; // The "height" of each step

  const slices = useMemo(() => {
    const result = [];
    let currentAngle = -90;
    for (let i = 0; i < values.length; i++) {
      const percent = values[i] / total;
      const angle = percent * 360;
      const start = currentAngle;
      const end = start + angle;
      // Each slice gets a progressively larger radius
      const sliceOuterRadius = baseOuterRadius + (i * stepSize);
      
      result.push({
        label: labels[i],
        value: values[i],
        percent,
        startAngle: start,
        endAngle: end,
        color: pieColors[i % pieColors.length],
        outerRadius: sliceOuterRadius,
      });
      currentAngle = end;
    }
    return result;
  }, [values, labels, total, pieColors, baseOuterRadius]);

  // Find the widest point for the legend placement
  const maxRadius = baseOuterRadius + (slices.length - 1) * stepSize;
  const legendX = centerX + maxRadius + 80;
  const legendY = centerY - (labels.length * 35) / 2;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {slices.map((slice, idx) => {
        const progress = spring({
          frame: frame - (idx * 5),
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 150 },
        });

        if (progress === 0) return null;

        const animatedEnd = slice.startAngle + (slice.endAngle - slice.startAngle) * progress;
        const pathData = donutSlice(centerX, centerY, slice.outerRadius, innerRadius, slice.startAngle, animatedEnd);

        const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
        const isSmall = slice.percent < 0.05;

        // Label Positioning
        const ringMidRadius = (slice.outerRadius + innerRadius) / 2;
        const internalX = centerX + ringMidRadius * Math.cos(degToRad(midAngle));
        const internalY = centerY + ringMidRadius * Math.sin(degToRad(midAngle));

        // Pointer Positioning (External)
        const pointerOuterRadius = slice.outerRadius + 25;
        const textX = centerX + (pointerOuterRadius + 15) * Math.cos(degToRad(midAngle));
        const textY = centerY + (pointerOuterRadius + 15) * Math.sin(degToRad(midAngle));

        return (
          <g key={idx}>
            <path d={pathData} fill={slice.color} stroke="white" strokeWidth="2" />
            
            {progress > 0.8 && (
              <g opacity={interpolate(progress, [0.8, 1], [0, 1])}>
                {isSmall ? (
                  <>
                    <line
                      x1={centerX + slice.outerRadius * Math.cos(degToRad(midAngle))}
                      y1={centerY + slice.outerRadius * Math.sin(degToRad(midAngle))}
                      x2={centerX + pointerOuterRadius * Math.cos(degToRad(midAngle))}
                      y2={centerY + pointerOuterRadius * Math.sin(degToRad(midAngle))}
                      stroke="#333"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={textX} y={textY}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={18} fill="#333"
                      fontFamily="Poppins, sans-serif" fontWeight="500"
                    >
                      {`${(slice.percent * 100).toFixed(0)}%`}
                    </text>
                  </>
                ) : (
                  <text
                    x={internalX} y={internalY}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={20} fill="#333"
                    fontFamily="Poppins, sans-serif" fontWeight="600"
                  >
                    {`${(slice.percent * 100).toFixed(0)}%`}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Legend */}
      <g opacity={spring({ frame: frame - 20, fps, config: { damping: 10 } })}>
        {slices.map((slice, idx) => (
          <g key={`legend-${idx}`} transform={`translate(${legendX}, ${legendY + idx * 40})`}>
            <rect width={22} height={22} fill={slice.color} rx={4} />
            <text x={35} y={18} fontSize={22} fill="#333" fontFamily="Poppins, sans-serif" fontWeight="500">
              {slice.label}: {slice.value}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};