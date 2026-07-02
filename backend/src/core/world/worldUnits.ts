// src/core/world/worldUnits.ts
//
// World unit system. 1 world unit (wu) = 1 real-world meter equivalent.
// The canvas is mapped to a world of fixed dimensions. Everything scales
// from these two numbers — change them and the entire scene rescales.

export const WORLD_CONFIG = {
  // World dimensions in human-scale meters.
  // These are INDEPENDENT of canvas pixel dimensions.
  // 20wu wide = a city block roughly 20 meters across.
  worldWidth:  20,    // wu — scene is 20 meters wide
  worldHeight: 10,    // wu — scene is 10 meters tall

  canvasWidth:  1920, // px — Remotion composition width
  canvasHeight: 1080, // px — Remotion composition height

  groundFraction: 0.82,
};

// Pixels per world unit — how many canvas pixels = 1 meter
// 1080px canvas / 10wu = 108px per meter
export const pxPerWu = WORLD_CONFIG.canvasHeight / WORLD_CONFIG.worldHeight;

// Convert world units → pixels
export const wuToPx = (wu: number): number => wu * pxPerWu;

// Convert a world-space X position (0 = left edge, worldWidth = right edge) → canvas px
export const worldXToPx = (worldX: number): number =>
  (worldX / WORLD_CONFIG.worldWidth) * WORLD_CONFIG.canvasWidth;

// Convert a world-space Y position (0 = ground, positive = up) → canvas px
// Canvas Y is inverted: ground is at canvasHeight * groundFraction
export const worldYToPx = (worldY: number): number =>
  WORLD_CONFIG.canvasHeight * WORLD_CONFIG.groundFraction - wuToPx(worldY);

// Ground Y in canvas pixels — the baseline everything anchors to
export const GROUND_Y_PX = WORLD_CONFIG.canvasHeight * WORLD_CONFIG.groundFraction;