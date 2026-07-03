"use strict";
// src/core/world/worldUnits.ts
//
// World unit system. 1 world unit (wu) = 1 real-world meter equivalent.
// The canvas is mapped to a world of fixed dimensions. Everything scales
// from these two numbers — change them and the entire scene rescales.
Object.defineProperty(exports, "__esModule", { value: true });
exports.GROUND_Y_PX = exports.worldYToPx = exports.worldXToPx = exports.wuToPx = exports.pxPerWu = exports.WORLD_CONFIG = void 0;
exports.WORLD_CONFIG = {
    // World dimensions in human-scale meters.
    // These are INDEPENDENT of canvas pixel dimensions.
    // 20wu wide = a city block roughly 20 meters across.
    worldWidth: 20, // wu — scene is 20 meters wide
    worldHeight: 10, // wu — scene is 10 meters tall
    canvasWidth: 1920, // px — Remotion composition width
    canvasHeight: 1080, // px — Remotion composition height
    groundFraction: 0.82,
};
// Pixels per world unit — how many canvas pixels = 1 meter
// 1080px canvas / 10wu = 108px per meter
exports.pxPerWu = exports.WORLD_CONFIG.canvasHeight / exports.WORLD_CONFIG.worldHeight;
// Convert world units → pixels
const wuToPx = (wu) => wu * exports.pxPerWu;
exports.wuToPx = wuToPx;
// Convert a world-space X position (0 = left edge, worldWidth = right edge) → canvas px
const worldXToPx = (worldX) => (worldX / exports.WORLD_CONFIG.worldWidth) * exports.WORLD_CONFIG.canvasWidth;
exports.worldXToPx = worldXToPx;
// Convert a world-space Y position (0 = ground, positive = up) → canvas px
// Canvas Y is inverted: ground is at canvasHeight * groundFraction
const worldYToPx = (worldY) => exports.WORLD_CONFIG.canvasHeight * exports.WORLD_CONFIG.groundFraction - (0, exports.wuToPx)(worldY);
exports.worldYToPx = worldYToPx;
// Ground Y in canvas pixels — the baseline everything anchors to
exports.GROUND_Y_PX = exports.WORLD_CONFIG.canvasHeight * exports.WORLD_CONFIG.groundFraction;
//# sourceMappingURL=worldUnits.js.map