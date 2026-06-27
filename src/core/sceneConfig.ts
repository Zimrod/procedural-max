// src/remotion/core/sceneConfig.ts
//
// Authored values for the forklift scene.
// Imported by both ForkliftScene (for geometry derivation) and
// schema.ts (for Puppeteer scene generation).
// No imports — this file has zero dependencies.

export const CANVAS_SIZE = 800;

export const forkliftSceneConfig = {
  // ── Timing (frames) ──────────────────────────────────────────────────────
  approachEndFrame: 60,
  alignEndFrame:    100,
  insertEndFrame:   140,
  liftEndFrame:     190,
  departEndFrame:   310,

  // ── Scene layout ─────────────────────────────────────────────────────────
  startX:        CANVAS_SIZE + 300,
  departEndX:    CANVAS_SIZE + 600,
  groundY:       CANVAS_SIZE * 0.78,
  palletGroundX: CANVAS_SIZE * 0.35,

  // ── Scale ─────────────────────────────────────────────────────────────────
  scale: 0.4,

  // ── Asset folders ─────────────────────────────────────────────────────────
  forkliftFolder: 'forklift',
  palletFolder:   'pallet',
  oilDrumFolder:  'oil_drum',
};