// src/core/world/assetRegistry.ts

import { pxPerWu } from './worldUnits';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetWorld  = 'cityscape' | 'industrial' | 'finance' | 'generic';
export type SizeClass   = 'xs' | 'small' | 'medium' | 'large' | 'xl';
export type AssetStyle  = 'outline' | 'mono' | 'multi';
export type AssetAnchor = 'ground' | 'sky' | 'wall' | 'free';
export type AssetRole   = 'background' | 'midground' | 'actor' | 'prop' | 'overlay';

export interface AssetMeta {
  id:              string;
  path:            string;
  svgWidth:        number;
  svgHeight:       number;
  canonicalHeight: number;
  anchor:          AssetAnchor;
  type:            string;
  world:           AssetWorld;
  sizeClass:       SizeClass;
  style:           AssetStyle;
  role:            AssetRole;
  pivotName:       string;
}

// ── Scale helper ──────────────────────────────────────────────────────────────

export const scaleForAsset = (asset: AssetMeta): number =>
  (asset.canonicalHeight * pxPerWu) / asset.svgHeight;

// ── Registry ──────────────────────────────────────────────────────────────────

export const assetRegistry = {

  // ── Grounded props ─────────────────────────────────────────────────────────

  bench_a: {
    id: 'bench_a',
    path: 'cityscape/fill/bench_a.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2.9,
    anchor: 'ground',
    type: 'bench',
    world: 'cityscape',
    sizeClass: 'small',
    style: 'outline',
    role: 'prop',
    pivotName: 'pivot_ground',
  },

  bicycle: {
    id: 'bicycle',
    path: 'cityscape/fill/bicycle.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2,
    anchor: 'ground',
    type: 'bicycle',
    world: 'cityscape',
    sizeClass: 'small',
    style: 'outline',
    role: 'prop',
    pivotName: 'pivot_ground',
  },

  bin_a: {
    id: 'bin_a',
    path: 'cityscape/fill/bin_a.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 1,
    anchor: 'ground',
    type: 'bin',
    world: 'cityscape',
    sizeClass: 'small',
    style: 'outline',
    role: 'prop',
    pivotName: 'pivot_ground',
  },

  // ── Buildings ──────────────────────────────────────────────────────────────

  building_cbd_a: {
    id: 'building_cbd_a',
    path: 'cityscape/fill/building_cbd_a.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 5,
    anchor: 'ground',
    type: 'building',
    world: 'cityscape',
    sizeClass: 'xl',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_ground',
  },

  building_cbd_b: {
    id: 'building_cbd_b',
    path: 'cityscape/fill/building_cbd_b.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 9,
    anchor: 'ground',
    type: 'building',
    world: 'cityscape',
    sizeClass: 'xl',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_ground',
  },

  building_cbd_c: {
    id: 'building_cbd_c',
    path: 'cityscape/fill/building_cbd_c.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 6,
    anchor: 'ground',
    type: 'building',
    world: 'cityscape',
    sizeClass: 'large',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_ground',
  },

  building_cbd_d: {
    id: 'building_cbd_d',
    path: 'cityscape/fill/building_cbd_d.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 8,
    anchor: 'ground',
    type: 'building',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_ground',
  },

  // ── Trees ──────────────────────────────────────────────────────────────────

  tree_a: {
    id: 'tree_a',
    path: 'cityscape/fill/tree_a.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2.9,
    anchor: 'ground',
    type: 'tree',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'midground',
    pivotName: 'pivot_ground',
  },

  tree_b: {
    id: 'tree_b',
    path: 'cityscape/fill/tree_b.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2.6,
    anchor: 'ground',
    type: 'tree',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'midground',
    pivotName: 'pivot_ground',
  },

  tree_c: {
    id: 'tree_c',
    path: 'cityscape/fill/tree_c.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2.7,
    anchor: 'ground',
    type: 'tree',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'midground',
    pivotName: 'pivot_ground',
  },

  tree_pine: {
    id: 'tree_pine',
    path: 'cityscape/fill/tree_pine.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 3,
    anchor: 'ground',
    type: 'tree',
    world: 'cityscape',
    sizeClass: 'large',
    style: 'outline',
    role: 'midground',
    pivotName: 'pivot_ground',
  },

  // ── Sky / suspended elements ───────────────────────────────────────────────

  birds_three: {
    id: 'birds_three',
    path: 'cityscape/fill/birds_three.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 1.5,
    anchor: 'sky',
    type: 'birds',
    world: 'cityscape',
    sizeClass: 'small',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_bottom',
  },

  cloud_little: {
    id: 'cloud_little',
    path: 'cityscape/fill/cloud_little.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 1.7,
    anchor: 'sky',
    type: 'cloud',
    world: 'cityscape',
    sizeClass: 'small',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_bottom',
  },

  cloud_rainy: {
    id: 'cloud_rainy',
    path: 'cityscape/fill/cloud_rainy.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 3.6,
    anchor: 'sky',
    type: 'cloud',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_bottom',
  },

  hot_air_balloon: {
    id: 'hot_air_balloon',
    path: 'cityscape/fill/hot_air_balloon.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 3,
    anchor: 'sky',
    type: 'balloon',
    world: 'cityscape',
    sizeClass: 'large',
    style: 'outline',
    role: 'midground',
    pivotName: 'pivot_bottom',
  },

  sun: {
    id: 'sun',
    path: 'cityscape/fill/sun.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2.4,
    anchor: 'sky',
    type: 'sun',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'background',
    pivotName: 'pivot_bottom',
  },

  wind: {
    id: 'wind',
    path: 'cityscape/fill/wind.svg',
    svgWidth: 500,
    svgHeight: 500,
    canonicalHeight: 2,
    anchor: 'sky',
    type: 'wind',
    world: 'cityscape',
    sizeClass: 'medium',
    style: 'outline',
    role: 'overlay',
    pivotName: 'pivot_bottom',
  },

  // ── Vehicles ────────────────────────────────────────────────────────────────

  car_jeep: {
    id:              'car_jeep',
    path:            'car-jeep/car_body.svg',   // body only — rig loads wheels separately
    svgWidth:        500,
    svgHeight:       250,                        // your car canvas is 500×250
    canonicalHeight: 1.8,                        // jeep is ~1.8m tall
    anchor:          'ground',
    type:            'jeep',
    world:           'generic',
    sizeClass:       'medium',
    style:           'outline',
    role:            'actor',
    pivotName:       'pivot_ground',
  },

} as const;

export type AssetId = keyof typeof assetRegistry;