// src/core/segmentation/buildSceneConfigFromWidgets.ts

import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { SelectedWidget } from '../planning/selectWidgetsRobust';
import { widgetRegistry } from '../widgetRegistry';
import fs from 'fs';
import path from 'path';

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
  usage?: {
    seconds?: number;
  };
};

// Strict pacing configurations (At 30 FPS)
const MIN_SCENE_DURATION_FRAMES = 90;   // 3.0 seconds minimum limit
const MAX_SCENE_DURATION_FRAMES = 180;  // 6.0 seconds maximum limit
const POST_ROLL_PADDING_FRAMES = 10;    // extra cushion after voiceover ends

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

function searchDynamicFallbackWidget(text: string, primaryWidget: string, usedWidgets: Set<string>): string {
  const cleanText = text.toLowerCase();
  let bestMatchWidget: string | null = null;
  let highestScore = -1;

  for (const [widgetType, meta] of Object.entries(widgetRegistry)) {
    if (widgetType === primaryWidget || usedWidgets.has(widgetType)) {
      continue;
    }

    const avoidKeywords = (meta as any).avoidFor || [];
    const shouldAvoid = avoidKeywords.some((keyword: string) => cleanText.includes(keyword.toLowerCase()));
    if (shouldAvoid) {
      continue;
    }

    let currentScore = 0;
    const purposeText = ((meta as any).purpose || '').toLowerCase();
    if (purposeText && purposeText.split(' ').some((word: string) => word.length > 3 && cleanText.includes(word))) {
      currentScore += 2;
    }

    const bestForKeywords = (meta as any).bestFor || [];
    bestForKeywords.forEach((keyword: string) => {
      if (cleanText.includes(keyword.toLowerCase())) {
        currentScore += 3;
      }
    });

    if (currentScore > highestScore) {
      highestScore = currentScore;
      bestMatchWidget = widgetType;
    }
  }

  if (!bestMatchWidget) {
    for (const widgetType of Object.keys(widgetRegistry)) {
      if (widgetType !== primaryWidget && !usedWidgets.has(widgetType)) {
        return widgetType;
      }
    }
  }

  return bestMatchWidget || primaryWidget;
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

  const stylizedProps = { ...props, durationInFrames: durationFrames };
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
  const usedWidgetsGlobal = new Set<string>();

  const diskTranscription = readTranscriptionFromDisk();
  const transcriptionSource = diskTranscription ?? transcription;

  // Anchor the render length to the transcript runtime instead of summed scene durations.
  const totalTargetFramesWithPadding =
    resolveTranscriptTargetFrames(transcriptionSource, beats, fps) + POST_ROLL_PADDING_FRAMES;

  let clusterStartFrame: number | null = null;
  let accumulatedText = '';
  let primaryWidgetForCluster: string | null = null;
  let combinedDataHints: Record<string, any> = {};

  const commitCluster = (sceneEndFrame: number, isLastScene: boolean = false) => {
    if (!clusterStartFrame || !primaryWidgetForCluster) return;

    const sceneDuration = Math.max(MIN_SCENE_DURATION_FRAMES, sceneEndFrame - clusterStartFrame);

    // 🚀 IMPLEMENT THE MULTI-TIERED FRAMES PADDING MATH RULES HERE:
    // If the main scene duration is more than 120 frames (> 120), subtract 60.
    // If it is 120 frames or less (<= 120), subtract 40.
    let calculatedInternalDuration = sceneDuration > 120 
      ? sceneDuration - 60 
      : sceneDuration - 40;

    // Safety fallback mesh to keep elements rendering at least 1 frame if durations are very short
    if (calculatedInternalDuration <= 0) {
      calculatedInternalDuration = Math.max(1, Math.round(sceneDuration * 0.5));
    }

    const finalProps: Record<string, any> = {
      ...combinedDataHints,
      textToAnimate: toPunchyPhrase(accumulatedText),
      durationInFrames: calculatedInternalDuration, // 👈 Override internal lifecycle property
    };

    // Keep layout-specific fallback props populated seamlessly
    if (primaryWidgetForCluster === 'TITLE_CARD') {
      finalProps.title = finalProps.textToAnimate;
      finalProps.subtitle = finalProps.textToAnimate;
    } else if (primaryWidgetForCluster === 'TEXT_ANIMATIONS_WORD_HIGHLIGHT') {
      finalProps.text = accumulatedText;
      const words = accumulatedText.split(/\s+/).filter(Boolean);
      finalProps.highlightWord = words[Math.floor(words.length / 2)] || '';
    } else {
      finalProps.text = finalProps.textToAnimate;
    }

    configurations.push({
      widget: primaryWidgetForCluster,
      startFrame: clusterStartFrame,
      durationFrames: sceneDuration,
      props: finalProps,
    });
  };

  for (let i = 0; i < selectedWidgets.length; i++) {
    const sel = selectedWidgets[i];
    const beat = beatMap.get(sel.beatId);
    if (!beat) continue;

    if (clusterStartFrame === null) {
      clusterStartFrame = beat.timing.startFrame;
    }

    if (!primaryWidgetForCluster) {
      primaryWidgetForCluster = sel.widgetType;
    }

    accumulatedText += ` ${beat.sentenceText}`;
    combinedDataHints = {
      ...combinedDataHints,
      ...(sel as SelectedWidget & { dataHints?: Record<string, any> }).dataHints,
    };

    const isLastBeat = i === selectedWidgets.length - 1;
    const currentClusterSpanFrames = Math.max(1, beat.timing.endFrame - clusterStartFrame);
    let shouldCommitScene = currentClusterSpanFrames >= MIN_SCENE_DURATION_FRAMES || isLastBeat;

    if (!shouldCommitScene && !isLastBeat) {
      const nextBeat = beatMap.get(selectedWidgets[i + 1].beatId);
      const projectedSpanFrames = Math.max(
        1,
        (nextBeat?.timing.endFrame ?? beat.timing.endFrame) - clusterStartFrame
      );
      if (projectedSpanFrames > MAX_SCENE_DURATION_FRAMES) {
        shouldCommitScene = true;
      }
    }

    if (shouldCommitScene) {
      const nextBeat = isLastBeat ? null : beatMap.get(selectedWidgets[i + 1].beatId);
      const sceneEndFrame = isLastBeat
        ? totalTargetFramesWithPadding
        : Math.max(beat.timing.endFrame, nextBeat?.timing.startFrame ?? beat.timing.endFrame);

      commitCluster(sceneEndFrame, isLastBeat);

      clusterStartFrame = null;
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
        // 🚀 Re-apply the math rule on post-roll extension changes to match perfectly
        const d = lastItem.durationFrames;
        lastItem.props.durationInFrames = d > 120 ? d - 60 : d - 40;
        
        if (lastItem.props.durationInFrames <= 0) {
          lastItem.props.durationInFrames = Math.max(1, Math.round(d * 0.5));
        }
      }
    }
  }

  return configurations;
}
