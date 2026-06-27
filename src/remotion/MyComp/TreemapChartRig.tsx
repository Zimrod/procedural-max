// src/remotion/MyComp/TreemapChartRig.tsx

import React, { useMemo } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from 'remotion';

type DataItem = {
  label: string;
  value: number;
};

type Props = {
  data: DataItem[];
  colors?: string[];         // array of colors (will cycle)
  maxDepth?: number;         // not used for single level, kept for future
  padding?: number;          // padding between rectangles
  showLabels?: boolean;
  minLabelFontSize?: number;
  valueFormat?: (value: number) => string;
};

type Rectangle = {
  x: number;
  y: number;
  width: number;
  height: number;
  item: DataItem;
  color: string;
};

// Simple treemap layout: recursively divide area by splitting along the longer axis
// This is a basic "slice and dice" algorithm, not optimal but works for non‑hierarchical data.
const computeTreemapLayout = (
  items: DataItem[],
  x: number,
  y: number,
  width: number,
  height: number,
  colors: string[]
): Rectangle[] => {
  if (items.length === 0) return [];

  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return [];

  const rects: Rectangle[] = [];
  let remainingItems = [...items];
  let remainingX = x;
  let remainingY = y;
  let remainingWidth = width;
  let remainingHeight = height;

  // Sort descending to put larger rectangles first
  remainingItems.sort((a, b) => b.value - a.value);

  for (const item of remainingItems) {
    const fraction = item.value / total;
    let rectWidth: number, rectHeight: number;

    // Split along the longer side
    if (remainingWidth >= remainingHeight) {
      rectWidth = remainingWidth * fraction;
      rectHeight = remainingHeight;
    } else {
      rectWidth = remainingWidth;
      rectHeight = remainingHeight * fraction;
    }

    rects.push({
      x: remainingX,
      y: remainingY,
      width: rectWidth,
      height: rectHeight,
      item,
      color: colors[rects.length % colors.length],
    });

    // Update remaining space
    if (remainingWidth >= remainingHeight) {
      remainingX += rectWidth;
      remainingWidth -= rectWidth;
    } else {
      remainingY += rectHeight;
      remainingHeight -= rectHeight;
    }
  }

  return rects;
};

const DEFAULT_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#F0A07C', '#B0A8B9', '#98D8C8', '#F7D794',
];

export const TreemapChartRig: React.FC<Props> = ({
  data,
  colors = DEFAULT_COLORS,
  padding = 2,
  showLabels = true,
  minLabelFontSize = 10,
  valueFormat = (v) => v.toString(),
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  if (!data.length) return null;

  // Use 90% of canvas for treemap (leaves margin)
  const margin = width * 0.05;
  const containerWidth = width - margin * 2;
  const containerHeight = height - margin * 2;
  const startX = margin;
  const startY = margin;

  // Compute rectangle positions
  const rectangles = useMemo(() => {
    return computeTreemapLayout(data, startX, startY, containerWidth, containerHeight, colors);
  }, [data, startX, startY, containerWidth, containerHeight, colors]);

  // Animation: rectangles appear with staggered spring
  const staggerDelay = 3; // frames between each rectangle

  return (
    <svg width={width} height={height} style={{ backgroundColor: 'transparent' }}>
      {rectangles.map((rect, idx) => {
        const progress = spring({
          frame: frame - idx * staggerDelay,
          fps,
          config: { damping: 12, mass: 0.8, stiffness: 150 },
        });

        if (progress === 0) return null;

        // Animate scale from center
        const scale = interpolate(progress, [0, 1], [0, 1]);
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const animatedWidth = rect.width * scale;
        const animatedHeight = rect.height * scale;
        const animatedX = centerX - animatedWidth / 2;
        const animatedY = centerY - animatedHeight / 2;

        // Determine if label fits
        const fontSize = Math.min(
          Math.max(rect.height * 0.2, minLabelFontSize),
          rect.width * 0.15
        );
        const showLabel = showLabels && fontSize >= minLabelFontSize && progress > 0.7;

        return (
          <g key={idx}>
            <rect
              x={animatedX}
              y={animatedY}
              width={animatedWidth}
              height={animatedHeight}
              fill={rect.color}
              stroke="#fff"
              strokeWidth={padding}
              rx={4}
            />
            {showLabel && (
              <text
                x={centerX}
                y={centerY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="#333"
                fontFamily="sans-serif"
                fontWeight="bold"
                opacity={interpolate(progress, [0.7, 1], [0, 1])}
              >
                {rect.item.label}
                {` (${valueFormat(rect.item.value)})`}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
};