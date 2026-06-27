// src/core/world/scenes/cityscapeLayout.ts
//
// Example cityscape scene definition.
// Everything is in world units (wu). The layout algorithm handles px conversion.
//
// World is 20wu wide × 10wu tall.
// Ground is at worldY=0. Sky is at worldY=10.
//
// zIndex convention:
//   2 = far background (smallest, most faded)
//   1 = midground
//   0 = foreground (full size, full detail)

import { WorldLayout } from '../worldLayout';

export const cityscapeLayout: WorldLayout = {
  placements: [

    // ── Far background buildings (layer 2) ────────────────────────────────────
    {
      id:              'bg_building_1',
      assetId:         'building_cbd_b',
      worldX:          10,
      worldY:          0,
      scaleMultiplier: 1,
      zIndex:          2,
    },
    {
      id:              'bg_building_2',
      assetId:         'building_cbd_a',
      worldX:          7.5,
      worldY:          0,
      scaleMultiplier: 0.95,
      zIndex:          2,
    },
    {
      id:              'bg_building_3',
      assetId:         'building_cbd_d',
      worldX:          6.5,
      worldY:          0,
      scaleMultiplier: 0.9,
      zIndex:          1,
    },
    {
      id:              'bg_building_4',
      assetId:         'building_cbd_c',
      worldX:          14,
      worldY:          0,
      scaleMultiplier: 1,
      zIndex:          0,
    },

    // ── Sky elements (pivot_bottom anchored) ──────────────────────────────────
    {
      id:      'sun',
      assetId: 'sun',
      worldX:  3,
      worldY:  3,
      zIndex:  2,
    },
    {
      id:      'cloud_1',
      assetId: 'cloud_little',
      worldX:  6,
      worldY:  1.4,
      zIndex:  2,
    },
    {
      id:              'cloud_2',
      assetId:         'cloud_rainy',
      worldX:          12,
      worldY:          2,
      scaleMultiplier: 0.9,
      zIndex:          2,
    },
    {
      id:      'birds',
      assetId: 'birds_three',
      worldX:  4.1,
      worldY:  2,
      zIndex:  2,
    },
    {
      id:      'balloon',
      assetId: 'hot_air_balloon',
      worldX:  18,
      worldY:  2.8,
      zIndex:  2,
    },

    // ── Midground (layer 1) ───────────────────────────────────────────────────
    {
      id:      'mid_tree_1',
      assetId: 'tree_a',
      worldX:  2.2,
      worldY:  0,
      zIndex:  2,
    },
    {
      id:      'mid_tree_2',
      assetId: 'tree_b',
      worldX:  17.6,
      worldY:  0,
      zIndex:  2,
    },
    {
      id:      'mid_tree_3',
      assetId: 'tree_c',
      worldX:  1.5,
      worldY:  0,
      zIndex:  2,
    },

    // ── Foreground (layer 0) ──────────────────────────────────────────────────
    {
      id:      'fg_tree',
      assetId: 'tree_pine',
      worldX:  16.8,
      worldY:  0,
      zIndex:  2,
    },
    {
      id:      'fg_bench',
      assetId: 'bench_a',
      worldX:  2.5,
      worldY:  0,
      zIndex:  2,
    },
    {
      id:      'fg_bin',
      assetId: 'bin_a',
      worldX:  4.3,
      worldY:  0,
      zIndex:  2,
    },
    {
      id:      'fg_bicycle',
      assetId: 'bicycle',
      worldX:  10,
      worldY:  0,
      zIndex:  2,
    },

    // ── Overlay / ambient motion ──────────────────────────────────────────────
    {
      id:      'wind_overlay',
      assetId: 'wind',
      worldX:  10,
      worldY:  2,
      zIndex:  1,
    },

  ],
};