// src/remotion/MyComp/Forklift.tsx
import React, { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender, useVideoConfig } from 'remotion';

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

type PartName =
  | 'forklift_body'
  | 'forklift_wheel_back'
  | 'forklift_wheel_front'
  | 'forklift_fork';

const PART_NAMES: PartName[] = [
  'forklift_body',
  'forklift_wheel_back',
  'forklift_wheel_front',
  'forklift_fork',
];

export interface ForkliftProps {
  /**
   * Distance covered as a % between 0 and 100 inclusive.
   * Maps across canvas width + 20% (for full entry and exit buffer).
   */
  distanceCovered?: number;

  /**
   * Vertical movement of the fork from 0.0 to 1.0 in 0.1 increments.
   * 0.0 = pivot_fork_min, 1.0 = pivot_fork_max.
   */
  forkPosition?: number;

  /**
   * Invert/flip the horizontal direction the forklift is facing.
   */
  invertDirection?: boolean;

  /**
   * Starting X position along the canvas (default is -10% of canvas width).
   */
  positionX?: number;

  /**
   * Ground Y position on the canvas (default is 78% of canvas height).
   */
  positionY?: number;
  x?: number;
  y?: number;

  /**
   * Scale factor for the forklift graphics (default: 0.6).
   */
  scale?: number;

  /**
   * Directory folder name containing the SVG assets.
   */
  forkliftFolder?: string;
}

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
    el.remove();
  });

  if (pivots.size === 0) {
    pivots.set('pivot_fallback', { x: viewBox.w / 2, y: viewBox.h / 2 });
  }

  return { svgText: svgEl.innerHTML, viewBox, pivots };
};

const getPivot = (part: PartData, id: string): { x: number; y: number } => {
  const p = part.pivots.get(id);
  if (!p) {
    throw new Error(`Missing pivot "${id}" in part`);
  }
  return p;
};

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

  const px = pivot.x * scale;
  const py = pivot.y * scale;

  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g transform={`translate(${anchorX - px}, ${anchorY - py}) scale(${scale})`}>
        <g dangerouslySetInnerHTML={{ __html: data.svgText }} />
      </g>
    </g>
  );
};

