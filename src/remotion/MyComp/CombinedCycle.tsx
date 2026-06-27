// src/remotion/MyComp/CombinedCycle.tsx
import React, { useEffect, useState } from 'react';
import {
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  delayRender,
  continueRender,
  interpolate,
} from 'remotion';

const CANVAS_SIZE = 800;

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

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
    pivots.set('pivot_fallback', { x: viewBox.w / 2, y: viewBox.h / 2 });
  }

  return {
    svgText: svgEl.innerHTML,
    viewBox,
    pivots,
  };
};

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

// Angle functions that take an intensity factor (0 = walk, 1 = run)
const upperLegAngle = (t: number, phase: number, intensity: number) => {
  const raw = Math.sin((t + phase) * Math.PI * 2);
  const maxForward = interpolate(intensity, [0, 1], [40, 60]);
  const maxBackward = interpolate(intensity, [0, 1], [20, 30]);
  if (raw >= 0) return raw * maxForward;
  return raw * maxBackward;
};

const lowerLegAngle = (t: number, phase: number, intensity: number) => {
  const raw = Math.sin((t + phase) * Math.PI * 2);
  const frontBend = interpolate(intensity, [0, 1], [-60, -70]);
  const backExtend = interpolate(intensity, [0, 1], [20, 30]);
  if (raw >= 0) return raw * frontBend;
  return raw * backExtend;
};

// Helper
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

type CombinedCycleProps = {
  totalDurationSeconds?: number;  // Total duration of the sequence (walk → run → stop)
  walkDurationSeconds?: number;   // How long to walk (default 4s)
  runDurationSeconds?: number;    // How long to run (default 3s)
  characterScale?: number;
  onComplete?: () => void;
};

