// rigs/oil_drum/register.ts
import { registerRig } from "../../core/rigRegistry";
import { OilDrum } from "./OilDrum";
import { createOilDrumEntity } from "./createOilDrumEntity";

registerRig("oil_drum", {
  enrich: (entity, parts) => createOilDrumEntity(entity, parts?.oil_drum ?? ""),
  component: OilDrum,
  requiredParts: {
    oil_drum: "oil_drum/oil_drum.svg"
  }
});