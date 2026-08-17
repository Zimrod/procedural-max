import fs from 'fs';
import path from 'path';

import { NarrativeBeat } from '../narrative/narrativeAnalyzer.js';
import { SelectedWidget } from '../planning/selectWidgetsRobust.js';
import { widgetRegistry } from '../widgetRegistry.js';

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

const MIN_SCENE_DURATION_FRAMES = 90;
const MAX_SCENE_DURATION_FRAMES = 180;
const POST_ROLL_PADDING_FRAMES = 10;

function applyInternalDurationRule(durationFrames: number): number {
  return durationFrames > 120
    ? Math.max(1, durationFrames - 60)
    : Math.max(1, durationFrames - 40);
}

const SUMMARY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'our',
  'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to', 'we', 'were',
  'with', 'you', 'your', 'into', 'about', 'through', 'using', 'while', 'which',
  'what', 'when', 'where', 'why', 'how', 'also', 'just', 'like', 'more', 'most',
  'over', 'under', 'after', 'before', 'because', 'around', 'across', 'again',
  'there', 'here', 'all', 'some', 'any', 'each', 'every', 'these', 'those'
]);

/**
 * Creates grammatically complete, non-clipped headlines.
 */
export function summarizeSentenceToHeadline(text: string): string {
  const rawText = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!rawText) return '';

  const cleanText = rawText.replace(/[“”"'`]/g, '');
  const clauses = cleanText.split(/(?<=[.!?])\s+|;\s+|\s+-\s+/);
  const primaryClause = clauses.find((clause) => clause.length > 10) ?? cleanText;

  const words = primaryClause.split(/\s+/);
  if (words.length <= 6) {
    return primaryClause.toUpperCase();
  }

  const filteredWords = words.filter(
    (w) => !SUMMARY_STOP_WORDS.has(w.toLowerCase().replace(/[^a-z0-9]/gi, ''))
  );

  const headline = (filteredWords.length >= 3 ? filteredWords : words)
    .slice(0, 5)
    .join(' ')
    .toUpperCase();

  return headline;
}

/**
 * Generates distinct primary and secondary visual strings to prevent 
 * title/subtitle duplication.
 */
export function extractStructuredSceneCopy(text: string) {
  const headline = summarizeSentenceToHeadline(text);
  const sentenceClean = text.trim();

  // If sentence is short, use it as subtext; otherwise default to null to avoid duplication
  const supportingDetail = sentenceClean.length > headline.length + 10 ? sentenceClean : '';

  return { headline, supportingDetail };
}

function buildSceneProps(
  widgetType: string,
  text: string,
  durationFrames: number,
  combinedDataHints: Record<string, any>
) {
  const { headline, supportingDetail } = extractStructuredSceneCopy(text);
  const registryEntry = widgetRegistry[widgetType as keyof typeof widgetRegistry];

  const props = registryEntry?.buildFallbackProps({
    shortSummary: headline,
    extractedData: combinedDataHints,
    durationFrames,
    text: text.trim(),
  }) || { text: headline };

  const stylizedProps: Record<string, any> = { ...props, durationInFrames: durationFrames };

  // Enforce distinct headline vs supporting subtext mapping across widget properties
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'text')) stylizedProps.text = headline;
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'title')) stylizedProps.title = headline;
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'label')) stylizedProps.label = headline;
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'metricLabel')) stylizedProps.metricLabel = headline;
  
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'subtitle')) {
    stylizedProps.subtitle = supportingDetail;
  }
  if (Object.prototype.hasOwnProperty.call(stylizedProps, 'description')) {
    stylizedProps.description = supportingDetail;
  }

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

  const totalTargetFramesWithPadding =
    Math.max(1, Math.ceil((transcription?.words?.[transcription.words.length - 1]?.end ?? 10) * fps)) +
    POST_ROLL_PADDING_FRAMES;

  let clusterStartFrame: number | null = null;
  let clusterEndFrame = 0;
  let accumulatedText = '';
  let primaryWidgetForCluster: string | null = null;
  let combinedDataHints: Record<string, any> = {};

  const commitCluster = (sceneEndFrame: number) => {
    if (clusterStartFrame === null || !primaryWidgetForCluster) return;

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

    const selectedIdea = beat.selectedIdeas?.[0];
    const semanticCopy = selectedIdea?.phrase || selectedIdea?.meaning || beat.sentenceText;
    accumulatedText += `${accumulatedText ? '. ' : ''}${semanticCopy}`;
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

  return configurations;
}