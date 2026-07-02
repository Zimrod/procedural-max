// src/core/segmentation/buildSceneConfigFromWidgets.ts

import fs from 'fs';
import path from 'path';

import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { SelectedWidget } from '../planning/selectWidgetsRobust';
import { widgetRegistry } from '../widgetRegistry';

export type SceneConfigItem = {
  widget: string;
  startFrame: number;
  durationFrames: number;
  props: Record<string, any>;
};

type TranscriptionLike = {
  duration?: number;
  usage?: {
    seconds?: number;
  };
  words?: {
    word: string;
    start: number;
    end: number;
  }[];
};

type DiskTranscription = TranscriptionLike & {
  text?: string;
};

// Strict pacing configurations (At 30 FPS)
const MIN_SCENE_DURATION_FRAMES = 90;   // 3.0 seconds minimum limit
const MAX_SCENE_DURATION_FRAMES = 180;  // 6.0 seconds maximum limit
const POST_ROLL_PADDING_FRAMES = 10;    // Small cushion so the render never cuts off early

function applyInternalDurationRule(durationFrames: number): number {
  return durationFrames > 120
    ? Math.max(1, durationFrames - 60)
    : Math.max(1, durationFrames - 40);
}

/**
 * Text utility ensuring widget parameters receive short, punchy upper-case headlines
 * rather than sprawling sentences that blow out canvas boundaries.
 */
function toPunchyPhrase(text: string): string {
  if (!text) return '';

  const clean = text
    .replace(/^(in a|this shift is|for investors|but here's the kicker|by 2026)\s+/i, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim();

  const words = clean.split(/\s+/);
  if (words.length <= 5) {
    return clean.toUpperCase();
  }

  return words.slice(0, 4).join(' ').toUpperCase() + '...';
}

function resolveTranscriptTargetFrames(
  transcription: TranscriptionLike | null | undefined,
  beats: NarrativeBeat[],
  fps: number
): number {
  const transcriptionSeconds =
    transcription?.usage?.seconds ??
    transcription?.duration ??
    transcription?.words?.[transcription.words.length - 1]?.end ??
    beats.reduce((max, beat) => Math.max(max, beat.timing.endSec || 0), 0);

  return Math.max(1, Math.ceil(transcriptionSeconds * fps));
}

function readTranscriptionFromDisk(): DiskTranscription | null {
  const transcriptionPath = path.resolve(process.cwd(), 'public', '02_transcription.json');

  if (!fs.existsSync(transcriptionPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(transcriptionPath, 'utf-8');
    return JSON.parse(raw) as DiskTranscription;
  } catch {
    return null;
  }
}

function buildSceneProps(
  widgetType: string,
  text: string,
  durationFrames: number,
  combinedDataHints: Record<string, any>
) {
  const punchyTextSnippet = toPunchyPhrase(text);
  const registryEntry = widgetRegistry[widgetType as keyof typeof widgetRegistry];
  const props =
    registryEntry?.buildFallbackProps({
      shortSummary: punchyTextSnippet,
      extractedData: combinedDataHints,
      durationFrames,
      text: text.trim(),
    }) || { text: punchyTextSnippet };

  const stylizedProps: Record<string, any> = { ...props, durationInFrames: durationFrames };
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'text')) stylizedProps.text = punchyTextSnippet;
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'label')) stylizedProps.label = punchyTextSnippet;
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'metricLabel')) stylizedProps.metricLabel = punchyTextSnippet;

  return stylizedProps;
}

