// src/remotion/MyComp/ForkliftScene.tsx
//
// Stage 2 complete: all <Part> renders replaced with rig components.
// Stage 3 complete: all IIFEs replaced with runPreset calls.
// Stage 4 complete: authored values moved to schema.ts; ForkliftScene
// receives them as props and derives world geometry from them.
//
import React from 'react';
import { useCurrentFrame } from 'remotion';

// ── NEW: import rig components ──────────────────────────────────────────────
import { runPreset } from '../../core/presets/runPreset';
import { forkliftSceneConfig, CANVAS_SIZE } from '../../core/sceneConfig';
import { Pallet } from '../../rigs/pallet/Pallet';
import { OilDrum } from '../../rigs/oil_drum/OilDrum';
import { Forklift } from '../../rigs/forklift/Forklift';

export const ForkliftScene: React.FC = () => {
  const {
    approachEndFrame,
    alignEndFrame,
    insertEndFrame,
    liftEndFrame,
    departEndFrame,
    startX,
    groundY,
    palletGroundX,
    scale,
    departEndX,
  } = forkliftSceneConfig;
  const frame = useCurrentFrame();

  // ---- pivots (pallet pivots now come from PALLET_PIVOTS constants) --------
  // ── NEW: import pallet pivot constants rather than parsing from SVG ────────
  // These match exactly what ForkliftScene previously read from pallet.svg.
  const PALLET_PIVOTS_LOCAL = {
    pivot_ground:         { x: 191.27, y: 39.2  },
    pivot_fork_root:      { x: 262.36, y: 10.46 },
    pivot_fork_tip:       { x: 283.02, y: 24.14 },
    pivot_top_left_edge:  { x: 3.25,   y: 3.4   },
    pivot_top_right_edge: { x: 261.4,  y: 3.25  },
  };

  // Forklift pivots now read from inline constants — same values previously parsed from SVGs
  const bodyGroundPivot      = { x: 190.11, y: 348.38 };
  const bodyWheelBackPivot   = { x: 291.66, y: 310.46 };
  const bodyWheelFrontPivot  = { x: 68,     y: 301.94 };
  const bodyForkMinPivot     = { x: 7.8,    y: 301.94 };
  const bodyForkMaxPivot     = { x: 7.8,    y: 168.94 };

  const wheelBackPivot  = { x: 39.08, y: 40.03 }; // from forklift_wheel_back.svg
  const wheelFrontPivot = { x: 47.19, y: 46.5  }; // from forklift_wheel_front.svg

  const forkMinPivot  = { x: 193.06, y: 135.5  }; // from forklift_fork.svg
  const forkRootPivot = { x: 163.05, y: 135.5  };
  const forkTipPivot  = { x: 1.56,   y: 137.1  };

  // Pallet pivots now read from local constants instead of parsed SVG
  const palletGroundPivot    = PALLET_PIVOTS_LOCAL.pivot_ground;
  const palletForkRootPivot  = PALLET_PIVOTS_LOCAL.pivot_fork_root;
  const palletForkTipPivot   = PALLET_PIVOTS_LOCAL.pivot_fork_tip;
  const palletTopLeftPivot   = PALLET_PIVOTS_LOCAL.pivot_top_left_edge;
  const palletTopRightPivot  = PALLET_PIVOTS_LOCAL.pivot_top_right_edge;

  // Drum pivots now read from OIL_DRUM_PIVOTS constants (same values, no parsed part needed)
  const drumBottomLeftPivot  = { x: 2.47,   y: 158.75 };
  const drumBottomRightPivot = { x: 131.88, y: 158.75 };
  const drumGroundPivot      = { x: 57.85,  y: 158.75 };

  // ---- scales ----
  // Body viewBox height = 354.63 (from forklift_body.svg) — hardcoded now that we use rig constants
  const BODY_VB_H  = 354.63;
  const finalScale = (CANVAS_SIZE * 0.55 * scale) / BODY_VB_H;
  const palletScale = finalScale;

  // ---- pallet world positions (static on ground) ----
  const palletGroundWorld = { x: palletGroundX, y: groundY };

  const palletForkTipWorld = {
    x: palletGroundWorld.x + (palletForkTipPivot.x - palletGroundPivot.x) * palletScale,
    y: palletGroundWorld.y + (palletForkTipPivot.y - palletGroundPivot.y) * palletScale,
  };
  const palletForkRootWorld = {
    x: palletGroundWorld.x + (palletForkRootPivot.x - palletGroundPivot.x) * palletScale,
    y: palletGroundWorld.y + (palletForkRootPivot.y - palletGroundPivot.y) * palletScale,
  };

  const palletTopLeftWorld = {
    x: palletGroundWorld.x + (palletTopLeftPivot.x - palletGroundPivot.x) * palletScale,
    y: palletGroundWorld.y + (palletTopLeftPivot.y - palletGroundPivot.y) * palletScale,
  };
  const palletTopRightWorld = {
    x: palletGroundWorld.x + (palletTopRightPivot.x - palletGroundPivot.x) * palletScale,
    y: palletGroundWorld.y + (palletTopRightPivot.y - palletGroundPivot.y) * palletScale,
  };
  const palletTopWidth = palletTopRightWorld.x - palletTopLeftWorld.x;
  const palletTopY = palletTopLeftWorld.y;

  // ---- drum scaling and positioning ----
  const drumNaturalWidth = Math.abs(drumBottomRightPivot.x - drumBottomLeftPivot.x);
  const availableWidthPerDrum = palletTopWidth * 0.45;
  const drumScale = availableWidthPerDrum / drumNaturalWidth;
  const drumScaledWidth = drumNaturalWidth * drumScale;
  const sideMargin = palletTopWidth * 0.05;

  const leftDrumAnchorX  = palletTopLeftWorld.x  + sideMargin + (drumScaledWidth / 2);
  const rightDrumAnchorX = palletTopRightWorld.x - sideMargin - (drumScaledWidth / 2);
  const drumAnchorY = palletTopY;

  // ---- forklift geometry ----
  const forkOffsetX        = (bodyForkMinPivot.x - bodyGroundPivot.x) * finalScale;
  const forkMinOffsetY     = (bodyForkMinPivot.y - bodyGroundPivot.y) * finalScale;
  const forkMaxOffsetY     = (bodyForkMaxPivot.y - bodyGroundPivot.y) * finalScale;

  const tipLocalOffsetX      = (forkTipPivot.x  - forkMinPivot.x) * finalScale;
  const forkRootLocalOffsetX = (forkRootPivot.x - forkMinPivot.x) * finalScale;
  const forkRootLocalOffsetY = (forkRootPivot.y - forkMinPivot.y) * finalScale;

  const approachStopX = palletForkTipWorld.x - forkOffsetX - tipLocalOffsetX;
  const insertStopX   = palletForkRootWorld.x - forkOffsetX - forkRootLocalOffsetX;
  const alignedForkCarriageOffsetY = (palletForkRootWorld.y - groundY) - forkRootLocalOffsetY;

  // forkliftX — five chained fadeSlide presets replacing the hand-rolled IIFE.
  // fadeSlide returns fromX when frame < start, so each preset is authoritative
  // for its own range and the last one whose start <= frame wins.
  // We resolve by taking the last preset that has started by this frame.
  const xPhases = [
    { fromX: startX,        toX: approachStopX, start: 0,               duration: approachEndFrame,                easing: 'easeOut'   },
    { fromX: approachStopX, toX: approachStopX, start: approachEndFrame, duration: alignEndFrame - approachEndFrame, easing: 'linear'   },
    { fromX: approachStopX, toX: insertStopX,   start: alignEndFrame,    duration: insertEndFrame - alignEndFrame,   easing: 'easeInOut' },
    { fromX: insertStopX,   toX: insertStopX,   start: insertEndFrame,   duration: liftEndFrame - insertEndFrame,    easing: 'linear'   },
    { fromX: insertStopX,   toX: departEndX,    start: liftEndFrame,     duration: departEndFrame - liftEndFrame,    easing: 'easeIn'   },
  ];
  const activeXPhase = [...xPhases].reverse().find(p => frame >= p.start) ?? xPhases[0];
  const forkliftX = runPreset('fadeSlide', frame, activeXPhase).x as number;

  // forkCarriageOffsetY — three chained forkCarriageY presets replacing the IIFE.
  // Phase 1: rest at forkMinOffsetY until approach ends (held, no motion)
  // Phase 2: lower to alignedForkCarriageOffsetY during align window
  // Phase 3: hold at align during insert (held, no motion)
  // Phase 4: lift to forkMaxOffsetY during lift window, hold after
  const yPhases = [
    { from: forkMinOffsetY,             to: forkMinOffsetY,             start: 0,               duration: approachEndFrame                },
    { from: forkMinOffsetY,             to: alignedForkCarriageOffsetY, start: approachEndFrame, duration: alignEndFrame - approachEndFrame },
    { from: alignedForkCarriageOffsetY, to: alignedForkCarriageOffsetY, start: alignEndFrame,    duration: insertEndFrame - alignEndFrame   },
    { from: alignedForkCarriageOffsetY, to: forkMaxOffsetY,             start: insertEndFrame,   duration: liftEndFrame - insertEndFrame    },
  ];
  const activeYPhase = [...yPhases].reverse().find(p => frame >= p.start) ?? yPhases[0];
  const forkCarriageOffsetY = runPreset('forkCarriageY', frame, activeYPhase).forkCarriageOffsetY as number;

  const bodyGroundWorld  = { x: forkliftX, y: groundY };
  // forkCarriageWorld inlined here — rig uses forkCarriageOffsetY prop directly
  // forkRootWorld still needed for palletAnchor calculation
  const forkRootWorld = {
    x: bodyGroundWorld.x + forkOffsetX + forkRootLocalOffsetX,
    y: bodyGroundWorld.y + forkCarriageOffsetY + forkRootLocalOffsetY,
  };

  // Wheel rotation — total distance travelled drives rotation for each wheel.
  // forkliftX already accounts for all phases so distance = forkliftX - startX,
  // except during the lift phase when the forklift is stationary at insertStopX.
  const totalDistanceTraveled =
    frame <= liftEndFrame
      ? forkliftX - startX
      : (insertStopX - startX) + (forkliftX - insertStopX);
  // degsPerPx = 360 / (2π * radius). Wheel viewBox heights: back=78.51, front=93.63
  const wheelBackRotDeg  = (totalDistanceTraveled / (Math.PI * (78.51 / 2) * finalScale)) * 180;
  const wheelFrontRotDeg = (totalDistanceTraveled / (Math.PI * (93.63 / 2) * finalScale)) * 180;

  // ---- pallet dynamic anchor ----
  // Before insert completes: pallet sits on the ground at its initial position.
  // After insert: pallet pivot_fork_root is pinned to the fork's pivot_fork_root,
  // so pallet pivot_ground = forkRootWorld minus the fork_root→ground offset.
  const palletForkRootDeltaX = (palletForkRootPivot.x - palletGroundPivot.x) * palletScale;
  const palletForkRootDeltaY = (palletForkRootPivot.y - palletGroundPivot.y) * palletScale;
  const palletAnchor = frame <= insertEndFrame
    ? { x: palletGroundWorld.x, y: groundY }
    : { x: forkRootWorld.x - palletForkRootDeltaX, y: forkRootWorld.y - palletForkRootDeltaY };

  // Drums move with pallet
  const leftDrumStaticOffsetX  = leftDrumAnchorX  - palletGroundWorld.x;
  const leftDrumStaticOffsetY  = drumAnchorY - groundY;
  const rightDrumStaticOffsetX = rightDrumAnchorX - palletGroundWorld.x;
  const rightDrumStaticOffsetY = drumAnchorY - groundY;

  const leftDrumWorldAnchor  = {
    x: palletAnchor.x + leftDrumStaticOffsetX,
    y: palletAnchor.y + leftDrumStaticOffsetY,
  };
  const rightDrumWorldAnchor = {
    x: palletAnchor.x + rightDrumStaticOffsetX,
    y: palletAnchor.y + rightDrumStaticOffsetY,
  };

  // ---- render ----
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
      style={{ overflow: 'visible' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left oil drum — swapped to <OilDrum> rig */}
      <foreignObject x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ overflow: 'visible' }}>
        <OilDrum
          x={leftDrumWorldAnchor.x}
          y={leftDrumWorldAnchor.y}
          scale={drumScale}
        />
      </foreignObject>

      {/* Right oil drum — swapped to <OilDrum> rig */}
      <foreignObject x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ overflow: 'visible' }}>
        <OilDrum
          x={rightDrumWorldAnchor.x}
          y={rightDrumWorldAnchor.y}
          scale={drumScale}
        />
      </foreignObject>

      {/* Forklift — all four parts swapped to <Forklift> rig.
           x/y = bodyGroundWorld (pivot_ground anchor), matching what each <Part> used.
           forkCarriageOffsetY = the raw Y offset ForkliftScene already computed.
           Wheel rotations passed separately since radii differ. */}
      <foreignObject x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ overflow: 'visible' }}>
        <Forklift
          x={bodyGroundWorld.x}
          y={bodyGroundWorld.y}
          scale={finalScale}
          forkCarriageOffsetY={forkCarriageOffsetY}
          wheelBackRotDeg={wheelBackRotDeg}
          wheelFrontRotDeg={wheelFrontRotDeg}
        />
      </foreignObject>

      {/*
        ── SWAPPED: pallet <Part> replaced with <Pallet> rig ─────────────────
        The <Pallet> component renders inside a foreignObject so it can use
        its own SVG coordinate space while receiving world-space anchor coords
        from ForkliftScene's existing position logic.

        anchorX/anchorY = palletAnchor (the pivot_ground world position)
        scale           = palletScale  (same finalScale ForkliftScene computed)

        The Pallet rig pins its pivot_ground to (x, y) — identical behaviour
        to the <Part> it replaced.
      ──────────────────────────────────────────────────────────────────────── */}
      <foreignObject x="0" y="0" width={CANVAS_SIZE} height={CANVAS_SIZE} style={{ overflow: 'visible' }}>
        <Pallet
          x={palletAnchor.x}
          y={palletAnchor.y}
          scale={palletScale}
        />
      </foreignObject>
    </svg>
  );
};