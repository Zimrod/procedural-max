// src/rigs/human_side/HumanSideRig.tsx
//
// Stateless SVG rig for a side-view human character.
// Receives ALL animation values as props — no internal frame reading.
// The schema + presets drive everything; this component only renders.
//
// Renders a <g> not an <svg> so it composes inside any existing SVG canvas.
// Wrap in <svg width="100%" height="100%" style={{position:'absolute',...}}> at the scene level.

import React, { useEffect, useState } from 'react';
import { staticFile, delayRender, continueRender } from 'remotion';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PartData {
  svgText: string;
  viewBox: { w: number; h: number };
  pivots: Map<string, { x: number; y: number }>;
}

export type HumanMode = 'idle' | 'walk' | 'point';

type Props = {
  x: number;
  y: number;                        // world position of pivot_pelvis
  scale?: number;                   // character scale multiplier (default 1)

  // ── State ────────────────────────────────────────────────────────────────
  mode?: HumanMode;                 // current behaviour state

  // ── Walk ─────────────────────────────────────────────────────────────────
  walkPhase?: number;               // 0→1 looping, drives all limb angles
  walkBlend?: number;               // 0→1, blends walk motion in/out (default 1 when walk)

  // ── Point ────────────────────────────────────────────────────────────────
  pointAngle?: number;              // upper arm target angle (degrees, -130 = straight up-left)
  pointBlend?: number;              // 0→1, blends point arm in (default 1 when point)

  // ── Asset folder ─────────────────────────────────────────────────────────
  folder?: string;                  // staticFile folder (default 'human-side')
};

// ─── SVG helpers (same parsePart as WalkCycle) ────────────────────────────────

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

const getPivot = (
  part: PartData,
  id: string,
  fallback?: { x: number; y: number }
) => {
  const p = part.pivots.get(id);
  if (!p) {
    if (fallback) return fallback;
    throw new Error(`Missing pivot "${id}"`);
  }
  return p;
};

// ─── Part renderer (unchanged from WalkCycle) ────────────────────────────────

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

  const tx = anchorX - pivot.x * scale;
  const ty = anchorY - pivot.y * scale;

  return (
    <g transform={`rotate(${rotateDeg}, ${anchorX}, ${anchorY})`}>
      <g transform={`translate(${tx}, ${ty}) scale(${scale})`}>
        <g dangerouslySetInnerHTML={{ __html: data.svgText }} />
      </g>
    </g>
  );
};

// ─── Angle helpers ────────────────────────────────────────────────────────────

// Asymmetric hip swing: forward unrestricted, backward capped
const upperLegAngle = (t: number, phase: number, maxForward = 40, maxBackward = 20) => {
  const raw = Math.sin((t + phase) * Math.PI * 2);
  return raw >= 0 ? raw * maxForward : raw * maxBackward;
};

// Knee: deep bend on swing phase, slight extension on stance
const lowerLegAngle = (t: number, phase: number, frontBend = -60, backExtend = 20) => {
  const raw = Math.sin((t + phase) * Math.PI * 2);
  return raw >= 0 ? raw * frontBend : raw * backExtend;
};

// Linear interpolation between two angles
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─── Component ────────────────────────────────────────────────────────────────

const PART_NAMES = [
  'head_neck',
  'torso',
  'upper_arm_r', 'upper_arm_l',
  'lower_arm_r', 'lower_arm_l',
  'upper_leg_r', 'upper_leg_l',
  'lower_leg_r', 'lower_leg_l',
] as const;
type PartName = typeof PART_NAMES[number];