export const Forklift: React.FC<ForkliftProps> = ({
  distanceCovered = 0,
  forkPosition = 0,
  invertDirection = false,
  positionX,
  positionY,
  x,
  y,
  scale = 0.6,
  forkliftFolder = 'forklift',
}) => {
  const { width, height } = useVideoConfig();
  const [parts, setParts] = useState<Partial<Record<PartName, PartData>>>({});

  // Clamp prop bounds
  const clampedDistance = Math.min(100, Math.max(0, distanceCovered));
  const clampedForkPos = Math.min(1.0, Math.max(0.0, Math.round(forkPosition * 10) / 10));

  useEffect(() => {
    const handle = delayRender('Loading Forklift SVGs');
    const fPrefix = forkliftFolder ? `${forkliftFolder}/` : '';

    const loads: [PartName, Promise<string>][] = [
      ['forklift_body', fetch(staticFile(`${fPrefix}forklift_body.svg`)).then((r) => r.text())],
      ['forklift_wheel_back', fetch(staticFile(`${fPrefix}forklift_wheel_back.svg`)).then((r) => r.text())],
      ['forklift_wheel_front', fetch(staticFile(`${fPrefix}forklift_wheel_front.svg`)).then((r) => r.text())],
      ['forklift_fork', fetch(staticFile(`${fPrefix}forklift_fork.svg`)).then((r) => r.text())],
    ];

    Promise.all(
      loads.map(async ([name, promise]) => {
        const text = await promise;
        return [name, parsePart(text, name)] as [PartName, PartData];
      })
    )
      .then((entries) => {
        setParts(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load Forklift SVGs:', err);
        continueRender(handle);
      });
  }, [forkliftFolder]);

  if (PART_NAMES.some((n) => !parts[n])) return null;

  // ---- Pivot Retrievals ----
  const bodyGroundPivot = getPivot(parts.forklift_body!, 'pivot_ground');
  const bodyWheelBackPivot = getPivot(parts.forklift_body!, 'pivot_wheel_back');
  const bodyWheelFrontPivot = getPivot(parts.forklift_body!, 'pivot_wheel_front');
  const bodyForkMinPivot = getPivot(parts.forklift_body!, 'pivot_fork_min');
  const bodyForkMaxPivot = getPivot(parts.forklift_body!, 'pivot_fork_max');

  // ---- Scaling & Position Logic ----
  const bodyH = parts.forklift_body!.viewBox.h;
  const finalScale = (height * 0.55 * scale) / bodyH;

  // Travel span includes canvas width + 20% for entry/exit margin
  const totalTravelSpan = width * 1.2;
  const travelDeltaX = (clampedDistance / 100) * totalTravelSpan;

  // Support positionX as percentage (0–100) or absolute pixel values
  const basePositionX =
    x ??
    (positionX !== undefined
      ? positionX <= 100
        ? (positionX / 100) * width
        : positionX
      : -width * 0.1);

  const forkliftX = basePositionX + travelDeltaX;
  const groundY =
    y ??
    (positionY !== undefined && positionY <= 100
      ? (positionY / 100) * height
      : positionY) ??
    height * 0.78;

  // Wheel rotations calculated dynamically from total horizontal coordinate (forkliftX)
  const wheelBackRadius = (parts.forklift_wheel_back!.viewBox.h / 2) * finalScale;
  const wheelFrontRadius = (parts.forklift_wheel_front!.viewBox.h / 2) * finalScale;

  const wheelBackRotDeg = (forkliftX / (2 * Math.PI * wheelBackRadius)) * 360;
  const wheelFrontRotDeg = (forkliftX / (2 * Math.PI * wheelFrontRadius)) * 360;

  // Fork Elevation Offset (pivot_fork_min to pivot_fork_max)
  const forkOffsetX = (bodyForkMinPivot.x - bodyGroundPivot.x) * finalScale;
  const forkMinOffsetY = (bodyForkMinPivot.y - bodyGroundPivot.y) * finalScale;
  const forkMaxOffsetY = (bodyForkMaxPivot.y - bodyGroundPivot.y) * finalScale;

  const forkCarriageOffsetY = forkMinOffsetY + clampedForkPos * (forkMaxOffsetY - forkMinOffsetY);

  // Render Anchors
  const bodyGroundWorld = { x: forkliftX, y: groundY };
  const forkCarriageWorld = {
    x: bodyGroundWorld.x + forkOffsetX,
    y: bodyGroundWorld.y + forkCarriageOffsetY,
  };

  const wheelBackWorld = {
    x: bodyGroundWorld.x + (bodyWheelBackPivot.x - bodyGroundPivot.x) * finalScale,
    y: bodyGroundWorld.y + (bodyWheelBackPivot.y - bodyGroundPivot.y) * finalScale,
  };
  const wheelFrontWorld = {
    x: bodyGroundWorld.x + (bodyWheelFrontPivot.x - bodyGroundPivot.x) * finalScale,
    y: bodyGroundWorld.y + (bodyWheelFrontPivot.y - bodyGroundPivot.y) * finalScale,
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform={
          invertDirection
            ? `translate(${forkliftX}, ${groundY}) scale(-1, 1) translate(${-forkliftX}, ${-groundY})`
            : undefined
        }
      >
        {/* Back Wheel */}
        <Part
          data={parts.forklift_wheel_back!}
          scale={finalScale}
          anchorX={wheelBackWorld.x}
          anchorY={wheelBackWorld.y}
          rotateDeg={wheelBackRotDeg}
          pivotId="pivot_wheel_back"
        />

        {/* Front Wheel */}
        <Part
          data={parts.forklift_wheel_front!}
          scale={finalScale}
          anchorX={wheelFrontWorld.x}
          anchorY={wheelFrontWorld.y}
          rotateDeg={wheelFrontRotDeg}
          pivotId="pivot_wheel_front"
        />

        {/* Body */}
        <Part
          data={parts.forklift_body!}
          scale={finalScale}
          anchorX={bodyGroundWorld.x}
          anchorY={bodyGroundWorld.y}
          rotateDeg={0}
          pivotId="pivot_ground"
        />

        {/* Fork */}
        <Part
          data={parts.forklift_fork!}
          scale={finalScale}
          anchorX={forkCarriageWorld.x}
          anchorY={forkCarriageWorld.y}
          rotateDeg={0}
          pivotId="pivot_fork_min"
        />
      </g>
    </svg>
  );
};
