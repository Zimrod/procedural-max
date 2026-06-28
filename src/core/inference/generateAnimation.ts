// src/core/inference/generateAnimation.ts
//
// Stage 4: SceneIntent + seed → animation entities, timeline, constraints
//
// For each actor in the intent, builds the correct entity + timeline entries
// based on actor type and action. Same pattern as the hand-authored schemas
// (schema.ts, carSchema.ts) but generated from intent.

import { ActorIntent, SceneIntent } from './scenePrompt';
import { createRng }                from './seededRandom';
import { worldXToPx } from '../world/worldUnits';

// ── SVG file maps ─────────────────────────────────────────────────────────────
// Which SVG files to load per actor variant.
// Extend as you add more vehicles/characters.

const CAR_SVG_MAP: Record<string, { body: string; wheelBack: string; wheelFront: string }> = {
  'car-jeep': {
    body:       'car-jeep/car_body.svg',
    wheelBack:  'car-jeep/wheel_back.svg',
    wheelFront: 'car-jeep/wheel_front.svg',
  },
  car: {
    body:       'car-jeep/car_body.svg',
    wheelBack:  'car-jeep/wheel_back.svg',
    wheelFront: 'car-jeep/wheel_front.svg',
  },
};

// Wheel SVG heights (viewBox h) per variant — needed for rotation calculation
const WHEEL_SVG_H: Record<string, number> = {
  'car-jeep': 80,
  car:        80,
  forklift:   78.51,
};

// ── Per-action builders ───────────────────────────────────────────────────────

const buildCarActor = (actor: ActorIntent, rng: typeof createRng extends (s: number) => infer R ? R : never) => {
  const variant   = actor.actorPrompt.variant ?? 'car-jeep';
  const svgs      = CAR_SVG_MAP[variant] ?? CAR_SVG_MAP.car;
  const wheelH    = WHEEL_SVG_H[variant] ?? 80;
  const wheelR    = (wheelH / 2) * actor.scale;
  const flipX     = actor.actorPrompt.entry === 'right';
  const duration  = actor.endFrame - actor.startFrame;

  // Small random speed variation per car (±15%)
  const speedFactor   = rng.range(0.85, 1.15);
  const effectiveDuration = Math.round(duration * speedFactor);

  const entity = {
    id:   actor.actorPrompt.id,
    type: 'jeep',
    transform: { x: actor.entryX, y: actor.groundY },
    props: {
      scale:         actor.scale,
      bodySvg:       svgs.body,
      wheelBackSvg:  svgs.wheelBack,
      wheelFrontSvg: svgs.wheelFront,
      flipX,
    },
  };

  const timeline = [
    {
      target: actor.actorPrompt.id,
      preset: 'carDrive',
      params: {
        fromX:           actor.entryX,
        toX:             actor.exitX,
        start:           actor.startFrame,
        duration:        effectiveDuration,
        wheelRadius:     wheelR,
        easing:          'easeInOut',
        shakeAmplitude:  0,
      },
    },
  ];

  return { entity, timeline, constraints: [] };
};