export const CombinedCycle: React.FC<CombinedCycleProps> = ({
  totalDurationSeconds,
  walkDurationSeconds = 4,
  runDurationSeconds = 3,
  characterScale = 1,
  onComplete,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // const finalScale = 0.7;

  // If legs are cut off at the bottom, move this closer to 0 (top of canvas)
  // Current might be 600; try 400 or 500.
  // const pelvisWorld = { 
  //   x: CANVAS_SIZE / 2, 
  //   y: 400 
  // };

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

  // ✅ Hook 1: Load SVGs
  useEffect(() => {
    const handle = delayRender('Loading cycle SVGs');
    Promise.all(
      partNames.map(async (name) => {
        const res = await fetch(staticFile(`human-side/${name}.svg`));
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

  // ✅ Hook 2: Notify when complete
  const totalSecs = totalDurationSeconds || (walkDurationSeconds + runDurationSeconds + 1);
  const totalFrames = totalSecs * fps;

  useEffect(() => {
    if (frame >= totalFrames - 1 && onComplete) {
      onComplete();
    }
  }, [frame, totalFrames, onComplete]);

  // ✅ EARLY RETURN after all hooks – this is allowed
  if (partNames.some((n) => !parts[n])) return null;

  // Rest of the component logic (same as before)...
  const walkFrames = walkDurationSeconds * fps;
  const runFrames = runDurationSeconds * fps;
  const stopFrames = fps * 1;

  // Determine current phase (0 = walking, 1 = running, 2 = standing)
  let phase = 0;
  let phaseProgress = 0;
  let intensity = 0;
  let stopProgress = 0;

  if (frame < walkFrames) {
    phase = 0; // walking
    phaseProgress = frame / walkFrames;
    intensity = interpolate(phaseProgress, [0, 1], [0, 0.3]); // walk intensity stays low
  } else if (frame < walkFrames + runFrames) {
    phase = 1; // running
    phaseProgress = (frame - walkFrames) / runFrames;
    intensity = interpolate(phaseProgress, [0, 1], [0.5, 1]);
  } else {
    phase = 2; // standing still
    stopProgress = Math.min(1, (frame - (walkFrames + runFrames)) / stopFrames);
  }

  // For the standing phase, we gradually reduce movement
  const isStanding = phase === 2;

  // Calculate cycle t value (for animation within the cycle)
  let cycleDuration = 1;
  let t = 0;

  if (isStanding) {
    // When standing, t goes to 0 (neutral pose)
    t = 0;
  } else {
    // Adjust cycle speed: running is faster
    const cycleSpeed = phase === 0 ? 1 : 1.6;
    cycleDuration = (phase === 0 ? 1.2 : 0.7) / cycleSpeed;
    const cycleFrames = cycleDuration * fps;
    const cycleTime = (frame % cycleFrames) / cycleFrames;
    t = cycleTime;
  }

  // Apply standing fade to all movement parameters
  const standMultiplier = isStanding ? Math.max(0, 1 - stopProgress * 2) : 1;

  // Calculate angles with intensity and standing multiplier
  const upperLegR_rot = upperLegAngle(t, 0.0, intensity) * standMultiplier;
  const upperLegL_rot = upperLegAngle(t, 0.5, intensity) * standMultiplier;
  const lowerLegR_rot = lowerLegAngle(t, 0.15, intensity) * standMultiplier;
  const lowerLegL_rot = lowerLegAngle(t, 0.65, intensity) * standMultiplier;

  // Arm swing
  const maxArmSwing = interpolate(intensity, [0, 1], [30, 45]) * standMultiplier;
  const maxForearmSwing = interpolate(intensity, [0, 1], [20, 35]) * standMultiplier;
  const forearmHang = interpolate(intensity, [0, 1], [15, 25]) * standMultiplier;
  const torsoLean = interpolate(intensity, [0, 1], [2, 8]) * standMultiplier;
  const headBobAmplitude = interpolate(intensity, [0, 1], [1, 3]) * standMultiplier;

  const upperArmR_rot = Math.sin((t + 0.5) * Math.PI * 2) * maxArmSwing;
  const upperArmL_rot = Math.sin((t + 0.0) * Math.PI * 2) * maxArmSwing;
  const lowerArmR_rot = forearmHang + Math.sin((t + 0.5) * Math.PI * 2) * maxForearmSwing;
  const lowerArmL_rot = forearmHang + Math.sin((t + 0.0) * Math.PI * 2) * maxForearmSwing;
  const torso_rot = Math.sin((t + 0.25) * Math.PI * 2) * torsoLean;
  const head_rot = Math.sin(t * Math.PI * 4) * headBobAmplitude;

  // Pelvis bounce
  const maxPelvisBob = interpolate(intensity, [0, 1], [6, 12]) * standMultiplier;
  const pelvisBob = Math.abs(Math.sin(t * Math.PI * 2)) * maxPelvisBob;
  const pelvisWorld = {
    x: CANVAS_SIZE * 0.5,
    y: CANVAS_SIZE * 0.6 - pelvisBob,
  };

  const TOTAL_BODY_HEIGHT =
    parts.head_neck!.viewBox.h +
    parts.torso!.viewBox.h +
    parts.upper_leg_r!.viewBox.h +
    parts.lower_leg_r!.viewBox.h;

  const baseScale = CANVAS_SIZE / TOTAL_BODY_HEIGHT;
  const finalScale = baseScale * characterScale * 0.9;

  const getPivot = (part: PartData, id: string, fallback?: { x: number; y: number }) => {
    const p = part.pivots.get(id);
    if (!p) {
      if (fallback) return fallback;
      throw new Error(`Part missing pivot "${id}"`);
    }
    return p;
  };

  // Pivot data (same as original)
  const pelvisPivot = getPivot(parts.torso!, 'pivot_pelvis');
  const shoulderRFallback = { x: 20, y: -30 };
  const shoulderLFallback = { x: -20, y: -30 };
  const shoulderRPivot = getPivot(parts.torso!, 'pivot_shoulder_r', shoulderRFallback);
  const shoulderLPivot = getPivot(parts.torso!, 'pivot_shoulder_l', shoulderLFallback);
  const neckFallback = { x: 0, y: -80 };
  const neckPivot = getPivot(parts.torso!, 'pivot_neck', neckFallback);

  const upperArmRShoulderPivot = getPivot(parts.upper_arm_r!, 'pivot_shoulder_r');
  const upperArmRElbowPivot = getPivot(parts.upper_arm_r!, 'pivot_elbow_r');
  const upperArmLShoulderPivot = getPivot(parts.upper_arm_l!, 'pivot_shoulder_l');
  const upperArmLElbowPivot = getPivot(parts.upper_arm_l!, 'pivot_elbow_l');
  const lowerArmRElbowPivot = getPivot(parts.lower_arm_r!, 'pivot_elbow_r');
  const lowerArmLElbowPivot = getPivot(parts.lower_arm_l!, 'pivot_elbow_l');

  const upperLegRHipPivot = getPivot(parts.upper_leg_r!, 'pivot_pelvis_r');
  const upperLegRKneePivot = getPivot(parts.upper_leg_r!, 'pivot_knee_r');
  const upperLegLHipPivot = getPivot(parts.upper_leg_l!, 'pivot_pelvis_l');
  const upperLegLKneePivot = getPivot(parts.upper_leg_l!, 'pivot_knee_l');
  const lowerLegRKneePivot = getPivot(parts.lower_leg_r!, 'pivot_knee_r');
  const lowerLegLKneePivot = getPivot(parts.lower_leg_l!, 'pivot_knee_l');

  const torsoPivotOffset = (pivot: { x: number; y: number }) => {
    const dx = (pivot.x - pelvisPivot.x) * finalScale;
    const dy = (pivot.y - pelvisPivot.y) * finalScale;
    return rotatePoint({ x: 0, y: 0 }, { x: dx, y: dy }, torso_rot);
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

  // Upper arm positions
  const upperArmRVector = {
    x: (upperArmRElbowPivot.x - upperArmRShoulderPivot.x) * finalScale,
    y: (upperArmRElbowPivot.y - upperArmRShoulderPivot.y) * finalScale,
  };
  const rotatedUpperArmR = rotatePoint({ x: 0, y: 0 }, upperArmRVector, upperArmR_rot);
  const elbowRWorld = {
    x: shoulderRWorld.x + rotatedUpperArmR.x,
    y: shoulderRWorld.y + rotatedUpperArmR.y,
  };

  const upperArmLVector = {
    x: (upperArmLElbowPivot.x - upperArmLShoulderPivot.x) * finalScale,
    y: (upperArmLElbowPivot.y - upperArmLShoulderPivot.y) * finalScale,
  };
  const rotatedUpperArmL = rotatePoint({ x: 0, y: 0 }, upperArmLVector, upperArmL_rot);
  const elbowLWorld = {
    x: shoulderLWorld.x + rotatedUpperArmL.x,
    y: shoulderLWorld.y + rotatedUpperArmL.y,
  };

  const lowerArmRVector = {
    x: (lowerArmRElbowPivot.x - upperArmRElbowPivot.x) * finalScale,
    y: (lowerArmRElbowPivot.y - upperArmRElbowPivot.y) * finalScale,
  };
  const lowerArmLVector = {
    x: (lowerArmLElbowPivot.x - upperArmLElbowPivot.x) * finalScale,
    y: (lowerArmLElbowPivot.y - upperArmLElbowPivot.y) * finalScale,
  };

  // Leg positions
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
        rotateDeg={lowerArmR_rot}
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
        data={parts.lower_leg_l!}
        scale={finalScale}
        anchorX={kneeLWorld.x}
        anchorY={kneeLWorld.y}
        rotateDeg={lowerLegL_rot}
        pivotId="pivot_knee_l"
      />
      <Part
        data={parts.upper_leg_l!}
        scale={finalScale}
        anchorX={pelvisWorld.x}
        anchorY={pelvisWorld.y}
        rotateDeg={upperLegL_rot}
        pivotId="pivot_pelvis_l"
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
        rotateDeg={lowerArmL_rot}
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