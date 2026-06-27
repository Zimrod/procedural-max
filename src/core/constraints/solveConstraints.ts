// solveConstraints.ts

/**
 * Resolves attach constraints in dependency order.
 *
 * Key fix: instead of sorting by hardcoded entity names, we build a
 * dependency graph so that any constraint whose source entity is itself
 * a target of another constraint always runs AFTER the constraint that
 * positions it.  This is the general form of what ForkliftScene does
 * manually: forklift drives pallet, pallet drives drums — each layer
 * must be settled before the next one reads its pivots.
 */
export const solveConstraints = (entities: any[], constraints: any[], frame: number) => {
  const entityMap = new Map(entities.map((e) => [e.id, { ...e }]));

  // Build a topological order for constraints.
  // A constraint B depends on constraint A if A's target is B's source.
  const ordered = topologicalSort(constraints);

  ordered.forEach((constraint) => {
    const { type, source, target, active, axis = "xy", offset } = constraint as any;
    if (frame < active.start || frame > active.end) return;

    if (type === "attach") {
      const sourceEntity = entityMap.get(source.entityId);
      const targetEntity = entityMap.get(target.entityId);

      if (!sourceEntity || !targetEntity) {
        console.warn(
          `[solveConstraints] Missing entity for constraint "${constraint.id}": ` +
            `source="${source.entityId}" target="${target.entityId}"`
        );
        return;
      }

      // getPivots() must be called AFTER sourceEntity has been repositioned
      // by any earlier constraint — which topological ordering guarantees.
      const sourcePivots = sourceEntity.getPivots?.();
      const targetPivots = targetEntity.getPivots?.();

      if (!sourcePivots || !targetPivots) {
        console.warn(
          `[solveConstraints] getPivots() missing on entity in constraint "${constraint.id}"`
        );
        return;
      }

      const sp = sourcePivots[source.pivot];
      const tp = targetPivots[target.pivot];

      if (!sp) {
        console.warn(
          `[solveConstraints] Pivot "${source.pivot}" not found on "${source.entityId}". ` +
            `Available: ${Object.keys(sourcePivots).join(", ")}`
        );
        return;
      }
      if (!tp) {
        console.warn(
          `[solveConstraints] Pivot "${target.pivot}" not found on "${target.entityId}". ` +
            `Available: ${Object.keys(targetPivots).join(", ")}`
        );
        return;
      }

      // Snap: move target so its pivot aligns with source pivot, optionally
      // preserving a configured world-space offset. axis can be "xy"/"both"
      // (default), "x", or "y".
      const resolvedAxis = axis === "both" ? "xy" : axis;
      const desiredX = sp.x + (offset?.x ?? 0);
      const desiredY = sp.y + (offset?.y ?? 0);
      const dx = desiredX - tp.x;
      const dy = desiredY - tp.y;

      targetEntity.transform = {
        ...targetEntity.transform,
        x: resolvedAxis === "y" ? targetEntity.transform.x : targetEntity.transform.x + dx,
        y: resolvedAxis === "x" ? targetEntity.transform.y : targetEntity.transform.y + dy,
      };
    }
  });

  return Array.from(entityMap.values());
};

/**
 * Topological sort of constraints.
 *
 * A constraint whose source entity is the target entity of another
 * constraint must come after it.  This handles arbitrary chain depth
 * (forklift → pallet → drum) without hardcoding entity names.
 */
function topologicalSort(constraints: any[]): any[] {
  // Map: entityId → the constraints that move it (i.e. where it is a target)
  const movedBy = new Map<string, string[]>(); // entityId → constraintIds
  constraints.forEach((c) => {
    const list = movedBy.get(c.target.entityId) ?? [];
    list.push(c.id);
    movedBy.set(c.target.entityId, list);
  });

  // Build dependency edges: constraintId → [constraintIds it must come after]
  const deps = new Map<string, string[]>();
  constraints.forEach((c) => {
    deps.set(c.id, movedBy.get(c.source.entityId) ?? []);
  });

  const result: any[] = [];
  const visited = new Set<string>();
  const inProgress = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    if (inProgress.has(id)) {
      console.warn(`[solveConstraints] Circular constraint dependency detected at "${id}"`);
      return;
    }
    inProgress.add(id);
    (deps.get(id) || []).forEach(visit);
    inProgress.delete(id);
    visited.add(id);
    const c = constraints.find((c) => c.id === id);
    if (c) result.push(c);
  };

  constraints.forEach((c) => visit(c.id));
  return result;
}
