// src/remotion/MyComp/PieChartRig.tsx

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

const generateColor = (index: number, saturation: number = 70, lightness: number = 80) => {
  const goldenRatio = 0.618033988749895;
  let hue = (index * goldenRatio * 360) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const degToRad = (deg: number) => (deg * Math.PI) / 180;

const pieSlice = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number) => {
  const startRad = degToRad(startAngle);
  const endRad = degToRad(endAngle);
  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
};

export const PieChartRig: React.FC<Props> = ({ data, pieColors }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const { labels, values } = data;

  const total = useMemo(() => values.reduce((a, b) => a + b, 0), [values]);
  if (total === 0) return null;

  const pieRadius = Math.min(width, height) * 0.28;
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

  const outerRadius1 = pieRadius * 1.1;
  const outerRadius2 = pieRadius * 1.3;
  const textPadding = 12;

  // Compute maximum X extent of external pointers on the right side
  const maxPointerX = useMemo(() => {
    let maxX = centerX + pieRadius + 70; // default legend X
    slices.forEach((slice, idx) => {
      const isSmall = slice.percent < 0.05;
      if (!isSmall) return;
      const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
      const isRight = Math.cos(degToRad(midAngle)) > 0;
      if (!isRight) return;
      const outerRadius = idx % 2 === 0 ? outerRadius1 : outerRadius2;
      const lineEndX = centerX + outerRadius * Math.cos(degToRad(midAngle));
      const textX = lineEndX + textPadding * Math.cos(degToRad(midAngle));
      if (textX > maxX) maxX = textX;
    });
    return maxX + 40; // add margin after the farthest pointer
  }, [slices, centerX, pieRadius, outerRadius1, outerRadius2]);

  const legendX = Math.max(centerX + pieRadius + 70, maxPointerX);
  const legendY = centerY - (labels.length * 35) / 2;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {slices.map((slice, idx) => {
        const delay = idx * 5;
        const progress = spring({
          frame: frame - delay,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 150 },
        });

        if (progress === 0) return null;

        const animatedEnd = slice.startAngle + (slice.endAngle - slice.startAngle) * progress;
        const pathData = pieSlice(centerX, centerY, pieRadius, slice.startAngle, animatedEnd);

        const midAngle = slice.startAngle + (slice.endAngle - slice.startAngle) / 2;
        const isSmall = slice.percent < 0.05;

        const innerRadius = pieRadius * 0.9;
        const outerRadius = idx % 2 === 0 ? outerRadius1 : outerRadius2;
        const lineStartX = centerX + innerRadius * Math.cos(degToRad(midAngle));
        const lineStartY = centerY + innerRadius * Math.sin(degToRad(midAngle));
        const lineEndX = centerX + outerRadius * Math.cos(degToRad(midAngle));
        const lineEndY = centerY + outerRadius * Math.sin(degToRad(midAngle));

        const textAngleRad = degToRad(midAngle);
        const textX = lineEndX + textPadding * Math.cos(textAngleRad);
        const textY = lineEndY + textPadding * Math.sin(textAngleRad);

        const internalLabelRadius = pieRadius * 0.65;
        const internalX = centerX + internalLabelRadius * Math.cos(degToRad(midAngle));
        const internalY = centerY + internalLabelRadius * Math.sin(degToRad(midAngle));

        return (
          <g key={idx}>
            <path d={pathData} fill={slice.color} stroke="white" strokeWidth="2" />
            
            {progress > 0.8 && (
              <g opacity={interpolate(progress, [0.8, 1], [0, 1])}>
                {isSmall ? (
                  <>
                    <line
                      x1={lineStartX}
                      y1={lineStartY}
                      x2={lineEndX}
                      y2={lineEndY}
                      stroke="#333"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={pieRadius * 0.1}
                      fill="#333"
                      fontFamily="Bahnschrift, sans-serif"
                      fontWeight="600"
                    >
                      {`${(slice.percent * 100).toFixed(0)}%`}
                    </text>
                  </>
                ) : (
                  <text
                    x={internalX}
                    y={internalY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={pieRadius * 0.12}
                    fill="#333"
                    fontFamily="Bahnschrift, sans-serif"
                    fontWeight="600"
                  >
                    {`${(slice.percent * 100).toFixed(0)}%`}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}

      {/* Legend with dynamic X position to avoid pointer overlap */}
      <g opacity={spring({ frame: frame - 15, fps, config: { damping: 10 } })}>
        {slices.map((slice, idx) => (
          <g key={`legend-${idx}`} transform={`translate(${legendX}, ${legendY + idx * 35})`}>
            <rect width={20} height={20} fill={slice.color} rx={4} />
            <text x={32} y={16} fontSize={22} fill="#333" fontFamily="Poppins, sans-serif" fontWeight="500">
              {slice.label}: {slice.value}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
};