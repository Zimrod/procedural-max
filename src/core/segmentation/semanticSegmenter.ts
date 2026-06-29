import fs from 'fs';
import path from 'path';

import type { WidgetType } from '../widgetRegistry-all-widgets';
import type { VisualStrategyOutput } from '../visual/visualStrategy';
import {
  enrichSegmentWithAI,
  type RigSelection,
} from './segmentAndClassifyWithAI';

export type SceneConfigItem = {
  sceneId: string;
  sourceSentenceId: string;
  widget: WidgetType;
  rigId: WidgetType;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  props: Record<string, any>;
  visualStrategy: VisualStrategyOutput['visualLanguage']['strategy'];
  confidence: number;
  reasoning: string;
};

export async function semanticSegmenter(
  visualStrategyScenes: VisualStrategyOutput[]
): Promise<SceneConfigItem[]> {
  const sceneConfig = await Promise.all(
    visualStrategyScenes.map((scene) =>
      buildSceneConfigItem(scene)
    )
  );

  writeSceneConfigOutputs(sceneConfig);

  return sceneConfig;
}

async function buildSceneConfigItem(
  scene: VisualStrategyOutput
): Promise<SceneConfigItem> {
  const rigSelection =
    await enrichSegmentWithAI(scene);

  return {
    sceneId: scene.sceneId,
    sourceSentenceId:
      scene.sourceSentenceId,
    widget: rigSelection.rigId,
    rigId: rigSelection.rigId,
    startSec: scene.timing.startSec,
    endSec: scene.timing.endSec,
    startFrame: scene.timing.startFrame,
    endFrame: scene.timing.endFrame,
    durationFrames:
      scene.timing.durationFrames,
    props: rigSelection.props,
    visualStrategy:
      scene.visualLanguage.strategy,
    confidence: rigSelection.confidence,
    reasoning: combineReasoning(
      scene,
      rigSelection
    ),
  };
}

function combineReasoning(
  scene: VisualStrategyOutput,
  rigSelection: RigSelection
): string {
  return `${scene.reasoning} ${rigSelection.reasoning}`;
}

function writeSceneConfigOutputs(
  sceneConfig: SceneConfigItem[]
) {
  const publicDir = path.resolve(
    process.cwd(),
    'public'
  );
  const stageOutputPath = path.join(
    publicDir,
    '08_scene_config.json'
  );
  const runtimeOutputPath = path.join(
    publicDir,
    'scene_config.json'
  );
  const serialized = JSON.stringify(
    sceneConfig,
    null,
    2
  );

  fs.writeFileSync(
    stageOutputPath,
    serialized
  );
  fs.writeFileSync(
    runtimeOutputPath,
    serialized
  );

  console.log(
    'Scene config saved:',
    stageOutputPath
  );
}
