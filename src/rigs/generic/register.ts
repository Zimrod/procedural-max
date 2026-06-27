// src/rigs/generic/register.ts
//
// Registers GenericRig for every static asset type in the registry.
// Any asset whose type maps here will be rendered by GenericRig.
// Actors with dedicated rigs (forklift, human_side) are NOT registered here —
// they have their own register.ts files.

import { registerRig } from '../../core/rigRegistry';
import { GenericRig }  from './GenericRig';

const STATIC_TYPES = [
  // ── Structures
  'building',

  // ── Vegetation
  'tree',

  // ── Props
  'bench',
  'bin',
  'bicycle',

  // ── Sky / ambient
  'cloud',
  'sun',
  'birds',
  'balloon',
  'wind',
];

STATIC_TYPES.forEach((type) => {
  registerRig(type, {
    component: GenericRig,
  });
});