// src/rigs/human_side/register.ts
import { registerRig } from "../../core/rigRegistry";
import { HumanSideRig } from "./Humansiderig";

registerRig("human_side", {
  component: HumanSideRig,
  // No SVG pivot data needed by the constraint solver for this rig —
  // the human character doesn't currently participate in attach constraints.
  // Add requiredParts + enrich here when you need pivot-based constraints
  // (e.g. hand attaches to object on shelf).
});