export function buildSceneConfigFromWidgets(
  beats: NarrativeBeat[],
  selectedWidgets: SelectedWidget[],
  fps: number = 30,
  transcription?: TranscriptionLike | null
): SceneConfigItem[] {
  const beatMap = new Map(beats.map((beat) => [beat.beatId, beat]));
  const configurations: SceneConfigItem[] = [];

  const diskTranscription = readTranscriptionFromDisk();
  const transcriptionSource = diskTranscription ?? transcription;

  // Anchor the render length to the transcript runtime instead of just summing spoken fragments.
  const totalTargetFramesWithPadding =
    resolveTranscriptTargetFrames(transcriptionSource, beats, fps) + POST_ROLL_PADDING_FRAMES;

  let clusterStartFrame: number | null = null;
  let clusterEndFrame = 0;
  let accumulatedText = '';
  let primaryWidgetForCluster: string | null = null;
  let combinedDataHints: Record<string, any> = {};

  const commitCluster = (sceneEndFrame: number) => {
    if (clusterStartFrame === null || !primaryWidgetForCluster) {
      return;
    }

    const sceneDuration = Math.max(1, sceneEndFrame - clusterStartFrame);
    const internalDuration = applyInternalDurationRule(sceneDuration);
    const stylizedProps = buildSceneProps(primaryWidgetForCluster, accumulatedText, internalDuration, combinedDataHints);

    configurations.push({
      widget: primaryWidgetForCluster,
      startFrame: clusterStartFrame,
      durationFrames: sceneDuration,
      props: stylizedProps,
    });
  };

  for (let i = 0; i < selectedWidgets.length; i++) {
    const sel = selectedWidgets[i];
    const beat = beatMap.get(sel.beatId);
    if (!beat) continue;

    if (clusterStartFrame === null) {
      clusterStartFrame = beat.timing.startFrame;
      clusterEndFrame = beat.timing.endFrame;
    }

    if (!primaryWidgetForCluster) {
      primaryWidgetForCluster = sel.widgetType;
    }

    accumulatedText += ` ${beat.sentenceText}`;
    combinedDataHints = {
      ...combinedDataHints,
      ...(sel as SelectedWidget & { dataHints?: Record<string, any> }).dataHints,
    };
    clusterEndFrame = Math.max(clusterEndFrame, beat.timing.endFrame);

    const isLastBeat = i === selectedWidgets.length - 1;
    const currentClusterSpanFrames = Math.max(1, clusterEndFrame - clusterStartFrame);
    let shouldCommitScene = currentClusterSpanFrames >= MIN_SCENE_DURATION_FRAMES || isLastBeat;

    if (!shouldCommitScene && !isLastBeat) {
      const nextBeat = beatMap.get(selectedWidgets[i + 1].beatId);
      const projectedSpanFrames = Math.max(
        1,
        (nextBeat?.timing.endFrame ?? clusterEndFrame) - clusterStartFrame
      );

      if (projectedSpanFrames > MAX_SCENE_DURATION_FRAMES) {
        shouldCommitScene = true;
      }
    }

    if (shouldCommitScene) {
      const nextBeat = isLastBeat ? null : beatMap.get(selectedWidgets[i + 1].beatId);
      const sceneEndFrame = isLastBeat
        ? totalTargetFramesWithPadding
        : Math.max(clusterEndFrame, nextBeat?.timing.startFrame ?? clusterEndFrame);

      commitCluster(sceneEndFrame);

      clusterStartFrame = null;
      clusterEndFrame = 0;
      accumulatedText = '';
      primaryWidgetForCluster = null;
      combinedDataHints = {};
    }
  }

  // Ensure the final composition matches the transcript runtime + padding buffer.
  if (configurations.length > 0) {
    const lastItem = configurations[configurations.length - 1];
    const expectedCompositionEnd = totalTargetFramesWithPadding;
    const currentCompositionEnd = lastItem.startFrame + lastItem.durationFrames;

    if (currentCompositionEnd < expectedCompositionEnd) {
      const missingFrames = expectedCompositionEnd - currentCompositionEnd;
      lastItem.durationFrames += missingFrames;

      if (lastItem.props) {
        lastItem.props.durationInFrames = applyInternalDurationRule(lastItem.durationFrames);
      }
    } else if (lastItem.props) {
      lastItem.props.durationInFrames = applyInternalDurationRule(lastItem.durationFrames);
    }
  }

  return configurations;
}
