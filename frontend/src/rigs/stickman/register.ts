// rigs/stickman/register.ts
import { registerRig } from "../../core/rigRegistry";
import { StickmanRig } from "./StickmanRig";

registerRig("stickman", {
  component: StickmanRig,
  // no enrich, no SVG parts
});