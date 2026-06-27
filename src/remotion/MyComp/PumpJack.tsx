// src/remotion/MyComp/PumpJack.tsx
import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';

const INTERNAL_CANVAS = 800;

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

type PartName =
  | 'walking_beam'
  | 'pitman_arm'
  | 'counter_weight'
  | 'motor'
  | 'samson_post';

const PART_NAMES: PartName[] = [
  'walking_beam',
  'pitman_arm',
  'counter_weight',
  'motor',
  'samson_post',
];

// --- SVG parser (unchanged) ---
const parsePart = (svgText: string, partName: string): PartData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error(`Invalid SVG for ${partName}`);

  const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 500, h: 500 };

  const pivots = new Map<string, { x: number; y: number }>();
  svgEl.querySelectorAll('circle[id*="pivot"]').forEach((el) => {
    const id = el.getAttribute('id')!;
    pivots.set(id, {
      x: parseFloat(el.getAttribute('cx') ?? '0'),
      y: parseFloat(el.getAttribute('cy') ?? '0'),
    });
  });

  if (pivots.size === 0) {
    console.warn(`⚠️ ${partName} has no pivots — using viewBox center`);
    pivots.set('pivot_fallback', { x: viewBox.w / 2, y: viewBox.h / 2 });
  }

  return { svgText: svgEl.innerHTML, viewBox, pivots };
};

// --- Helper to get a pivot with fallback ---
const getPivot = (part: PartData, id: string, fallback?: { x: number; y: number }) => {
  const p = part.pivots.get(id);
  if (!p) {
    if (fallback) {
      console.warn(`⚠️ Missing pivot "${id}" in part, using fallback (${fallback.x}, ${fallback.y})`);
      return fallback;
    }
    throw new Error(`Missing pivot "${id}" in part`);
  }
  return p;
};

// --- Rotate a point around a pivot ---
const rotatePoint = (
  pivot: { x: number; y: number },
  point: { x: number; y: number },
  deg: number
): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: pivot.y + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
};

// --- Circle intersection (two solutions) ---
const circleIntersection = (
  A: { x: number; y: number },
  r1: number,
  C: { x: number; y: number },
  r2: number
): [{ x: number; y: number }, { x: number; y: number }] | null => {
  const dx = C.x - A.x;
  const dy = C.y - A.y;
  const d = Math.hypot(dx, dy);
  if (d > r1 + r2 || d < Math.abs(r1 - r2)) return null;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);
  const xm = A.x + (dx * a) / d;
  const ym = A.y + (dy * a) / d;
  const rx = -dy * (h / d);
  const ry = dx * (h / d);
  return [
    { x: xm + rx, y: ym + ry },
    { x: xm - rx, y: ym - ry },
  ];
};

// --- Part renderer (unchanged) ---
const Part: React.FC<{
  data: PartData;
  scale: number;
  anchorX: number;
  anchorY: number;
  rotateDeg: number;
  pivotId: string;
}> = ({ data, scale, anchorX, anchorY, rotateDeg, pivotId }) => {
  const pivot = data.pivots.get(pivotId);
  if (!pivot) return null;
  const scaledPivotX = pivot.x * scale;
  const scaledPivotY = pivot.y * scale;
  const tx = anchorX - scaledPivotX;
  const ty = anchorY - scaledPivotY;
  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
        <g dangerouslySetInnerHTML={{ __html: data.svgText }} />
      </g>
    </g>
  );
};

