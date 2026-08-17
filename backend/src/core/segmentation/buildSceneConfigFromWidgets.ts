// src/core/segmentation/buildSceneConfigFromWidgets.ts

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
 * Turns transcript sentences into short, topic-driven scene titles instead of
 * reproducing the full sentence verbatim in the config.
 */
const SUMMARY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'our',
  'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to', 'we', 'were',
  'with', 'you', 'your', 'into', 'about', 'through', 'using', 'while', 'which',
  'what', 'when', 'where', 'why', 'how', 'also', 'just', 'like', 'more', 'most',
  'over', 'under', 'after', 'before', 'because', 'around', 'across', 'again',
  'there', 'here', 'all', 'some', 'any', 'each', 'every', 'these', 'those', 'our',
  'company', 'people', 'story'
]);

export function summarizeSentenceToHeadline(text: string): string {
  const rawText = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!rawText) return '';

  const sentence = rawText
    .replace(/[“”"'`]/g, '')
    .replace(/\s+(?:by|using|through|with|via|that|which|while|because|as)\s+/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const candidate = sentence.split(/(?<=[.!?])\s+|;\s+|\s+-\s+/).find((part) => part && part.length > 12) ?? sentence;
  const tokens = candidate
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
    .filter((token) => token.length > 1 && !SUMMARY_STOP_WORDS.has(token.toLowerCase()))
    .slice(0, 5);

  if (tokens.length === 0) {
    const fallback = sentence
      .split(/\s+/)
      .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
      .filter(Boolean)
      .slice(0, 4);

    return fallback.length > 0 ? fallback.join(' ').toUpperCase() : rawText.slice(0, 32).toUpperCase();
  }

  return tokens.join(' ').toUpperCase();
}

export function buildBulletItemsFromText(text: string): string[] {
  const rawText = (text ?? '').replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (!rawText) return [];

  const bulletCandidates = rawText
    .split(/\n|•|▪|\u2022|\s+-\s+|\s*\|\s*|;\s+/)
    .map((part) => part.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  const explicitBullets = bulletCandidates.length > 1
    ? bulletCandidates
    : rawText
        .split(/(?<=[.!?])\s+|\s+(?:and|but|however)\s+/i)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => part.length > 12);

  const summarized = explicitBullets
    .map((item) => summarizeSentenceToHeadline(item))
    .filter((item) => item && item.length > 0)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  if (summarized.length > 0) {
    return summarized.slice(0, 4);
  }

  return [summarizeSentenceToHeadline(rawText)].filter(Boolean);
}

function toPunchyPhrase(text: string): string {
  return summarizeSentenceToHeadline(text);
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
  // Semantic copy is used for scene widgets; the transcript remains for timing/captions.
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

    const selectedIdea = beat.selectedIdeas?.[0];
    // The selected phrase is grounded in the transcript. The meaning field is
    // explanatory metadata and can drift when compressed, so use it only when
    // an extraction did not provide a phrase.
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
