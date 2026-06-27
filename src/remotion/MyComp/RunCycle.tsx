// src/remotion/MyComp/WalkCycle.tsx
import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
} from 'remotion';

const CANVAS_SIZE = 800;

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

// Parse SVG: extract inner content, viewBox, and all pivots (circles with id containing "pivot")
const parsePart = (svgText: string, partName: string): PartData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) throw new Error(`Invalid SVG for ${partName}`);

  const vb = svgEl.getAttribute('viewBox')?.split(' ').map(Number);
  const viewBox = vb ? { w: vb[2], h: vb[3] } : { w: 500, h: 500 };

  const pivots = new Map<string, { x: number; y: number }>();
  const pivotEls = svgEl.querySelectorAll('circle[id*="pivot"]');
  pivotEls.forEach((el) => {
    const id = el.getAttribute('id')!;
    const cx = parseFloat(el.getAttribute('cx') ?? '0');
    const cy = parseFloat(el.getAttribute('cy') ?? '0');
    pivots.set(id, { x: cx, y: cy });
  });

  if (pivots.size === 0) {
    console.warn(`⚠️ ${partName} has no pivots – using viewBox center as fallback.`);
    pivots.set('pivot_fallback', { x: viewBox.w / 2, y: viewBox.h / 2 });
  }

  return {
    svgText: svgEl.innerHTML,
    viewBox,
    pivots,
  };
};