const buildForkliftActor = (actor: ActorIntent) => {
  // Import forklift config values
  const BODY_PIVOTS   = { pivot_ground: {x:190.11,y:348.38}, pivot_fork_min:{x:7.8,y:301.94}, pivot_fork_max:{x:7.8,y:168.94} };
  const FORK_PIVOTS   = { pivot_fork_tip:{x:1.56,y:137.1}, pivot_fork_root:{x:163.05,y:135.5}, pivot_fork_min:{x:193.06,y:135.5} };
  const PALLET_PIVOTS = { pivot_ground:{x:191.27,y:39.2}, pivot_fork_root:{x:262.36,y:10.46}, pivot_fork_tip:{x:283.02,y:24.14}, pivot_top_left_edge:{x:3.25,y:3.4}, pivot_top_right_edge:{x:261.4,y:3.25} };
  const BODY_VB_H = 354.63;
  const s = actor.scale;

  const palletGroundX = worldXToPx(8); // place pallet at centre-left of scene
  const groundY       = actor.groundY;

  const palletGroundWorld = { x: palletGroundX, y: groundY };
  const palletForkTipWorld = {
    x: palletGroundWorld.x + (PALLET_PIVOTS.pivot_fork_tip.x - PALLET_PIVOTS.pivot_ground.x) * s,
    y: palletGroundWorld.y + (PALLET_PIVOTS.pivot_fork_tip.y - PALLET_PIVOTS.pivot_ground.y) * s,
  };
  const palletForkRootWorld = {
    x: palletGroundWorld.x + (PALLET_PIVOTS.pivot_fork_root.x - PALLET_PIVOTS.pivot_ground.x) * s,
    y: palletGroundWorld.y + (PALLET_PIVOTS.pivot_fork_root.y - PALLET_PIVOTS.pivot_ground.y) * s,
  };

  const forkOffsetX        = (BODY_PIVOTS.pivot_fork_min.x - BODY_PIVOTS.pivot_ground.x) * s;
  const forkMinOffsetY     = (BODY_PIVOTS.pivot_fork_min.y - BODY_PIVOTS.pivot_ground.y) * s;
  const forkMaxOffsetY     = (BODY_PIVOTS.pivot_fork_max.y - BODY_PIVOTS.pivot_ground.y) * s;
  const tipLocalOffsetX    = (FORK_PIVOTS.pivot_fork_tip.x  - FORK_PIVOTS.pivot_fork_min.x) * s;
  const forkRootOffsetX    = (FORK_PIVOTS.pivot_fork_root.x - FORK_PIVOTS.pivot_fork_min.x) * s;
  const forkRootOffsetY    = (FORK_PIVOTS.pivot_fork_root.y - FORK_PIVOTS.pivot_fork_min.y) * s;

  const approachStopX = palletForkTipWorld.x - forkOffsetX - tipLocalOffsetX;
  const insertStopX   = palletForkRootWorld.x - forkOffsetX - forkRootOffsetX;
  const alignedY      = (palletForkRootWorld.y - groundY) - forkRootOffsetY;

  const f0 = actor.startFrame;
  const xPhases = [
    { fromX: actor.entryX,   toX: approachStopX, start: f0,      duration: 60,  easing: 'easeOut'   },
    { fromX: approachStopX,  toX: approachStopX, start: f0+60,   duration: 40,  easing: 'linear'    },
    { fromX: approachStopX,  toX: insertStopX,   start: f0+100,  duration: 40,  easing: 'easeInOut' },
    { fromX: insertStopX,    toX: insertStopX,   start: f0+140,  duration: 50,  easing: 'linear'    },
    { fromX: insertStopX,    toX: actor.exitX,   start: f0+190,  duration: 120, easing: 'easeIn'    },
  ];
  const yPhases = [
    { from: forkMinOffsetY, to: forkMinOffsetY, start: f0,     duration: 60 },
    { from: forkMinOffsetY, to: alignedY,        start: f0+60,  duration: 40 },
    { from: alignedY,       to: alignedY,        start: f0+100, duration: 40 },
    { from: alignedY,       to: forkMaxOffsetY,  start: f0+140, duration: 50 },
  ];

  const WHEEL_BACK_VB_H  = 78.51;
  const WHEEL_FRONT_VB_H = 93.63;
  const wbDeg = 360 / (2 * Math.PI * (WHEEL_BACK_VB_H  / 2) * s);
  const wfDeg = 360 / (2 * Math.PI * (WHEEL_FRONT_VB_H / 2) * s);

  // Pallet drum offsets (simplified — same as schema.ts)
  const palletTopLeft  = { x: palletGroundX + (PALLET_PIVOTS.pivot_top_left_edge.x  - PALLET_PIVOTS.pivot_ground.x) * s, y: groundY + (PALLET_PIVOTS.pivot_top_left_edge.y  - PALLET_PIVOTS.pivot_ground.y) * s };
  const palletTopRight = { x: palletGroundX + (PALLET_PIVOTS.pivot_top_right_edge.x - PALLET_PIVOTS.pivot_ground.x) * s, y: groundY + (PALLET_PIVOTS.pivot_top_right_edge.y - PALLET_PIVOTS.pivot_ground.y) * s };
  const palletTopWidth = palletTopRight.x - palletTopLeft.x;
  const OIL_DRUM = { g:{x:57.85,y:158.75}, bl:{x:2.47,y:158.75}, br:{x:131.88,y:158.75} };
  const drumNW    = Math.abs(OIL_DRUM.br.x - OIL_DRUM.bl.x);
  const dScale    = (palletTopWidth * 0.45) / drumNW;
  const dWidth    = drumNW * dScale;
  const dMargin   = palletTopWidth * 0.05;
  const drumOff   = (OIL_DRUM.g.x - (OIL_DRUM.bl.x + OIL_DRUM.br.x) / 2) * dScale;
  const leftDrumX  = palletTopLeft.x  + dMargin + dWidth / 2 + drumOff;
  const rightDrumX = palletTopRight.x - dMargin - dWidth / 2 + drumOff;
  const drumY = palletTopLeft.y;

  const entities = [
    { id: actor.actorPrompt.id, type: 'forklift', transform: { x: actor.entryX, y: groundY }, props: { scale: s } },
    { id: `${actor.actorPrompt.id}_pallet`, type: 'pallet', transform: { x: palletGroundX, y: groundY }, props: { scale: s } },
    { id: `${actor.actorPrompt.id}_drum1`,  type: 'oil_drum', transform: { x: leftDrumX,  y: drumY }, props: { scale: dScale } },
    { id: `${actor.actorPrompt.id}_drum2`,  type: 'oil_drum', transform: { x: rightDrumX, y: drumY }, props: { scale: dScale } },
  ];

  const timeline = [
    { target: actor.actorPrompt.id, preset: 'phasedSlide',    params: { phases: xPhases } },
    { target: actor.actorPrompt.id, preset: 'phasedCarriageY',params: { phases: yPhases } },
    { target: actor.actorPrompt.id, preset: 'wheelRotation',  params: { phases: xPhases, degsPerPixel: wbDeg, outputKey: 'wheelBackRotDeg'  } },
    { target: actor.actorPrompt.id, preset: 'wheelRotation',  params: { phases: xPhases, degsPerPixel: wfDeg, outputKey: 'wheelFrontRotDeg' } },
  ];

  const constraints = [
    { id: `fork_pallet_${actor.actorPrompt.id}`, type: 'attach', source: { entityId: actor.actorPrompt.id, pivot: 'pivot_fork_root' }, target: { entityId: `${actor.actorPrompt.id}_pallet`, pivot: 'pivot_fork_root' }, active: { start: f0+140, end: 999 } },
    { id: `pallet_drum1_${actor.actorPrompt.id}`, type: 'attach', source: { entityId: `${actor.actorPrompt.id}_pallet`, pivot: 'pivot_top_left_edge' },  target: { entityId: `${actor.actorPrompt.id}_drum1`, pivot: 'pivot_ground' }, active: { start: 0, end: 999 }, axis: 'both', offset: { x: leftDrumX - palletTopLeft.x,  y: drumY - palletTopLeft.y  } },
    { id: `pallet_drum2_${actor.actorPrompt.id}`, type: 'attach', source: { entityId: `${actor.actorPrompt.id}_pallet`, pivot: 'pivot_top_right_edge' }, target: { entityId: `${actor.actorPrompt.id}_drum2`, pivot: 'pivot_ground' }, active: { start: 0, end: 999 }, axis: 'both', offset: { x: rightDrumX - palletTopRight.x, y: drumY - palletTopRight.y } },
  ];

  return { entities, timeline, constraints };
};

// ── Main generator ────────────────────────────────────────────────────────────

export const generateAnimation = (intent: SceneIntent, seed: number) => {
  const rng = createRng(seed + 1000); // offset seed so layout and animation RNG don't correlate

  const allEntities:    any[] = [];
  const allTimeline:    any[] = [];
  const allConstraints: any[] = [];

  for (const actorIntent of intent.actorIntents) {
    const type = actorIntent.actorPrompt.type;

    let result: { entity?: any; entities?: any[]; timeline: any[]; constraints: any[] };

    if (type === 'car') {
      result = buildCarActor(actorIntent, rng);
      allEntities.push(result.entity);
    } else if (type === 'forklift') {
      result = buildForkliftActor(actorIntent);
      allEntities.push(...(result.entities ?? []));
    } else {
      console.warn(`[generateAnimation] No builder for actor type: "${type}"`);
      continue;
    }

    allTimeline.push(...result.timeline);
    allConstraints.push(...result.constraints);
  }

  return {
    entities:    allEntities,
    timeline:    allTimeline,
    constraints: allConstraints,
  };
};