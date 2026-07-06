// src/remotion/core/schema.ts

import { forkliftSceneConfig, CANVAS_SIZE } from './sceneConfig';

const BODY_PIVOTS = {
  pivot_ground:   { x: 190.11, y: 348.38 },
  pivot_fork_min: { x: 7.8,    y: 301.94 },
  pivot_fork_max: { x: 7.8,    y: 168.94 },
};
const FORK_PIVOTS = {
  pivot_fork_tip:  { x: 1.56,   y: 137.1 },
  pivot_fork_root: { x: 163.05, y: 135.5 },
  pivot_fork_min:  { x: 193.06, y: 135.5 },
};
const PALLET_PIVOTS = {
  pivot_ground:         { x: 191.27, y: 39.2  },
  pivot_fork_root:      { x: 262.36, y: 10.46 },
  pivot_fork_tip:       { x: 283.02, y: 24.14 },
  pivot_top_left_edge:  { x: 3.25,   y: 3.4   },
  pivot_top_right_edge: { x: 261.4,  y: 3.25  },
};

const BODY_VB_H        = 354.63;
const WHEEL_BACK_VB_H  = 78.51;
const WHEEL_FRONT_VB_H = 93.63;

const {
  approachEndFrame,
  alignEndFrame,
  insertEndFrame,
  liftEndFrame,
  departEndFrame,
  startX,
  departEndX,
  groundY,
  palletGroundX,
  scale,
} = forkliftSceneConfig;

const finalScale = (CANVAS_SIZE * 0.7 * scale * 2) / BODY_VB_H;

const palletGroundWorld  = { x: palletGroundX, y: groundY };
const palletForkTipWorld = {
  x: palletGroundWorld.x + (PALLET_PIVOTS.pivot_fork_tip.x  - PALLET_PIVOTS.pivot_ground.x) * finalScale,
  y: palletGroundWorld.y + (PALLET_PIVOTS.pivot_fork_tip.y  - PALLET_PIVOTS.pivot_ground.y) * finalScale,
};
const palletForkRootWorld = {
  x: palletGroundWorld.x + (PALLET_PIVOTS.pivot_fork_root.x - PALLET_PIVOTS.pivot_ground.x) * finalScale,
  y: palletGroundWorld.y + (PALLET_PIVOTS.pivot_fork_root.y - PALLET_PIVOTS.pivot_ground.y) * finalScale,
};

const forkOffsetX        = (BODY_PIVOTS.pivot_fork_min.x - BODY_PIVOTS.pivot_ground.x) * finalScale;
const forkMinOffsetY     = (BODY_PIVOTS.pivot_fork_min.y - BODY_PIVOTS.pivot_ground.y) * finalScale;
const forkMaxOffsetY     = (BODY_PIVOTS.pivot_fork_max.y - BODY_PIVOTS.pivot_ground.y) * finalScale;
const tipLocalOffsetX    = (FORK_PIVOTS.pivot_fork_tip.x  - FORK_PIVOTS.pivot_fork_min.x) * finalScale;
const forkRootLocalOffsetX = (FORK_PIVOTS.pivot_fork_root.x - FORK_PIVOTS.pivot_fork_min.x) * finalScale;
const forkRootLocalOffsetY = (FORK_PIVOTS.pivot_fork_root.y - FORK_PIVOTS.pivot_fork_min.y) * finalScale;

const approachStopX              = palletForkTipWorld.x - forkOffsetX - tipLocalOffsetX;
const insertStopX                = palletForkRootWorld.x - forkOffsetX - forkRootLocalOffsetX;
const alignedForkCarriageOffsetY = (palletForkRootWorld.y - groundY) - forkRootLocalOffsetY;

// Drum geometry — mirrors ForkliftScene's drum sizing logic exactly
const OIL_DRUM_PIVOTS = {
  pivot_ground:            { x: 57.85,  y: 158.75 },
  pivot_bottom_left_edge:  { x: 2.47,   y: 158.75 },
  pivot_bottom_right_edge: { x: 131.88, y: 158.75 },
};
const palletTopLeftWorld = {
  x: palletGroundX + (PALLET_PIVOTS.pivot_top_left_edge.x  - PALLET_PIVOTS.pivot_ground.x) * finalScale,
  y: groundY       + (PALLET_PIVOTS.pivot_top_left_edge.y  - PALLET_PIVOTS.pivot_ground.y) * finalScale,
};
const palletTopRightWorld = {
  x: palletGroundX + (PALLET_PIVOTS.pivot_top_right_edge.x - PALLET_PIVOTS.pivot_ground.x) * finalScale,
  y: groundY       + (PALLET_PIVOTS.pivot_top_right_edge.y - PALLET_PIVOTS.pivot_ground.y) * finalScale,
};
const palletTopWidth   = palletTopRightWorld.x - palletTopLeftWorld.x;
const drumNaturalWidth = Math.abs(OIL_DRUM_PIVOTS.pivot_bottom_right_edge.x - OIL_DRUM_PIVOTS.pivot_bottom_left_edge.x);
const drumScale        = (palletTopWidth * 0.45) / drumNaturalWidth;
const drumScaledWidth  = drumNaturalWidth * drumScale;
const sideMargin       = palletTopWidth * 0.05;

// Drum visual centre positions
const leftDrumCentreX  = palletTopLeftWorld.x  + sideMargin + (drumScaledWidth / 2);
const rightDrumCentreX = palletTopRightWorld.x - sideMargin - (drumScaledWidth / 2);

