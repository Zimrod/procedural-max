// src/remotion/core/humanScene.schema.ts
//
// Schema fragment for the idle → walk → point sequence.
// Drop the entity + timeline entries into your main scene schema.
//
// Timeline at 30fps:
//   f0   – f60:  idle  (2s)
//   f60  – f210: walk  (5s)
//   f210+:        point (holds)

const FPS = 30;

const IDLE_START  = 0;
const WALK_START  = 2  * FPS;   // f60
const POINT_START = 7  * FPS;   // f210
const POINT_END   = 12 * FPS;   // f360 — extend as needed

// Blend transition durations (frames)
const BLEND_IN  = 15;  // 0.5s to blend walk in
const BLEND_OUT = 15;  // 0.5s to blend walk out / point in

export const humanEntity = {
  id: 'worker1',
  type: 'human_side',
  transform: { x: 400, y: 500 },   // pelvis world position — tune to your scene
  props: {
    scale: 1,
    mode: 'idle',
    walkPhase: 0,
    walkBlend: 0,
    pointBlend: 0,
    pointAngle: -130,              // degrees — negative = anti-clockwise = arm up-left
  },
};

export const humanTimeline = [
  // ── Mode label — drives rig's non-blended behaviour switches ─────────────
  {
    target: 'worker1',
    preset: 'characterMode',
    params: {
      phases: [
        { start: IDLE_START,  end: WALK_START  - 1, mode: 'idle'  },
        { start: WALK_START,  end: POINT_START - 1, mode: 'walk'  },
        { start: POINT_START, end: POINT_END,        mode: 'point' },
      ],
      defaultMode: 'idle',
    },
  },

  // ── Walk phase — increments during walk window, freezes outside ───────────
  {
    target: 'worker1',
    preset: 'walkPhase',
    params: {
      start: WALK_START,
      end:   POINT_START,
      speed: 0.022,               // tune: higher = faster stride
      startPhase: 0,
    },
  },

  // ── walkBlend: single phasedBlend entry resolves active phase internally ───
  // Using phasedSlide pattern: find last started phase, avoids last-write-wins conflict.
  {
    target: 'worker1',
    preset: 'phasedBlend',
    params: {
      outputKey: 'walkBlend',
      phases: [
        { from: 0, to: 1, start: WALK_START,  duration: BLEND_IN  },
        { from: 1, to: 1, start: WALK_START + BLEND_IN, duration: POINT_START - WALK_START - BLEND_IN },
        { from: 1, to: 0, start: POINT_START, duration: BLEND_OUT },
        { from: 0, to: 0, start: POINT_START + BLEND_OUT, duration: 999 },
      ],
    },
  },

  // ── pointBlend: ramp up when point starts, holds ─────────────────────────
  {
    target: 'worker1',
    preset: 'blendTo',
    params: { from: 0, to: 1, start: POINT_START,         duration: BLEND_IN,  outputKey: 'pointBlend' },
  },
];