// Render a part: translate + scale, then optionally rotate around a given pivot
const Part: React.FC<{
  data: PartData;
  scale: number;
  anchorX: number;
  anchorY: number;
  rotateDeg: number;
  pivotId?: string;
}> = ({ data, scale, anchorX, anchorY, rotateDeg, pivotId }) => {
  const pivot = pivotId && data.pivots.has(pivotId)
    ? data.pivots.get(pivotId)!
    : Array.from(data.pivots.values())[0];
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

export const WalkCycle: React.FC<{
  cycleDurationSeconds?: number;
  characterScale?: number;
}> = ({ cycleDurationSeconds = 0.6, characterScale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Parts expected (all must exist in public folder)
  const partNames = [
    'head_neck',
    'torso',
    'upper_arm_r', 'upper_arm_l',
    'lower_arm_r', 'lower_arm_l',
    'upper_leg_r', 'upper_leg_l',
    'lower_leg_r', 'lower_leg_l',
  ] as const;
  type PartName = typeof partNames[number];

  const [parts, setParts] = useState<Partial<Record<PartName, PartData>>>({});

  useEffect(() => {
    const handle = delayRender('Loading walk cycle SVGs');
    Promise.all(
      partNames.map(async (name) => {
        const res = await fetch(staticFile(`${name}.svg`));
        const text = await res.text();
        return [name, parsePart(text, name)] as [PartName, PartData];
      })
    )
      .then((entries) => {
        setParts(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('Failed to load SVGs:', err);
        continueRender(handle);
      });
  }, []);

  if (partNames.some((n) => !parts[n])) return null;

  // Timing
  const cycleFrames = cycleDurationSeconds * fps;
  const t = (frame % cycleFrames) / cycleFrames;

  // Global scaling
  const TOTAL_BODY_HEIGHT =
    parts.head_neck!.viewBox.h +
    parts.torso!.viewBox.h +
    parts.upper_leg_r!.viewBox.h +
    parts.lower_leg_r!.viewBox.h;

  const baseScale = CANVAS_SIZE / TOTAL_BODY_HEIGHT;
  const finalScale = baseScale * characterScale;

  // Helper to get a pivot with fallback
  const getPivot = (part: PartData, id: string, fallback?: { x: number; y: number }) => {
    const p = part.pivots.get(id);
    if (!p) {
      if (fallback) {
        console.warn(`⚠️ ${id} missing in part, using fallback (${fallback.x}, ${fallback.y})`);
        return fallback;
      }
      throw new Error(`Part missing pivot "${id}"`);
    }
    return p;
  };

  // ----- Pivot positions (in the part's own coordinate system) -----
  const torsoPivots = parts.torso!.pivots;
  const pelvisPivot = getPivot(parts.torso!, 'pivot_pelvis');
  const shoulderRFallback = { x: 20, y: -30 };
  const shoulderLFallback = { x: -20, y: -30 };
  const shoulderRPivot = getPivot(parts.torso!, 'pivot_shoulder_r', shoulderRFallback);
  const shoulderLPivot = getPivot(parts.torso!, 'pivot_shoulder_l', shoulderLFallback);
  const neckFallback = { x: 0, y: -80 };
  const neckPivot = getPivot(parts.torso!, 'pivot_neck', neckFallback);

  const headPivots = parts.head_neck!.pivots;
  const headNeckPivot = getPivot(parts.head_neck!, 'pivot_neck', neckFallback);

  const upperArmRPivots = parts.upper_arm_r!.pivots;
  const upperArmRShoulderPivot = getPivot(parts.upper_arm_r!, 'pivot_shoulder_r');
  const upperArmRElbowPivot = getPivot(parts.upper_arm_r!, 'pivot_elbow_r');

  const upperArmLPivots = parts.upper_arm_l!.pivots;
  const upperArmLShoulderPivot = getPivot(parts.upper_arm_l!, 'pivot_shoulder_l');
  const upperArmLElbowPivot = getPivot(parts.upper_arm_l!, 'pivot_elbow_l');

  const lowerArmRPivots = parts.lower_arm_r!.pivots;
  const lowerArmRElbowPivot = getPivot(parts.lower_arm_r!, 'pivot_elbow_r');

  const lowerArmLPivots = parts.lower_arm_l!.pivots;
  const lowerArmLElbowPivot = getPivot(parts.lower_arm_l!, 'pivot_elbow_l');

  const upperLegRPivots = parts.upper_leg_r!.pivots;
  const upperLegRHipPivot = getPivot(parts.upper_leg_r!, 'pivot_pelvis_r');
  const upperLegRKneePivot = getPivot(parts.upper_leg_r!, 'pivot_knee_r');

  const upperLegLPivots = parts.upper_leg_l!.pivots;
  const upperLegLHipPivot = getPivot(parts.upper_leg_l!, 'pivot_pelvis_l');
  const upperLegLKneePivot = getPivot(parts.upper_leg_l!, 'pivot_knee_l');

  const lowerLegRPivots = parts.lower_leg_r!.pivots;
  const lowerLegRKneePivot = getPivot(parts.lower_leg_r!, 'pivot_knee_r');

  const lowerLegLPivots = parts.lower_leg_l!.pivots;
  const lowerLegLKneePivot = getPivot(parts.lower_leg_l!, 'pivot_knee_l');

  // ----- RUN CYCLE PARAMETERS (more extreme than walking) -----
  const legSwing = 70;           // larger leg swing
  const legBend = 80;            // deeper knee bend
  const armSwing = 50;           // bigger arm swing
  const forearmHang = 20;        // natural forward tilt
  const torsoSway = 8;           // more torso twist
  const headBob = 5;             // slightly more head movement
  const bounceAmount = 15;       // vertical bounce (pixels)

  // Vertical bounce: sine wave with positive offset to lift during flight phase
  // Using sin² to keep bounce non‑negative (character lifts up, then returns to neutral)
  const verticalBounce = Math.sin(t * Math.PI) ** 2 * bounceAmount;

  // Legs
  const upperLegR_rot = osc(t, 0) * legSwing;
  const upperLegL_rot = osc(t, 0.5) * legSwing;
  const lowerLegR_rot = clamp(osc(t, 0.15) * -legBend, -legBend, 0);
  const lowerLegL_rot = clamp(osc(t, 0.65) * -legBend, -legBend, 0);

  // Arms (oppose legs)
  const upperArmR_rot = osc(t, 0.5) * armSwing;
  const upperArmL_rot = osc(t, 0) * armSwing;

  // Lower arms: larger range, with elbow flexion (negative = bent back, positive = forward)
  const lowerArmR_rot = forearmHang + osc(t, 0.5) * 50; // range -30 to 70
  const lowerArmL_rot = forearmHang + osc(t, 0) * 50;   // range -30 to 70
  // Clamp to avoid unnatural extremes
  const clampedLowerArmR_rot = clamp(lowerArmR_rot, -30, 70);
  const clampedLowerArmL_rot = clamp(lowerArmL_rot, -30, 70);

  const torso_rot = osc(t, 0.25) * torsoSway;
  const head_rot = osc(t * 2, 0) * headBob;

  // ----- World anchor points (root: pelvis) with bounce -----
  const pelvisWorld = {
    x: CANVAS_SIZE * 0.5,
    y: CANVAS_SIZE * 0.6 - verticalBounce, // apply bounce
  };

  // Shoulder world positions (rotated with torso)
  const torsoRot = torso_rot;
  const torsoPivotOffset = (pivot: { x: number; y: number }) => {
    const dx = (pivot.x - pelvisPivot.x) * finalScale;
    const dy = (pivot.y - pelvisPivot.y) * finalScale;
    return rotatePoint({ x: 0, y: 0 }, { x: dx, y: dy }, torsoRot);
  };
  const shoulderRWorld = {
    x: pelvisWorld.x + torsoPivotOffset(shoulderRPivot).x,
    y: pelvisWorld.y + torsoPivotOffset(shoulderRPivot).y,
  };
  const shoulderLWorld = {
    x: pelvisWorld.x + torsoPivotOffset(shoulderLPivot).x,
    y: pelvisWorld.y + torsoPivotOffset(shoulderLPivot).y,
  };
  const neckWorld = {
    x: pelvisWorld.x + torsoPivotOffset(neckPivot).x,
    y: pelvisWorld.y + torsoPivotOffset(neckPivot).y,
  };
  const headWorld = neckWorld;

  // ----- Compute world positions of elbow/knee -----
  // Upper arm: rotate vector from shoulder to elbow
  const upperArmRVector = {
    x: (upperArmRElbowPivot.x - upperArmRShoulderPivot.x) * finalScale,
    y: (upperArmRElbowPivot.y - upperArmRShoulderPivot.y) * finalScale,
  };
  const rotatedUpperArmR = rotatePoint({ x: 0, y: 0 }, upperArmRVector, upperArmR_rot);
  const elbowRWorld = {
    x: shoulderRWorld.x + rotatedUpperArmR.x,
    y: shoulderRWorld.y + rotatedUpperArmR.y,
  };

  const lowerArmRVector = {
    x: (lowerArmRElbowPivot.x - upperArmRElbowPivot.x) * finalScale,
    y: (lowerArmRElbowPivot.y - upperArmRElbowPivot.y) * finalScale,
  };
  const rotatedLowerArmR = rotatePoint({ x: 0, y: 0 }, lowerArmRVector, clampedLowerArmR_rot);
  const handRWorld = {
    x: elbowRWorld.x + rotatedLowerArmR.x,
    y: elbowRWorld.y + rotatedLowerArmR.y,
  };

  // Left arm
  const upperArmLVector = {
    x: (upperArmLElbowPivot.x - upperArmLShoulderPivot.x) * finalScale,
    y: (upperArmLElbowPivot.y - upperArmLShoulderPivot.y) * finalScale,
  };
  const rotatedUpperArmL = rotatePoint({ x: 0, y: 0 }, upperArmLVector, upperArmL_rot);
  const elbowLWorld = {
    x: shoulderLWorld.x + rotatedUpperArmL.x,
    y: shoulderLWorld.y + rotatedUpperArmL.y,
  };

  const lowerArmLVector = {
    x: (lowerArmLElbowPivot.x - upperArmLElbowPivot.x) * finalScale,
    y: (lowerArmLElbowPivot.y - upperArmLElbowPivot.y) * finalScale,
  };
  const rotatedLowerArmL = rotatePoint({ x: 0, y: 0 }, lowerArmLVector, clampedLowerArmL_rot);
  const handLWorld = {
    x: elbowLWorld.x + rotatedLowerArmL.x,
    y: elbowLWorld.y + rotatedLowerArmL.y,
  };

  // Legs
  const upperLegRVector = {
    x: (upperLegRKneePivot.x - upperLegRHipPivot.x) * finalScale,
    y: (upperLegRKneePivot.y - upperLegRHipPivot.y) * finalScale,
  };
  const rotatedUpperLegR = rotatePoint({ x: 0, y: 0 }, upperLegRVector, upperLegR_rot);
  const kneeRWorld = {
    x: pelvisWorld.x + rotatedUpperLegR.x,
    y: pelvisWorld.y + rotatedUpperLegR.y,
  };

  const lowerLegRVector = {
    x: (lowerLegRKneePivot.x - upperLegRKneePivot.x) * finalScale,
    y: (lowerLegRKneePivot.y - upperLegRKneePivot.y) * finalScale,
  };
  const rotatedLowerLegR = rotatePoint({ x: 0, y: 0 }, lowerLegRVector, lowerLegR_rot);
  const footRWorld = {
    x: kneeRWorld.x + rotatedLowerLegR.x,
    y: kneeRWorld.y + rotatedLowerLegR.y,
  };

  const upperLegLVector = {
    x: (upperLegLKneePivot.x - upperLegLHipPivot.x) * finalScale,
    y: (upperLegLKneePivot.y - upperLegLHipPivot.y) * finalScale,
  };
  const rotatedUpperLegL = rotatePoint({ x: 0, y: 0 }, upperLegLVector, upperLegL_rot);
  const kneeLWorld = {
    x: pelvisWorld.x + rotatedUpperLegL.x,
    y: pelvisWorld.y + rotatedUpperLegL.y,
  };

  const lowerLegLVector = {
    x: (lowerLegLKneePivot.x - upperLegLKneePivot.x) * finalScale,
    y: (lowerLegLKneePivot.y - upperLegLKneePivot.y) * finalScale,
  };
  const rotatedLowerLegL = rotatePoint({ x: 0, y: 0 }, lowerLegLVector, lowerLegL_rot);
  const footLWorld = {
    x: kneeLWorld.x + rotatedLowerLegL.x,
    y: kneeLWorld.y + rotatedLowerLegL.y,
  };

  // ----- Render (layered order: back, torso, front, head) -----
  return (
    <svg
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Back (right) limbs */}
      <Part
        data={parts.upper_leg_r!}
        scale={finalScale}
        anchorX={pelvisWorld.x}
        anchorY={pelvisWorld.y}
        rotateDeg={upperLegR_rot}
        pivotId="pivot_pelvis_r"
      />
      <Part
        data={parts.lower_leg_r!}
        scale={finalScale}
        anchorX={kneeRWorld.x}
        anchorY={kneeRWorld.y}
        rotateDeg={lowerLegR_rot}
        pivotId="pivot_knee_r"
      />
      <Part
        data={parts.upper_arm_r!}
        scale={finalScale}
        anchorX={shoulderRWorld.x}
        anchorY={shoulderRWorld.y}
        rotateDeg={upperArmR_rot}
        pivotId="pivot_shoulder_r"
      />
      <Part
        data={parts.lower_arm_r!}
        scale={finalScale}
        anchorX={elbowRWorld.x}
        anchorY={elbowRWorld.y}
        rotateDeg={clampedLowerArmR_rot}
        pivotId="pivot_elbow_r"
      />

      {/* Torso */}
      <Part
        data={parts.torso!}
        scale={finalScale}
        anchorX={pelvisWorld.x}
        anchorY={pelvisWorld.y}
        rotateDeg={torso_rot}
        pivotId="pivot_pelvis"
      />

      {/* Front (left) limbs */}
      <Part
        data={parts.upper_leg_l!}
        scale={finalScale}
        anchorX={pelvisWorld.x}
        anchorY={pelvisWorld.y}
        rotateDeg={upperLegL_rot}
        pivotId="pivot_pelvis_l"
      />
      <Part
        data={parts.lower_leg_l!}
        scale={finalScale}
        anchorX={kneeLWorld.x}
        anchorY={kneeLWorld.y}
        rotateDeg={lowerLegL_rot}
        pivotId="pivot_knee_l"
      />
      <Part
        data={parts.upper_arm_l!}
        scale={finalScale}
        anchorX={shoulderLWorld.x}
        anchorY={shoulderLWorld.y}
        rotateDeg={upperArmL_rot}
        pivotId="pivot_shoulder_l"
      />
      <Part
        data={parts.lower_arm_l!}
        scale={finalScale}
        anchorX={elbowLWorld.x}
        anchorY={elbowLWorld.y}
        rotateDeg={clampedLowerArmL_rot}
        pivotId="pivot_elbow_l"
      />

      {/* Head */}
      <Part
        data={parts.head_neck!}
        scale={finalScale}
        anchorX={headWorld.x}
        anchorY={headWorld.y}
        rotateDeg={head_rot}
        pivotId="pivot_neck"
      />
    </svg>
  );
};

// Helper functions
const osc = (t: number, phase: number) => Math.sin((t + phase) * Math.PI * 2);
const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const rotatePoint = (
  pivot: { x: number; y: number },
  point: { x: number; y: number },
  angleDeg: number
): { x: number; y: number } => {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: pivot.y + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
};