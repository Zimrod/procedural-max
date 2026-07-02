const project = await createProject(prompt);

await updateProject(project.id, {
  script,
});

await updateProject(project.id, {
  transcript,
});

await updateProject(project.id, {
  semantic_pose,
});

await updateProject(project.id, {
  narrative_analysis,
});

await updateProject(project.id, {
  scene_config,
});