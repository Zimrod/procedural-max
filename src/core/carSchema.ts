// src/remotion/core/carSchema.ts
//
// Schema fragment: car-jeep drives through the cityscape.
// Merge with cityscapeLayout entities in Video.tsx.
//
// The car's pivot_ground sits at the bottom of the front wheel.
// y = GROUND_Y_PX so it rolls on the ground line.
// x starts off-screen left, drives to off-screen right.

import { GROUND_Y_PX, worldXToPx, WORLD_CONFIG } from './world/worldUnits';
import { assetRegistry, scaleForAsset }          from './world/assetRegistry';

// ── Car asset registration (add to assetRegistry.ts) ─────────────────────────
// Add this block to assetRegistry.ts under a '// ── Vehicles' section:
//
//   car_jeep: {
//     id:              'car_jeep',
//     path:            'car-jeep/car_body.svg',   // body only — rig loads wheels separately
//     svgWidth:        500,
//     svgHeight:       250,                        // your car canvas is 500×250
//     canonicalHeight: 1.8,                        // jeep is ~1.8m tall
//     anchor:          'ground',
//     type:            'jeep',
//     world:           'generic',
//     sizeClass:       'medium',
//     style:           'outline',
//     role:            'actor',
//     pivotName:       'pivot_ground',
//   },

// ── Derived values ────────────────────────────────────────────────────────────

// Assume car_jeep is registered. Import pxPerWu for wheel radius calculation.
import { pxPerWu } from './world/worldUnits';

// Car scale from registry
// canonicalHeight=1.8wu, svgHeight=250px → scale = (1.8 * 108) / 250 = 0.778
const CAR_SVG_HEIGHT  = 250;
const CAR_CANONICAL_H = 1.8;
const carScale = (CAR_CANONICAL_H * pxPerWu) / CAR_SVG_HEIGHT;

// Wheel radius in canvas px — needed for carDrive preset rotation calculation.
// Wheel SVG is approximately square, ~80px viewBox height.
// Actual value: check your wheel SVG viewBox and plug it in.
const WHEEL_SVG_H    = 80;   // ← update to match your wheel_back.svg viewBox height
const wheelRadiusPx  = (WHEEL_SVG_H / 2) * carScale;

// Start/end: car enters from left off-screen, exits right off-screen
const CAR_START_X = worldXToPx(-2);   // -192px — off left edge
const CAR_END_X   = worldXToPx(22);   // 2112px — off right edge

const DRIVE_START_FRAME = 0;
const DRIVE_DURATION    = 180;  // 6 seconds at 30fps — adjust to taste

// ── Entity ────────────────────────────────────────────────────────────────────

export const carEntity = {
  id:   'car_jeep_1',
  type: 'jeep',                        // must match registerRig() in carRegister.ts
  transform: {
    x: CAR_START_X,
    y: GROUND_Y_PX,                    // pivot_ground on the ground line
  },
  props: {
    scale:        carScale,
    bodySvg:      'car-jeep/car_body.svg',
    wheelBackSvg: 'car-jeep/wheel_back.svg',
    wheelFrontSvg:'car-jeep/wheel_front.svg',
    flipX:        false,
  },
};

// ── Timeline ──────────────────────────────────────────────────────────────────

export const carTimeline = [
  {
    target: 'car_jeep_1',
    preset: 'carDrive',
    params: {
      fromX:        CAR_START_X,
      toX:          CAR_END_X,
      start:        DRIVE_START_FRAME,
      duration:     DRIVE_DURATION,
      wheelRadius:  wheelRadiusPx,
      easing:       'easeInOut',
      shakeAmplitude: 0,               // set to 3-5 for off-road feel
    },
  },
];