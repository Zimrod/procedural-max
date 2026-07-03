"use strict";
// src/remotion/core/world/worldLayout.ts
//
// Layout algorithm: takes a scene description (which assets, where) and
// returns fully computed entity definitions ready for Puppeteer.
//
// The caller thinks in world units (wu). This module converts everything
// to canvas pixels and computes the correct scale for each asset.
//
// Usage:
//   const entities = buildWorldLayout(cityscapeLayout);
//   // → pass directly to Puppeteer as entities prop
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortByDepth = exports.applyDepthScaling = exports.buildWorldLayout = void 0;
const assetRegistry_1 = require("./assetRegistry");
const worldUnits_1 = require("./worldUnits");
// ── Core layout builder ───────────────────────────────────────────────────────
const buildWorldLayout = (layout) => {
    return layout.placements
        .map((placement) => {
        const asset = assetRegistry_1.assetRegistry[placement.assetId];
        if (!asset) {
            console.warn(`[worldLayout] Unknown assetId: "${placement.assetId}"`);
            return null;
        }
        // Compute scale from canonical height, apply optional multiplier
        const baseScale = (0, assetRegistry_1.scaleForAsset)(asset);
        const scale = baseScale * (placement.scaleMultiplier ?? 1);
        // Convert world position to canvas pixels
        const canvasX = (0, worldUnits_1.worldXToPx)(placement.worldX);
        // Y position:
        // - ground-anchored assets: pivot_ground sits on the ground line
        //   worldY=0 means standing on the ground, worldY>0 means elevated
        // - sky-anchored assets: worldY is measured down from the top
        const canvasY = asset.anchor === 'sky'
            ? (0, worldUnits_1.wuToPx)(placement.worldY ?? 5) // sky assets: px from top
            : worldUnits_1.GROUND_Y_PX - (0, worldUnits_1.wuToPx)(placement.worldY ?? 0); // ground assets: on ground line
        // ── ADD THIS ──
        //   console.log(`[buildWorldLayout] ${placement.id}`, {
        //     assetId: placement.assetId,
        //     scale: scale.toFixed(3),
        //     canvasX: canvasX.toFixed(0),
        //     canvasY: canvasY.toFixed(0),
        //     type: asset.type,
        //   });
        // ─────────────
        return {
            id: placement.id,
            type: asset.type,
            transform: { x: canvasX, y: canvasY },
            props: {
                scale,
                flipX: placement.flipX ?? false,
                zIndex: placement.zIndex ?? 0,
                // Pass through asset metadata so rigs can use it
                assetId: placement.assetId,
                world: asset.world,
                role: asset.role,
                style: asset.style,
            },
        };
    })
        .filter(Boolean);
};
exports.buildWorldLayout = buildWorldLayout;
// ── Depth scaling helper ──────────────────────────────────────────────────────
// Simulates perspective: assets further back (higher zIndex = background)
// appear smaller. depthFactor: how much to scale down per z-layer.
// layer 0 = foreground (full size), layer 1 = 80%, layer 2 = 64%, etc.
const applyDepthScaling = (entities, depthFactor = 0.8) => {
    return entities.map((entity) => {
        const layer = entity.props.zIndex ?? 0;
        const depthScale = Math.pow(depthFactor, layer);
        return {
            ...entity,
            props: {
                ...entity.props,
                scale: entity.props.scale * depthScale,
            },
        };
    });
};
exports.applyDepthScaling = applyDepthScaling;
// ── Convenience: sort by zIndex for correct render order ─────────────────────
const sortByDepth = (entities) => [...entities].sort((a, b) => (a.props.zIndex ?? 0) - (b.props.zIndex ?? 0));
exports.sortByDepth = sortByDepth;
//# sourceMappingURL=worldLayout.js.map