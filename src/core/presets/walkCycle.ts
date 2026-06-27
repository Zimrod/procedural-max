// src/core/presets/walkCycle.ts
//
// A simple walk cycle preset for stickman rigs. Outputs a `walkPhase` value
// that loops from 0 to 1, which can be used to drive leg and arm movement.
export const walkCycle = (frame: number, { speed = 0.02 }: { speed?: number }) => ({
  walkPhase: (frame * speed) % 1,
});