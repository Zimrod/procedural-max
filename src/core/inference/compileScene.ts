// src/core/inference/compileScene.ts
//
// Top-level pipeline function.
// Takes a SceneConfig (prompt + seed) and returns everything Puppeteer needs.
//
// Usage:
//   const compiled = compileScene({ prompt, seed: 42 });
//   <Puppeteer entities={compiled.entities} timeline={compiled.timeline} constraints={compiled.constraints} />
//
// Change seed → different video, same narrative intent.
// Change prompt → different scene entirely.

import { SceneConfig }           from './scenePrompt';
import { resolveIntent }         from './resolveIntent';
import { generateLayout }        from './generateLayout';
import { generateAnimation }     from './generateAnimation';
import { buildWorldLayout, applyDepthScaling, sortByDepth } from '../world/worldLayout';

export type CompiledScene = {
  entities:    any[];
  timeline:    any[];
  constraints: any[];
  // Metadata for styling the composition background
  skyColor:    string;
  groundColor: string;
};

export const compileScene = (config: SceneConfig): CompiledScene => {
  const { prompt, seed } = config;

  // Stage 2: resolve intent from prompt
  const intent = resolveIntent(prompt);

  // Stage 3: generate environment layout
  const worldLayout   = generateLayout(intent, seed);
  const rawEnvEntities = buildWorldLayout(worldLayout);
  const envEntities    = sortByDepth(applyDepthScaling(rawEnvEntities, 0.75));

  // Stage 4: generate animation entities + timeline
  const animation = generateAnimation(intent, seed);

  // Combine — environment renders behind actors (lower zIndex)
  const entities = [
    ...envEntities,
    ...animation.entities,
  ];

  return {
    entities,
    timeline:    animation.timeline,
    constraints: animation.constraints,
    skyColor:    intent.skyColor,
    groundColor: intent.groundColor,
  };
};