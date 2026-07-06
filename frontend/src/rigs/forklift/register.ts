// src/rigs/forklift/register.ts
import { registerRig } from "../../core/rigRegistry";
import { Forklift } from "./Forklift";
import { createForkliftEntity } from "./createForkliftEntity";

registerRig("forklift", {
  // 🚀 Fix: Guard against undefined by adding optional chaining and empty string fallbacks
  enrich: (entity, parts) => 
    createForkliftEntity(
      entity, 
      parts?.body ?? "", 
      parts?.fork ?? ""
    ),
  component: Forklift,
  requiredParts: {
    body: "forklift/forklift_body.svg",
    fork: "forklift/forklift_fork.svg",
    wheelBack: "forklift/forklift_wheel_back.svg",  
    wheelFront: "forklift/forklift_wheel_front.svg",
  }
});