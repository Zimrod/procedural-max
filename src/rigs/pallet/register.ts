// rigs/pallet/register.ts
import { registerRig } from "../../core/rigRegistry";
import { Pallet } from "./Pallet";
import { createPalletEntity } from "./createPalletEntity";

registerRig("pallet", {
  enrich: (entity, parts) => createPalletEntity(entity, parts.pallet),
  component: Pallet,
  requiredParts: {
    pallet: "pallet/pallet.svg", // logical name 'pallet' maps to file path
  },
});