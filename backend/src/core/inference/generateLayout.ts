// src/core/inference/generateLayout.ts
//
// Stage 3: SceneIntent + seed → WorldLayout
//
// Selects assets from each layer pool and places them in world space
// using seeded randomness. Same seed = same layout every time.
//
// Placement rules enforced here:
//   - No two assets of the same type overlap horizontally
//   - Background assets spread across full width
//   - Midground assets cluster in the middle two-thirds
//   - Foreground assets placed in lower one-third of world width
//   - Sky assets distributed across upper portion of canvas
//   - Minimum spacing between same-type assets

import { WorldLayout, AssetPlacement } from '../world/worldLayout';
import { assetRegistry, AssetId }      from '../world/assetRegistry';
import { SceneIntent }                 from './scenePrompt';
import { createRng, Rng }              from './seededRandom';

// ── Placement rules ───────────────────────────────────────────────────────────

// X ranges per depth layer (world units)
const X_RANGES: Record<number, [number, number]> = {
  2: [0,    20],    // background: full width
  1: [2,    18],    // midground: slightly inset
  0: [1,    15],    // foreground: left two-thirds (leave room for actors)
};

// Minimum horizontal gap between assets (world units)
const MIN_GAP = 1.5;

// Sky Y range (world units from top — sky assets use wuToPx directly)
const SKY_Y_RANGE: [number, number] = [5, 9];  // worldY for sky assets

// ── Overlap checker ───────────────────────────────────────────────────────────

const getAssetWidth = (assetId: AssetId, scaleMultiplier = 1): number => {
  const asset = assetRegistry[assetId];
  if (!asset) return 2;
  // Approximate world-unit width from canonical height and aspect ratio
  const aspectRatio = asset.svgWidth / asset.svgHeight;
  return asset.canonicalHeight * aspectRatio * scaleMultiplier;
};

const hasOverlap = (
  newX: number,
  newWidth: number,
  placed: Array<{ x: number; width: number }>
): boolean => {
  for (const p of placed) {
    const gap = Math.abs(newX - p.x) - (newWidth / 2 + p.width / 2);
    if (gap < MIN_GAP) return true;
  }
  return false;
};

// ── Layer placement ───────────────────────────────────────────────────────────

const placeLayer = (
  layerDepth: number,
  assetPool: AssetId[],
  count: number,
  rng: Rng,
  allowFlip: boolean
): AssetPlacement[] => {
  if (assetPool.length === 0 || count === 0) return [];

  const [xMin, xMax] = X_RANGES[layerDepth] ?? [0, 20];
  const placements: AssetPlacement[] = [];
  const placed: Array<{ x: number; width: number }> = [];
  let attempts = 0;

  while (placements.length < count && attempts < count * 10) {
    attempts++;

    const assetId = rng.pick(assetPool);
    const scaleMultiplier = rng.range(0.85, 1.1);
    const assetWidth = getAssetWidth(assetId, scaleMultiplier);
    const x = rng.range(xMin + assetWidth / 2, xMax - assetWidth / 2);

    if (hasOverlap(x, assetWidth, placed)) continue;

    placed.push({ x, width: assetWidth });
    placements.push({
      id:              `layer${layerDepth}_${assetId}_${placements.length}`,
      assetId,
      worldX:          x,
      worldY:          0,
      scaleMultiplier,
      flipX:           allowFlip && rng.bool(0.3),
      zIndex:          layerDepth,
    });
  }

  return placements;
};

// ── Sky placement ─────────────────────────────────────────────────────────────

const placeSkyElements = (
  skyPool: AssetId[],
  rng: Rng
): AssetPlacement[] => {
  if (skyPool.length === 0) return [];

  // Pick 1–3 sky elements
  const count = rng.int(1, Math.min(3, skyPool.length));
  const chosen = rng.shuffle([...skyPool]).slice(0, count);
  const placed: Array<{ x: number; width: number }> = [];

  return chosen.map((assetId, i) => {
    let x: number;
    let attempts = 0;
    do {
      x = rng.range(1, 19);
      attempts++;
    } while (hasOverlap(x, 3, placed) && attempts < 20);

    placed.push({ x, width: 3 });

    return {
      id:     `sky_${assetId}_${i}`,
      assetId,
      worldX: x,
      worldY: rng.range(SKY_Y_RANGE[0], SKY_Y_RANGE[1]),
      scaleMultiplier: rng.range(0.8, 1.2),
      zIndex: 2,
    };
  });
};

// ── Main generator ────────────────────────────────────────────────────────────

export const generateLayout = (intent: SceneIntent, seed: number): WorldLayout => {
  const rng = createRng(seed);

  const placements: AssetPlacement[] = [];

  // Place each depth layer
  for (const layer of intent.layers) {
    const count = rng.int(layer.minCount, layer.maxCount);
    const layerPlacements = placeLayer(
      layer.depth,
      layer.assetPool,
      count,
      rng,
      layer.allowFlip
    );
    placements.push(...layerPlacements);
  }

  // Place sky elements
  const skyPlacements = placeSkyElements(intent.skyElements, rng);
  placements.push(...skyPlacements);

  return { placements };
};