export const HumanSideRig: React.FC<Props> = ({
  x,
  y,
  scale = 1,
  mode = 'idle',
  walkPhase = 0,
  walkBlend = 1,
  pointAngle = -130,
  pointBlend = 0,
  folder = 'human-side',
}) => {
  const [parts, setParts] = useState<Partial<Record<PartName, PartData>>>({});

  useEffect(() => {
    const handle = delayRender('HumanSideRig: loading SVGs');
    Promise.all(
      PART_NAMES.map(async (name) => {
        const res  = await fetch(staticFile(`${folder}/${name}.svg`));
        const text = await res.text();
        return [name, parsePart(text, name)] as [PartName, PartData];
      })
    )
      .then((entries) => {
        setParts(Object.fromEntries(entries));
        continueRender(handle);
      })
      .catch((err) => {
        console.error('HumanSideRig: SVG load failed', err);
        continueRender(handle);
      });
  }, [folder]);

  if (PART_NAMES.some((n) => !parts[n])) return null;

  // ── Scale ────────────────────────────────────────────────────────────────
  // Derive scale from natural body height so scale=1 = sensible character size.
  // scale prop is a multiplier: 1 = default size, 0.5 = half size, etc.
  // CANVAS_SIZE * 0.4 makes the character ~40% of canvas height at scale=1.
  const TOTAL_BODY_HEIGHT =
    parts.head_neck!.viewBox.h +
    parts.torso!.viewBox.h +
    parts.upper_leg_r!.viewBox.h +
    parts.lower_leg_r!.viewBox.h;

  const CANVAS_SIZE = 800; // match your scene canvas
  const finalScale = (CANVAS_SIZE * 0.4 / TOTAL_BODY_HEIGHT) * scale;

  // ── Pivot data ───────────────────────────────────────────────────────────
  const pelvisPivot    = getPivot(parts.torso!, 'pivot_pelvis');
  const shoulderRPivot = getPivot(parts.torso!, 'pivot_shoulder_r', { x: 20,  y: -30 });
  const shoulderLPivot = getPivot(parts.torso!, 'pivot_shoulder_l', { x: -20, y: -30 });
  const neckPivot      = getPivot(parts.torso!, 'pivot_neck',       { x: 0,   y: -80 });

  const uARShoulderPivot = getPivot(parts.upper_arm_r!, 'pivot_shoulder_r');
  const uARElbowPivot    = getPivot(parts.upper_arm_r!, 'pivot_elbow_r');
  const uALShoulderPivot = getPivot(parts.upper_arm_l!, 'pivot_shoulder_l');
  const uALElbowPivot    = getPivot(parts.upper_arm_l!, 'pivot_elbow_l');
  const lARElbowPivot    = getPivot(parts.lower_arm_r!, 'pivot_elbow_r');
  const lALElbowPivot    = getPivot(parts.lower_arm_l!, 'pivot_elbow_l');

  const uLRHipPivot  = getPivot(parts.upper_leg_r!, 'pivot_pelvis_r');
  const uLRKneePivot = getPivot(parts.upper_leg_r!, 'pivot_knee_r');
  const uLLHipPivot  = getPivot(parts.upper_leg_l!, 'pivot_pelvis_l');
  const uLLKneePivot = getPivot(parts.upper_leg_l!, 'pivot_knee_l');
  const lLRKneePivot = getPivot(parts.lower_leg_r!, 'pivot_knee_r');
  const lLLKneePivot = getPivot(parts.lower_leg_l!, 'pivot_knee_l');

  // ── Walk angles (suppressed to 0 when not walking, blended by walkBlend) ──
  const t = walkPhase;

  const walkUpperLegR = upperLegAngle(t, 0.0) * walkBlend;
  const walkUpperLegL = upperLegAngle(t, 0.5) * walkBlend;
  const walkLowerLegR = lowerLegAngle(t, 0.15) * walkBlend;
  const walkLowerLegL = lowerLegAngle(t, 0.65) * walkBlend;
  const walkArmR      = Math.sin((t + 0.5) * Math.PI * 2) * 30 * walkBlend;
  const walkArmL      = Math.sin((t + 0.0) * Math.PI * 2) * 30 * walkBlend;
  const walkForearmR  = Math.sin((t + 0.5) * Math.PI * 2) * 20 * walkBlend;
  const walkForearmL  = Math.sin((t + 0.0) * Math.PI * 2) * 20 * walkBlend;

  // ── Idle: subtle breathing only ───────────────────────────────────────────
  // Use walkPhase=0 so breathing is a slow independent oscillation.
  // We drive breathing from frame directly — but the rig is stateless,
  // so breathing is driven by a slow walkPhase fed from an idleBreath preset.
  // For now: small constant sway on torso when idle.
  const idleTorsoSway = mode === 'idle' ? Math.sin(t * Math.PI * 2) * 1.5 : 0;

  // ── Point angles: left arm raises to pointAngle, blended by pointBlend ───
  // pointAngle is negative (anti-clockwise from rest = arm raised forward/up).
  // Right arm hangs naturally at rest angle during point.
  const pointUpperArmL  = lerp(0, pointAngle, pointBlend);
  const pointForearmL   = lerp(0, -20, pointBlend);        // forearm extends slightly
  const pointUpperArmR  = lerp(0, 20,  pointBlend);        // right arm drops back naturally
  const pointForearmR   = lerp(15, 5,  pointBlend);

  // ── Final angles: walk + point additive, clamped ─────────────────────────
  const upperLegR_rot = walkUpperLegR;
  const upperLegL_rot = walkUpperLegL;
  const lowerLegR_rot = walkLowerLegR;
  const lowerLegL_rot = walkLowerLegL;

  const upperArmR_rot = walkArmR  + pointUpperArmR;
  const upperArmL_rot = walkArmL  + pointUpperArmL;
  const lowerArmR_rot = 15 + walkForearmR + pointForearmR;
  const lowerArmL_rot = 15 + walkForearmL + pointForearmL;

  const torso_rot = Math.sin((t + 0.25) * Math.PI * 2) * 2 * walkBlend + idleTorsoSway;
  const head_rot  = Math.sin(t * Math.PI * 4) * 1 * walkBlend;

  // ── Pelvis vertical bob (suppressed when not walking) ────────────────────
  const pelvisBob = Math.abs(Math.sin(t * Math.PI * 2)) * 6 * walkBlend;
  const pelvisWorld = { x, y: y - pelvisBob };

  // ── World positions ───────────────────────────────────────────────────────
  const torsoPivotWorld = (pivot: { x: number; y: number }) => {
    const dx = (pivot.x - pelvisPivot.x) * finalScale;
    const dy = (pivot.y - pelvisPivot.y) * finalScale;
    const r  = rotatePoint({ x: 0, y: 0 }, { x: dx, y: dy }, torso_rot);
    return { x: pelvisWorld.x + r.x, y: pelvisWorld.y + r.y };
  };

  const shoulderRWorld = torsoPivotWorld(shoulderRPivot);
  const shoulderLWorld = torsoPivotWorld(shoulderLPivot);
  const neckWorld      = torsoPivotWorld(neckPivot);

  const elbowRWorld = addVec(
    shoulderRWorld,
    rotatePoint({ x: 0, y: 0 }, scaleVec(vecBetween(uARShoulderPivot, uARElbowPivot), finalScale), upperArmR_rot)
  );
  const elbowLWorld = addVec(
    shoulderLWorld,
    rotatePoint({ x: 0, y: 0 }, scaleVec(vecBetween(uALShoulderPivot, uALElbowPivot), finalScale), upperArmL_rot)
  );
  const kneeRWorld = addVec(
    pelvisWorld,
    rotatePoint({ x: 0, y: 0 }, scaleVec(vecBetween(uLRHipPivot, uLRKneePivot), finalScale), upperLegR_rot)
  );
  const kneeLWorld = addVec(
    pelvisWorld,
    rotatePoint({ x: 0, y: 0 }, scaleVec(vecBetween(uLLHipPivot, uLLKneePivot), finalScale), upperLegL_rot)
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <svg
      style={{ position: 'absolute', overflow: 'visible', top: 0, left: 0 }}
      width="100%"
      height="100%"
    >
    <g>
      {/* Back limbs */}
      <Part data={parts.upper_leg_r!} scale={finalScale} anchorX={pelvisWorld.x} anchorY={pelvisWorld.y} rotateDeg={upperLegR_rot} pivotId="pivot_pelvis_r" />
      <Part data={parts.lower_leg_r!} scale={finalScale} anchorX={kneeRWorld.x}  anchorY={kneeRWorld.y}  rotateDeg={lowerLegR_rot} pivotId="pivot_knee_r" />
      <Part data={parts.upper_arm_r!} scale={finalScale} anchorX={shoulderRWorld.x} anchorY={shoulderRWorld.y} rotateDeg={upperArmR_rot} pivotId="pivot_shoulder_r" />
      <Part data={parts.lower_arm_r!} scale={finalScale} anchorX={elbowRWorld.x}    anchorY={elbowRWorld.y}    rotateDeg={lowerArmR_rot} pivotId="pivot_elbow_r" />

      {/* Torso */}
      <Part data={parts.torso!} scale={finalScale} anchorX={pelvisWorld.x} anchorY={pelvisWorld.y} rotateDeg={torso_rot} pivotId="pivot_pelvis" />

      {/* Front limbs */}
      <Part data={parts.lower_leg_l!} scale={finalScale} anchorX={kneeLWorld.x}  anchorY={kneeLWorld.y}  rotateDeg={lowerLegL_rot} pivotId="pivot_knee_l" />
      <Part data={parts.upper_leg_l!} scale={finalScale} anchorX={pelvisWorld.x} anchorY={pelvisWorld.y} rotateDeg={upperLegL_rot} pivotId="pivot_pelvis_l" />
      <Part data={parts.upper_arm_l!} scale={finalScale} anchorX={shoulderLWorld.x} anchorY={shoulderLWorld.y} rotateDeg={upperArmL_rot} pivotId="pivot_shoulder_l" />
      <Part data={parts.lower_arm_l!} scale={finalScale} anchorX={elbowLWorld.x}    anchorY={elbowLWorld.y}    rotateDeg={lowerArmL_rot} pivotId="pivot_elbow_l" />

      {/* Head */}
      <Part data={parts.head_neck!} scale={finalScale} anchorX={neckWorld.x} anchorY={neckWorld.y} rotateDeg={head_rot} pivotId="pivot_neck" />
    </g>
    </svg>
  );
};

// ─── Vector helpers ───────────────────────────────────────────────────────────

const rotatePoint = (
  pivot: { x: number; y: number },
  point: { x: number; y: number },
  angleDeg: number
): { x: number; y: number } => {
  const rad = (angleDeg * Math.PI) / 180;
  const dx  = point.x - pivot.x;
  const dy  = point.y - pivot.y;
  return {
    x: pivot.x + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: pivot.y + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
};

const vecBetween = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  ({ x: b.x - a.x, y: b.y - a.y });

const scaleVec = (v: { x: number; y: number }, s: number) =>
  ({ x: v.x * s, y: v.y * s });

const addVec = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  ({ x: a.x + b.x, y: a.y + b.y });