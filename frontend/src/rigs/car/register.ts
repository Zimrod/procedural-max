// src/rigs/car/register.ts
import { registerRig } from '../../core/rigRegistry';
import { CarDriveRig } from './CarDriveRig';

// Register for every vehicle type you have SVGs for
const VEHICLE_TYPES = [
  'car',
  'jeep',
  'sedan',
  'suv',
  'truck',
  'bus',
  'tractor',
];

VEHICLE_TYPES.forEach((type) => {
  registerRig(type, {
    component: CarDriveRig,
    // No pivot parts needed for constraint solver yet.
    // Add requiredParts + enrich if the car ever needs to attach to something.
  });
});