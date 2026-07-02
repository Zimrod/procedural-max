// src/core/validate.ts

// You can use 'any' for the MVP stage to avoid importing rigid type matrices,
// or match your VisualStrategyOutput/SceneConfig types.
export function validateSceneConfig(scene: any): boolean {
  if (!scene || !Array.isArray(scene.entities)) {
    console.warn("Validation failed: Scene or entities array is missing.");
    return false;
  }

  const entityIds = new Set(scene.entities.map((e: any) => e.id));

  if (Array.isArray(scene.constraints)) {
    scene.constraints.forEach((c: any) => {
      if (c?.source?.entityId && !entityIds.has(c.source.entityId)) {
        console.warn(`Missing source entity reference: ${c.source.entityId} in scene context.`);
      }
      if (c?.target?.entityId && !entityIds.has(c.target.entityId)) {
        console.warn(`Missing target entity reference: ${c.target.entityId} in scene context.`);
      }
    });
  }

  return true;
}