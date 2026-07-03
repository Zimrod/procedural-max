// core/rigRegistry.ts
import { ComponentType } from "react";

type RigDefinition = {
  // Optional: convert raw entity into enriched one (with getPivots)
  enrich?: (entity: any, parts?: Record<string, any>) => any;
  // React component to render
  component: ComponentType<any>;
  // SVG parts needed for pivot loading (if any)
  requiredParts?: Record<string, string>;
};

export const rigRegistry = new Map<string, RigDefinition>();

export function registerRig(type: string, def: RigDefinition) {
  rigRegistry.set(type, def);
}