// pivot_ground is offset from visual centre — correct for this when setting entity x
const drumPivotOffsetFromCentre = (OIL_DRUM_PIVOTS.pivot_ground.x - (OIL_DRUM_PIVOTS.pivot_bottom_left_edge.x + OIL_DRUM_PIVOTS.pivot_bottom_right_edge.x) / 2) * drumScale;
const leftDrumEntityX  = leftDrumCentreX  + drumPivotOffsetFromCentre;
const rightDrumEntityX = rightDrumCentreX + drumPivotOffsetFromCentre;
const drumEntityY      = palletTopLeftWorld.y;
const leftDrumOffsetFromPalletEdge = {
  x: leftDrumEntityX - palletTopLeftWorld.x,
  y: drumEntityY - palletTopLeftWorld.y,
};
const rightDrumOffsetFromPalletEdge = {
  x: rightDrumEntityX - palletTopRightWorld.x,
  y: drumEntityY - palletTopRightWorld.y,
};

const wheelBackDegsPerPx  = 360 / (2 * Math.PI * (WHEEL_BACK_VB_H  / 2) * finalScale);
const wheelFrontDegsPerPx = 360 / (2 * Math.PI * (WHEEL_FRONT_VB_H / 2) * finalScale);

// Shared phase arrays — referenced by both phasedSlide and wheelRotation
const xPhases = [
  { fromX: startX,        toX: approachStopX, start: 0,               duration: approachEndFrame,                easing: 'easeOut'    },
  { fromX: approachStopX, toX: approachStopX, start: approachEndFrame, duration: alignEndFrame - approachEndFrame, easing: 'linear'    },
  { fromX: approachStopX, toX: insertStopX,   start: alignEndFrame,    duration: insertEndFrame - alignEndFrame,   easing: 'easeInOut' },
  { fromX: insertStopX,   toX: insertStopX,   start: insertEndFrame,   duration: liftEndFrame - insertEndFrame,    easing: 'linear'    },
  { fromX: insertStopX,   toX: departEndX,    start: liftEndFrame,     duration: departEndFrame - liftEndFrame,    easing: 'easeIn'    },
];

const yPhases = [
  { from: forkMinOffsetY,             to: forkMinOffsetY,             start: 0,               duration: approachEndFrame                },
  { from: forkMinOffsetY,             to: alignedForkCarriageOffsetY, start: approachEndFrame, duration: alignEndFrame - approachEndFrame },
  { from: alignedForkCarriageOffsetY, to: alignedForkCarriageOffsetY, start: alignEndFrame,    duration: insertEndFrame - alignEndFrame   },
  { from: alignedForkCarriageOffsetY, to: forkMaxOffsetY,             start: insertEndFrame,   duration: liftEndFrame - insertEndFrame    },
];

export const scene = {
  entities: [
    {
      id: 'forklift',
      type: 'forklift',
      transform: { x: startX, y: groundY },
      props: { scale: finalScale },
    },
    {
      id: 'pallet',
      type: 'pallet',
      transform: { x: palletGroundX, y: groundY },
      props: { scale: finalScale },
    },
    {
      id: 'drum1',
      type: 'oil_drum',
      // Pre-positioned at correct world x so constraint only needs to track y.
      // Geometry mirrors ForkliftScene: leftDrumAnchorX + pivotGroundOffsetFromCentre
      transform: { x: leftDrumEntityX, y: drumEntityY },
      props: { scale: drumScale },
    },
    {
      id: 'drum2',
      type: 'oil_drum',
      transform: { x: rightDrumEntityX, y: drumEntityY },
      props: { scale: drumScale },
    },
  ],

  timeline: [
    // Single entry per animation — phasedSlide resolves active phase internally,
    // matching ForkliftScene's [...phases].reverse().find(p => frame >= p.start) pattern.
    {
      target: 'forklift',
      preset: 'phasedSlide',
      params: { phases: xPhases },
    },
    {
      target: 'forklift',
      preset: 'phasedCarriageY',
      params: { phases: yPhases },
    },
    {
      target: 'forklift',
      preset: 'wheelRotation',
      params: { phases: xPhases, degsPerPixel: wheelBackDegsPerPx,  outputKey: 'wheelBackRotDeg'  },
    },
    {
      target: 'forklift',
      preset: 'wheelRotation',
      params: { phases: xPhases, degsPerPixel: wheelFrontDegsPerPx, outputKey: 'wheelFrontRotDeg' },
    },
  ],

  constraints: [
    {
      id: 'fork_to_pallet',
      type: 'attach',
      source: { entityId: 'forklift', pivot: 'pivot_fork_root' },
      target: { entityId: 'pallet',   pivot: 'pivot_fork_root' },
      active: { start: insertEndFrame, end: 999 },
    },
    {
      id: 'pallet_to_drum1',
      type: 'attach',
      source: { entityId: 'pallet', pivot: 'pivot_top_left_edge' },
      target: { entityId: 'drum1',  pivot: 'pivot_ground'        },
      active: { start: 0, end: 999 },
      axis: 'both',
      offset: leftDrumOffsetFromPalletEdge,
    },
    {
      id: 'pallet_to_drum2',
      type: 'attach',
      source: { entityId: 'pallet', pivot: 'pivot_top_right_edge' },
      target: { entityId: 'drum2',  pivot: 'pivot_ground'         },
      active: { start: 0, end: 999 },
      axis: 'both',
      offset: rightDrumOffsetFromPalletEdge,
    },
  ],
};
