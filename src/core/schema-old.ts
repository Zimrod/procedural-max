// schema.ts
//
// Generates the scene configuration based on parsed SVG data.
// All positions are computed parametrically from SVG pivots.

import { PartData, getPivot } from "./utils/svgUtils";

export const generateScene = (
  forkliftBodyData: PartData,
  forkliftForkData: PartData,
  palletData: PartData,
  oilDrumData: PartData,
  scale: number = 1,
  canvasWidth: number = 500,
) => {
  // Compute ground Y from forklift body pivot_ground scaled
  const groundPivot = getPivot(forkliftBodyData, 'pivot_ground');
  const groundY = groundPivot.y * scale;

  // Pallet ground X from pallet pivot_ground
  const palletGroundPivot = getPivot(palletData, 'pivot_ground');
  const palletGroundX = palletGroundPivot.x * scale;

  // Start X: position forklift so its pivot_ground is at some offset from left
  // Assuming start is 552 as before, but could be computed
  const startX = 552.00;

  // Approach stop X: align fork tip with pallet fork tip
  const forkTipPivot = getPivot(forkliftForkData, 'pivot_fork_tip');
  const palletForkTipPivot = getPivot(palletData, 'pivot_fork_tip');
  const forkMinPivot = getPivot(forkliftBodyData, 'pivot_fork_min');
  const forkMinForkPivot = getPivot(forkliftForkData, 'pivot_fork_min');

  // Fork tip world position at rest (carriage at fork_min)
  const forkTipAtRestX = startX + (forkMinPivot.x - groundPivot.x) * scale + (forkTipPivot.x - forkMinForkPivot.x) * scale;
  const palletForkTipX = palletGroundX + (palletForkTipPivot.x - palletGroundPivot.x) * scale;
  const approachStopX = startX + (palletForkTipX - forkTipAtRestX);

  // Insert stop X: align fork root with pallet fork root
  const forkRootPivot = getPivot(forkliftForkData, 'pivot_fork_root');
  const palletForkRootPivot = getPivot(palletData, 'pivot_fork_root');
  const palletForkRootX = palletGroundX + (palletForkRootPivot.x - palletGroundPivot.x) * scale;
  const forkRootAtRestX = startX + (forkMinPivot.x - groundPivot.x) * scale + (forkRootPivot.x - forkMinForkPivot.x) * scale;
  const insertStopX = startX + (palletForkRootX - forkRootAtRestX);

  // Depart end X
  const departEndX = 672.00;

  // Fork carriage offsets
  const forkMaxPivot = getPivot(forkliftBodyData, 'pivot_fork_max');
  const forkMaxForkPivot = getPivot(forkliftForkData, 'pivot_fork_max');
  const forkRestY = (forkMinPivot.y - groundPivot.y) * scale;
  const forkAlignY = (forkMinPivot.y - groundPivot.y) * scale - (palletGroundPivot.y - getPivot(palletData, 'pivot_fork_root').y) * scale; // approximate align
  const forkLiftedY = (forkMaxPivot.y - groundPivot.y) * scale;

  // Wheel degs-per-pixel
  const wheelBackPivot = getPivot(forkliftBodyData, 'pivot_wheel_back');
  const wheelFrontPivot = getPivot(forkliftBodyData, 'pivot_wheel_front');
  const wheelRadiusApprox = 20; // approximate, could parse from SVG
  const degsPerPixelBack = 360 / (2 * Math.PI * wheelRadiusApprox);

  const F_APPROACH_END = 60;
  const F_ALIGN_END = 100;
  const F_INSERT_END = 140;
  const F_LIFT_END = 190;
  const F_DEPART_END = 310;

  const WHEEL_PHASES = [
    { fromX: startX, toX: approachStopX, start: 0, duration: F_APPROACH_END, easing: "easeOut" },
    { fromX: approachStopX, toX: approachStopX, start: F_APPROACH_END, duration: F_ALIGN_END - F_APPROACH_END, easing: "linear" },
    { fromX: approachStopX, toX: insertStopX, start: F_ALIGN_END, duration: F_INSERT_END - F_ALIGN_END, easing: "easeInOut" },
    { fromX: insertStopX, toX: insertStopX, start: F_INSERT_END, duration: F_LIFT_END - F_INSERT_END, easing: "linear" },
    { fromX: insertStopX, toX: departEndX, start: F_LIFT_END, duration: F_DEPART_END - F_LIFT_END, easing: "easeIn" },
  ];

  return {
    entities: [
      {
        id: "forklift",
        type: "forklift",
        transform: { x: startX, y: groundY },
        props: { scale },
      },
      {
        id: "pallet",
        type: "pallet",
        transform: { x: palletGroundX, y: groundY },
        props: { scale },
      },
      {
        id: "drum1",
        type: "oil_drum",
        transform: { x: palletGroundX, y: groundY },
        props: { scale },
      },
      {
        id: "drum2",
        type: "oil_drum",
        transform: { x: palletGroundX, y: groundY },
        props: { scale },
      },
    ],

    timeline: [
      // Phase 1: approach
      {
        target: "forklift",
        preset: "fadeSlide",
        params: { fromX: startX, toX: approachStopX, start: 0, duration: F_APPROACH_END, easing: "easeOut" },
      },
      // Phase 2: fork aligns down
      {
        target: "forklift",
        preset: "forkCarriageY",
        params: { from: forkRestY, to: forkAlignY, start: F_APPROACH_END, duration: F_ALIGN_END - F_APPROACH_END },
      },
      // Phase 3: insert
      {
        target: "forklift",
        preset: "fadeSlide",
        params: { fromX: approachStopX, toX: insertStopX, start: F_ALIGN_END, duration: F_INSERT_END - F_ALIGN_END, easing: "easeInOut" },
      },
      // Phase 4: lift
      {
        target: "forklift",
        preset: "forkCarriageY",
        params: { from: forkAlignY, to: forkLiftedY, start: F_INSERT_END, duration: F_LIFT_END - F_INSERT_END },
      },
      // Phase 5: depart
      {
        target: "forklift",
        preset: "fadeSlide",
        params: { fromX: insertStopX, toX: departEndX, start: F_LIFT_END, duration: F_DEPART_END - F_LIFT_END, easing: "easeIn" },
      },
      // Wheel rotation
      {
        target: "forklift",
        preset: "wheelRotation",
        params: { phases: WHEEL_PHASES, degsPerPixel: degsPerPixelBack },
      },
    ],

    constraints: [
      // Forklift fork tip → pallet fork root
      {
        id: "fork_to_pallet",
        type: "attach",
        source: { entityId: "forklift", pivot: "pivot_fork_tip" },
        target: { entityId: "pallet", pivot: "pivot_fork_root" },
        active: { start: F_INSERT_END, end: 999 },
      },
      // Ground alignment
      {
        id: "forklift_ground_to_pallet_ground",
        type: "attach",
        source: { entityId: "forklift", pivot: "pivot_ground" },
        target: { entityId: "pallet", pivot: "pivot_ground" },
        active: { start: 0, end: 999 },
        axis: "y",
      },
      // Pallet to drums
      {
        id: "pallet_to_drum1",
        type: "attach",
        source: { entityId: "pallet", pivot: "pivot_top_left_edge" },
        target: { entityId: "drum1", pivot: "pivot_ground" },
        active: { start: 0, end: 999 },
      },
      {
        id: "pallet_to_drum2",
        type: "attach",
        source: { entityId: "pallet", pivot: "pivot_top_right_edge" },
        target: { entityId: "drum2", pivot: "pivot_ground" },
        active: { start: 0, end: 999 },
      },
    ],
  };
};

// For backward compatibility, export a default scene (will need to be updated when parts are loaded)
export const scene = {
  entities: [],
  timeline: [],
  constraints: [],
};