// --- Main Component ---
export const PumpJack: React.FC<{
  cycleDurationSeconds?: number;
  scale?: number;
  positionX?: number;
  positionY?: number;
  svgFolder?: string;
}> = ({
  cycleDurationSeconds = 2,
  scale = 1,
  positionX,
  positionY,
  svgFolder = '',
}) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const resolvedX = positionX !== undefined
    ? (positionX / width) * INTERNAL_CANVAS
    : INTERNAL_CANVAS * 0.5;
  const resolvedY = positionY !== undefined
    ? (positionY / height) * INTERNAL_CANVAS
    : INTERNAL_CANVAS * 0.75;

  const [parts, setParts] = useState<Partial<Record<PartName, PartData>>>({});

  useEffect(() => {
    const handle = delayRender('Loading PumpJack SVGs');
    const prefix = svgFolder ? `${svgFolder}/` : '';
    Promise.all(
      PART_NAMES.map(async (name) => {
        const res = await fetch(staticFile(`${prefix}${name}.svg`));
        const text = await res.text();
        return [name, parsePart(text, name)] as [PartName, PartData];
      })
    )
      .then((entries) => {
        setParts(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load PumpJack SVGs:', err);
        continueRender(handle);
      });
  }, [svgFolder]);

  if (PART_NAMES.some((n) => !parts[n])) return null;

  const cycleFrames = cycleDurationSeconds * fps;
  const crankAngle = ((frame % cycleFrames) / cycleFrames) * 360;

  const samsonH = parts.samson_post!.viewBox.h;
  const finalScale = (INTERNAL_CANVAS * 0.4 * scale) / samsonH;

  // --- 1. Samson post (static) ---
  const samsonPostPivot = getPivot(parts.samson_post!, 'pivot_samson_post', { x: 0, y: 0 });
  const samsonPostBase = parts.samson_post!.viewBox.h;
  const samsonPostWorld = {
    x: resolvedX,
    y: resolvedY - (samsonPostBase - samsonPostPivot.y) * finalScale,
  };

  // --- 2. Motor (using shared pivot_samson_motor) ---
  const motorSamsonPivot = getPivot(parts.motor!, 'pivot_samson_motor', { x: 0, y: 0 });
  const motorCrankPivot = getPivot(parts.motor!, 'pivot_motor', { x: 0, y: 0 });
  const samsonMotorPivotLocal = parts.samson_post!.pivots.get('pivot_samson_motor');
  let crankCenterWorld: { x: number; y: number };

  if (samsonMotorPivotLocal) {
    const motorSamsonWorld = {
      x: samsonPostWorld.x + (samsonMotorPivotLocal.x - samsonPostPivot.x) * finalScale,
      y: samsonPostWorld.y + (samsonMotorPivotLocal.y - samsonPostPivot.y) * finalScale,
    };
    crankCenterWorld = {
      x: motorSamsonWorld.x + (motorCrankPivot.x - motorSamsonPivot.x) * finalScale,
      y: motorSamsonWorld.y + (motorCrankPivot.y - motorSamsonPivot.y) * finalScale,
    };
  } else {
    // Fallback
    crankCenterWorld = {
      x: samsonPostWorld.x + parts.samson_post!.viewBox.w * finalScale,
      y: resolvedY - (parts.motor!.viewBox.h - motorCrankPivot.y) * finalScale,
    };
  }

  // --- 3. Counter weight (crank) ---
  const cwMotorPivot = getPivot(parts.counter_weight!, 'pivot_motor', { x: 0, y: 0 });
  const cwCrankPivot = getPivot(parts.counter_weight!, 'pivot_pitman_arm', { x: 0, y: 0 });
  const crankPinOffset = {
    x: (cwCrankPivot.x - cwMotorPivot.x) * finalScale,
    y: (cwCrankPivot.y - cwMotorPivot.y) * finalScale,
  };
  const rotatedCrankPin = rotatePoint({ x: 0, y: 0 }, crankPinOffset, crankAngle);
  const crankPinWorld = {
    x: crankCenterWorld.x + rotatedCrankPin.x,
    y: crankCenterWorld.y + rotatedCrankPin.y,
  };

  // --- 4. Walking beam geometry (circle intersection) ---
  const beamSamsonPivot = getPivot(parts.walking_beam!, 'pivot_samson_post', { x: 0, y: 0 });
  const beamWalkingPivot = getPivot(parts.walking_beam!, 'pivot_walking_beam', { x: 0, y: 0 });
  const beamLength = Math.hypot(
    (beamWalkingPivot.x - beamSamsonPivot.x) * finalScale,
    (beamWalkingPivot.y - beamSamsonPivot.y) * finalScale
  );

  // Pitman arm length
  const pitmanBottomPivot = getPivot(parts.pitman_arm!, 'pivot_pitman_arm', { x: 0, y: 0 });
  const pitmanTopPivot = getPivot(parts.pitman_arm!, 'pivot_walking_beam', { x: 0, y: 0 });
  const pitmanLength = Math.hypot(
    (pitmanTopPivot.x - pitmanBottomPivot.x) * finalScale,
    (pitmanTopPivot.y - pitmanBottomPivot.y) * finalScale
  );

  // Find intersection of circles: centre samsonPostWorld radius beamLength,
  // centre crankPinWorld radius pitmanLength
  const intersections = circleIntersection(
    samsonPostWorld,
    beamLength,
    crankPinWorld,
    pitmanLength
  );
  if (!intersections) {
    console.warn('No intersection – mechanism cannot be assembled');
    return null;
  }
  const [sol1, sol2] = intersections;
  // In SVG/screen coordinates, smaller Y is visually higher on the canvas.
  // Pick the upper linkage solution so the walking beam tilts the expected way.
  const beamWalkingWorld = sol1.y < sol2.y ? sol1 : sol2;

  // Rotation angles
  const beamNaturalAngle = Math.atan2(
    beamWalkingPivot.y - beamSamsonPivot.y,
    beamWalkingPivot.x - beamSamsonPivot.x
  );
  const beamWorldAngle = Math.atan2(
    beamWalkingWorld.y - samsonPostWorld.y,
    beamWalkingWorld.x - samsonPostWorld.x
  );
  const beamRotDeg = ((beamWorldAngle - beamNaturalAngle) * 180) / Math.PI;

  const pitmanNaturalAngle = Math.atan2(
    pitmanTopPivot.y - pitmanBottomPivot.y,
    pitmanTopPivot.x - pitmanBottomPivot.x
  );

  const pitmanWorldAngle = Math.atan2(
    beamWalkingWorld.y - crankPinWorld.y,
    beamWalkingWorld.x - crankPinWorld.x
  );

  const pitmanRotDeg = ((pitmanWorldAngle - pitmanNaturalAngle) * 180) / Math.PI;

  // --- Render ---
  return (
    <svg
      width={INTERNAL_CANVAS}
      height={INTERNAL_CANVAS}
      viewBox={`0 0 ${INTERNAL_CANVAS} ${INTERNAL_CANVAS}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Samson post */}
      <Part
        data={parts.samson_post!}
        scale={finalScale}
        anchorX={samsonPostWorld.x}
        anchorY={samsonPostWorld.y}
        rotateDeg={0}
        pivotId="pivot_samson_post"
      />

      {/* Motor */}
      <Part
        data={parts.motor!}
        scale={finalScale}
        anchorX={crankCenterWorld.x}
        anchorY={crankCenterWorld.y}
        rotateDeg={0}
        pivotId="pivot_motor"
      />

      {/* Counter weight */}
      <Part
        data={parts.counter_weight!}
        scale={finalScale}
        anchorX={crankCenterWorld.x}
        anchorY={crankCenterWorld.y}
        rotateDeg={crankAngle}
        pivotId="pivot_motor"
      />

      {/* Walking beam */}
      <Part
        data={parts.walking_beam!}
        scale={finalScale}
        anchorX={samsonPostWorld.x}
        anchorY={samsonPostWorld.y}
        rotateDeg={beamRotDeg}
        pivotId="pivot_samson_post"
      />

      {/* Pitman arm */}
      <Part
        data={parts.pitman_arm!}
        scale={finalScale}   // 👈 THIS is the key
        anchorX={crankPinWorld.x}
        anchorY={crankPinWorld.y}
        rotateDeg={pitmanRotDeg}
        pivotId="pivot_pitman_arm"
      />

      {/* Debug circles – remove after verifying */}
      <circle cx={crankPinWorld.x} cy={crankPinWorld.y} r={4} fill="red" />
      <circle cx={beamWalkingWorld.x} cy={beamWalkingWorld.y} r={4} fill="blue" />
      <circle cx={samsonPostWorld.x} cy={samsonPostWorld.y} r={4} fill="green" />
    </svg>
  );
};
