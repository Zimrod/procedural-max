// src/remotion/MyComp/Forklift.tsx
import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
  interpolate,
} from 'remotion';

// ── Config ────────────────────────────────────────────────────────────────────
const CANVAS_SIZE = 800;

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── SVG Parser ────────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const getPivot = (part: PartData, id: string): { x: number; y: number } => {
  const p = part.pivots.get(id);
  if (!p) {
    console.log(`Available pivots:`, Array.from(part.pivots.keys()));
    throw new Error(`Missing pivot "${id}" in part`);
  }
  return p;
};

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const easeOutCubic = (t: number): number =>
  1 - Math.pow(1 - t, 3);

const easeInCubic = (t: number): number => t * t * t;

// ── Part Renderer ─────────────────────────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────────────
// Animation flow (forklift faces LEFT, enters from RIGHT):
//
// Phase 1 APPROACH  — drives right→left, stops with forks at pallet entry
// Phase 2 LOWER     — stationary, forks drop to pivot_fork_min height
// Phase 3 INSERT    — creeps left, slots forks into pallet gap
// Phase 4 LIFT      — stationary, forks rise to pivot_fork_max height
// Phase 5 DEPART    — reverses right→right, slower than entry
//
export const Forklift: React.FC<{
  approachEndFrame?: number;  // ends approach, begins lowering
  lowerEndFrame?:    number;  // forks reach min height
  insertEndFrame?:   number;  // forks fully inserted
  liftEndFrame?:     number;  // forks at max height
  departEndFrame?:   number;  // exits right edge

  startX?:   number; // entry position X (off right edge)
  groundY?:  number; // ground line Y in canvas coords
  palletX?:  number; // X where pallet gap sits (fork tip target)

  scale?:     number;
  svgFolder?: string;
}> = ({
  approachEndFrame = 60,
  lowerEndFrame    = 90,
  insertEndFrame   = 130,
  liftEndFrame     = 180,
  departEndFrame   = 290,  // slower reverse — more frames than approach

  startX  = CANVAS_SIZE + 300,
  groundY = CANVAS_SIZE * 0.78,
  palletX = CANVAS_SIZE * 0.4,

  scale     = 1,
  svgFolder = 'forklift',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const [parts, setParts] = useState<Partial<Record<PartName, PartData>>>({});

  useEffect(() => {
    const handle = delayRender('Loading Forklift SVGs');
    const prefix = svgFolder ? `${svgFolder}/` : '';
    Promise.all(
      PART_NAMES.map(async (name) => {
        const res  = await fetch(staticFile(`${prefix}${name}.svg`));
        const text = await res.text();
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
  }, [svgFolder]);

  if (PART_NAMES.some((n) => !parts[n])) return null;

  // ── Read all pivots ───────────────────────────────────────────────────────

  // forklift_body
  const bodyGroundPivot     = getPivot(parts.forklift_body!, 'pivot_ground');
  const bodyWheelBackPivot  = getPivot(parts.forklift_body!, 'pivot_wheel_back');
  const bodyWheelFrontPivot = getPivot(parts.forklift_body!, 'pivot_wheel_front');
  const bodyForkMinPivot    = getPivot(parts.forklift_body!, 'pivot_fork_min');
  const bodyForkMaxPivot    = getPivot(parts.forklift_body!, 'pivot_fork_max');

  // wheels
  const wheelBackPivot  = getPivot(parts.forklift_wheel_back!,  'pivot_wheel_back');
  const wheelFrontPivot = getPivot(parts.forklift_wheel_front!, 'pivot_wheel_front');

  // fork
  const forkMinPivot  = getPivot(parts.forklift_fork!, 'pivot_fork_min');
  const forkMaxPivot  = getPivot(parts.forklift_fork!, 'pivot_fork_max');
  const forkRootPivot = getPivot(parts.forklift_fork!, 'pivot_fork_root');
  const forkTipPivot  = getPivot(parts.forklift_fork!, 'pivot_fork_tip');

  // ── Scale ─────────────────────────────────────────────────────────────────
  const bodyH      = parts.forklift_body!.viewBox.h;
  const finalScale = (CANVAS_SIZE * 0.55 * scale) / bodyH;

  // ── Fork height range — read from body pivots ─────────────────────────────
  // pivot_fork_min Y and pivot_fork_max Y in body-local space tell us
  // how far up/down the fork travels relative to the body's ground pivot.
  // forkMinY = fork carriage Y when forks are at minimum (ground level)
  // forkMaxY = fork carriage Y when forks are fully raised
  // Both are offsets from bodyGroundPivot in canvas space.
  // Since Y increases downward, min Y is higher on screen (smaller number).
  const forkMinOffsetY = (bodyForkMinPivot.y - bodyGroundPivot.y) * finalScale;
  const forkMaxOffsetY = (bodyForkMaxPivot.y - bodyGroundPivot.y) * finalScale;

  // Fork horizontal offset from body ground pivot
  const forkOffsetX = (bodyForkMinPivot.x - bodyGroundPivot.x) * finalScale;

  // ── Derived fork geometry ─────────────────────────────────────────────────
  // Forklift faces LEFT — forks extend to the LEFT.
  // Fork tip is to the LEFT of fork root, so:
  //   forkTipPivot.x < forkRootPivot.x  (tip has smaller X in local space)
  // Fork prong length (positive value, direction handled by geometry)
  const forkProngLength = Math.abs(forkTipPivot.x - forkRootPivot.x) * finalScale;

  // Wheel radii
  const wheelBackRadius  = (parts.forklift_wheel_back!.viewBox.h  / 2) * finalScale;
  const wheelFrontRadius = (parts.forklift_wheel_front!.viewBox.h / 2) * finalScale;

  // ── Stop positions ────────────────────────────────────────────────────────
  // Forklift faces LEFT. The fork carriage sits at forkOffsetX from pivot_ground.
  // Fork tip extends further LEFT from the carriage by forkProngLength.
  // So fork tip world X = forkliftX + forkOffsetX - forkProngLength
  // (subtract because tip is to the left of carriage for a left-facing forklift)
  //
  // safeStopX: fork tip just reaches palletX (right edge of pallet gap)
  //   forkliftX + forkOffsetX - forkProngLength = palletX
  //   forkliftX = palletX - forkOffsetX + forkProngLength
  const safeStopX = palletX - forkOffsetX + forkProngLength;

  // insertStopX: fork tip has entered pallet — fork root reaches palletX
  //   forkliftX + forkOffsetX = palletX  →  forkliftX = palletX - forkOffsetX
  const insertStopX = palletX - forkOffsetX;

  // departEndX: exits right side of canvas
  const departEndX = CANVAS_SIZE + 300;

  // ── Phase 1 APPROACH: right → left, eases to safeStopX ──────────────────
  // ── Phase 2 LOWER: stationary at safeStopX ───────────────────────────────
  // ── Phase 3 INSERT: creeps left to insertStopX ───────────────────────────
  // ── Phase 4 LIFT: stationary at insertStopX ──────────────────────────────
  // ── Phase 5 DEPART: reverses right to departEndX, slower ─────────────────

const forkliftX = (() => {
  // Phase 1: APPROACH — Enters from RIGHT, moves LEFT to safeStopX
  if (frame <= approachEndFrame) {
    const t = easeOutCubic(
      interpolate(frame, [0, approachEndFrame], [0, 1], { extrapolateRight: 'clamp' })
    );
    // startX (e.g. 1100) -> safeStopX (e.g. 400)
    return interpolate(t, [0, 1], [startX, safeStopX]);
  }

  if (frame <= lowerEndFrame) return safeStopX;

  // Phase 3: INSERT — Creeps further LEFT into the pallet
  if (frame <= insertEndFrame) {
    const t = easeInOutCubic(
      interpolate(frame, [lowerEndFrame, insertEndFrame], [0, 1], { extrapolateRight: 'clamp' })
    );
    return interpolate(t, [0, 1], [safeStopX, insertStopX]);
  }

  if (frame <= liftEndFrame) return insertStopX;

  // Phase 5: DEPART — Reverses RIGHT to departEndX
  const t = easeInCubic(
    interpolate(frame, [liftEndFrame, departEndFrame], [0, 1], { extrapolateRight: 'clamp' })
  );
  return interpolate(t, [0, 1], [insertStopX, departEndX]);
})();

  // ── Fork carriage Y — interpolates between min and max pivot heights ──────
  // forkCarriageOffsetY = how far the carriage is from ground pivot Y
  // At rest/travel:  carriage sits at forkMinOffsetY (low travel height)
  // After lower:     carriage at forkMinOffsetY (already at min)
  // After lift:      carriage at forkMaxOffsetY (fully raised)
  //
  // NOTE: in Illustrator, pivot_fork_min is LOWER on screen (larger Y value)
  //       and pivot_fork_max is HIGHER on screen (smaller Y value)
  //       So forkMaxOffsetY < forkMinOffsetY in canvas coords
  const forkCarriageOffsetY = (() => {
    // Phases 1 + 2: forks at travel height = fork_min
    if (frame <= lowerEndFrame) return forkMinOffsetY;

    // Phase 3: forks stay at min during insert
    if (frame <= insertEndFrame) return forkMinOffsetY;

    // Phase 4: lift from min to max
    if (frame <= liftEndFrame) {
      const t = easeInOutCubic(
        interpolate(frame, [insertEndFrame, liftEndFrame], [0, 1], { extrapolateRight: 'clamp' })
      );
      return interpolate(t, [0, 1], [forkMinOffsetY, forkMaxOffsetY]);
    }
    // Phase 5: hold at max during depart
    return forkMaxOffsetY;
  })();

  // ── Wheel rotation ────────────────────────────────────────────────────────
  // 1. Calculate how far we've moved in the current frame relative to the start
  // When moving LEFT (Right-to-Left entry), distance should be negative for backward rotation
  const totalDistanceTraveled = (() => {
    if (frame <= approachEndFrame) {
      return forkliftX - startX; // Will be negative (e.g., 400 - 1100 = -700)
    }
    if (frame <= insertEndFrame) {
      // Distance from start to safeStop, plus the creep from safeStop to current X
      return (safeStopX - startX) + (forkliftX - safeStopX);
    }
    if (frame <= liftEndFrame) {
      return (insertStopX - startX);
    }
    // Phase 5: Moving RIGHT (Positive rotation)
    return (insertStopX - startX) + (forkliftX - insertStopX);
  })();

  // Apply rotation based on the circumference
  const wheelBackRotDeg  = (totalDistanceTraveled / (2 * Math.PI * wheelBackRadius))  * 360;
  const wheelFrontRotDeg = (totalDistanceTraveled / (2 * Math.PI * wheelFrontRadius)) * 360;

  // ── World positions via pivot pairing ─────────────────────────────────────
  // forkliftX IS the canvas X of pivot_ground
  const bodyGroundWorld = {
    x: forkliftX,
    y: groundY,
  };

  // Child positions = bodyGroundWorld + (childPivot - bodyGroundPivot) * scale
  const wheelBackWorld = {
    x: bodyGroundWorld.x + (bodyWheelBackPivot.x  - bodyGroundPivot.x) * finalScale,
    y: bodyGroundWorld.y + (bodyWheelBackPivot.y  - bodyGroundPivot.y) * finalScale,
  };

  const wheelFrontWorld = {
    x: bodyGroundWorld.x + (bodyWheelFrontPivot.x - bodyGroundPivot.x) * finalScale,
    y: bodyGroundWorld.y + (bodyWheelFrontPivot.y - bodyGroundPivot.y) * finalScale,
  };

  // Fork carriage world position
  // X: follows body horizontally (same as forkOffsetX from ground pivot)
  // Y: bodyGroundWorld.y + forkCarriageOffsetY (moves up/down based on phase)
  const forkCarriageWorld = {
    x: bodyGroundWorld.x + forkOffsetX,
    y: bodyGroundWorld.y + forkCarriageOffsetY,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  // Render order: wheels behind body, fork in front (extends left)
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 1. Back wheel */}
      <Part
        data={parts.forklift_wheel_back!}
        scale={finalScale}
        anchorX={wheelBackWorld.x}
        anchorY={wheelBackWorld.y}
        rotateDeg={wheelBackRotDeg}
        pivotId="pivot_wheel_back"
      />

      {/* 2. Front wheel */}
      <Part
        data={parts.forklift_wheel_front!}
        scale={finalScale}
        anchorX={wheelFrontWorld.x}
        anchorY={wheelFrontWorld.y}
        rotateDeg={wheelFrontRotDeg}
        pivotId="pivot_wheel_front"
      />

      {/* 3. Body */}
      <Part
        data={parts.forklift_body!}
        scale={finalScale}
        anchorX={bodyGroundWorld.x}
        anchorY={bodyGroundWorld.y}
        rotateDeg={0}
        pivotId="pivot_ground"
      />

      {/* 4. Fork — anchored at pivot_fork_min, translates vertically */}
      <Part
        data={parts.forklift_fork!}
        scale={finalScale}
        anchorX={forkCarriageWorld.x}
        anchorY={forkCarriageWorld.y}
        rotateDeg={0}
        pivotId="pivot_fork_min"
      />
    </svg>
  );
};

// ── useForkliftPalletY — keep pallet/barrel in sync with fork lift ────────────
export const useForkliftPalletY = ({
  frame,
  insertEndFrame = 130,
  liftEndFrame   = 180,
  groundY        = CANVAS_SIZE * 0.78,
  liftAmount     = 120, // px the pallet rises — tune to match forkMaxOffsetY
}: {
  frame:           number;
  insertEndFrame?: number;
  liftEndFrame?:   number;
  groundY?:        number;
  liftAmount?:     number;
}): number => {
  if (frame <= insertEndFrame) return groundY;
  const eic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const t = eic(
    interpolate(frame, [insertEndFrame, liftEndFrame], [0, 1], { extrapolateRight: 'clamp' })
  );
  return interpolate(t, [0, 1], [groundY, groundY - liftAmount]);
};