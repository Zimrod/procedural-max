const entityIds = new Set(scene.entities.map(e => e.id));

scene.constraints.forEach((c) => {
  if (!entityIds.has(c.source.entityId)) {
    console.warn(`Missing source entity: ${c.source.entityId}`);
  }
  if (!entityIds.has(c.target.entityId)) {
    console.warn(`Missing target entity: ${c.target.entityId}`);
  }
});