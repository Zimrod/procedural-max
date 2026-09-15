// src/remotion/MyComp/OilDrumRig.tsx
//
// Standalone Oil Drum component loader & rig renderer.
// Asset location: public/oil_drum/oil_drum.svg
//
import React, { useEffect, useState } from 'react';
import {
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';

export const CANVAS_SIZE = 800;

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

const parseOilDrum = (svgText: string): PartData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error('Invalid SVG for oil drum');

  const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 500, h: 500 };

  const pivots = new Map<string, { x: number; y: number }>();
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    const id = el.getAttribute('id')!;
    pivots.set(id, {
      x: parseFloat(el.getAttribute('cx') ?? '0'),
      y: parseFloat(el.getAttribute('cy') ?? '0'),
    });
    el.remove(); // Strip out pivot marker elements from final render
  });

  if (pivots.size === 0) {
    pivots.set('pivot_ground', { x: viewBox.w / 2, y: viewBox.h });
  }

  return { svgText: svgEl.innerHTML, viewBox, pivots };
};

export const OilDrumRig: React.FC<{
  x?: number;
  y?: number;
  position?: { x?: number; y?: number };
  opacity?: number;
  anchorX?: number;
  anchorY?: number;
  scale?: number;
  rotateDeg?: number;
  pivotId?: string;
  oilDrumPath?: string;
}> = ({
  x,
  y,
  position,
  opacity = 1,
  anchorX = CANVAS_SIZE / 2,
  anchorY = CANVAS_SIZE / 2,
  scale = 1.0,
  rotateDeg = 0,
  pivotId = 'pivot_ground',
  oilDrumPath = 'oil_drum/oil_drum.svg',
}) => {
  const [drum, setDrum] = useState<PartData | null>(null);

  useEffect(() => {
    const handle = delayRender('Loading Oil Drum SVG');

    fetch(staticFile(oilDrumPath))
      .then((r) => r.text())
      .then((text) => {
        setDrum(parseOilDrum(text));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load Oil Drum SVG:', err);
        continueRender(handle);
      });
  }, [oilDrumPath]);

  if (!drum) return null;

  const resolvedAnchorX = position?.x ?? x ?? anchorX;
  const resolvedAnchorY = position?.y ?? y ?? anchorY;

  // Pivot selection with fallbacks (pivot_ground -> pivot_bottom_left_edge -> first available)
  const pivot =
    drum.pivots.get(pivotId) ??
    drum.pivots.get('pivot_ground') ??
    drum.pivots.get('pivot_bottom_left_edge') ??
    Array.from(drum.pivots.values())[0] ?? {
      x: drum.viewBox.w / 2,
      y: drum.viewBox.h,
    };

  // Base canvas scale relative to bounding viewBox height
  const finalScale = (CANVAS_SIZE * 0.4 * scale) / drum.viewBox.h;
  const px = pivot.x * finalScale;
  const py = pivot.y * finalScale;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ overflow: 'visible', opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={`rotate(${rotateDeg}, ${resolvedAnchorX}, ${resolvedAnchorY})`}>
        <g transform={`translate(${resolvedAnchorX - px}, ${resolvedAnchorY - py}) scale(${finalScale})`}>
          <g dangerouslySetInnerHTML={{ __html: drum.svgText }} />
        </g>
      </g>
    </svg>
  );
};
