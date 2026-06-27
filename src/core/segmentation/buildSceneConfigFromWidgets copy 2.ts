// src/core/segmentation/buildSceneConfigFromWidgets.ts

import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { SelectedWidget } from '../planning/selectWidgetsRobust';
import { widgetRegistry } from '../widgetRegistry';

export type SceneConfigItem = {
  widget: string;
  startFrame: number;
  durationFrames: number;
  props: Record<string, any>;
};

// Strict pacing configurations (At 30 FPS)
const MIN_SCENE_DURATION_FRAMES = 90;   // 3.0 seconds minimum limit
const MAX_SCENE_DURATION_FRAMES = 180;  // 6.0 seconds maximum limit
const POST_ROLL_PADDING_FRAMES = 90;    // 3.0 seconds extra cushion after voiceover ends

/**
 * Text utility ensuring widget parameters receive short, punchy upper-case headlines
 * rather than sprawling sentences that blow out canvas boundaries.
 */
function toPunchyPhrase(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/^(in a|this shift is|for investors|but here's the kicker|by 2026)\s+/i, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .trim();

  const words = clean.split(/\s+/);
  if (words.length <= 5) {
    return clean.toUpperCase();
  }
  return words.slice(0, 4).join(" ").toUpperCase() + "...";
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

export function buildSceneConfigFromWidgets(
  beats: NarrativeBeat[],
  selectedWidgets: SelectedWidget[],
  fps: number = 30
): SceneConfigItem[] {
  const beatMap = new Map(beats.map(b => [b.beatId, b]));
  const configurations: SceneConfigItem[] = [];
  const usedWidgetsGlobal = new Set<string>();
  
  // Calculate raw audio frames AND add our 3-second post-roll safety ceiling
  const rawVoiceoverFrames = beats.reduce((sum, b) => sum + (b.timing.durationFrames || 0), 0);
  const totalTargetFramesWithPadding = rawVoiceoverFrames + POST_ROLL_PADDING_FRAMES;
  
  let currentGlobalFrame = 0;
  let accumulatedFrames = 0;
  let accumulatedText = "";
  let primaryWidgetForCluster = null;
  let combinedDataHints = {};

  for (let i = 0; i < selectedWidgets.length; i++) {
    const sel = selectedWidgets[i];
    const beat = beatMap.get(sel.beatId);
    if (!beat) continue;

    const currentDuration = beat.timing.durationFrames || 30;
    
    if (!primaryWidgetForCluster) {
      primaryWidgetForCluster = sel.widgetType;
    }

    accumulatedFrames += currentDuration;
    accumulatedText += " " + beat.sentenceText;
    combinedDataHints = { ...combinedDataHints, ...sel.dataHints };

    const isLastBeat = i === selectedWidgets.length - 1;
    let shouldCommitScene = accumulatedFrames >= MIN_SCENE_DURATION_FRAMES || isLastBeat;
    
    if (!shouldCommitScene && !isLastBeat) {
      const nextBeat = beatMap.get(selectedWidgets[i + 1].beatId);
      const nextDuration = nextBeat?.timing.durationFrames || 30;
      if (accumulatedFrames + nextDuration > MAX_SCENE_DURATION_FRAMES) {
        shouldCommitScene = true;
      }
    }

    if (shouldCommitScene) {
      // SAFE BOUNDARY CLAMP: Cap normal clustering frames so elements stay snappily between 3s and 6s
      if (isLastBeat) {
        const structuralRemainingFrames = totalTargetFramesWithPadding - currentGlobalFrame;
        if (structuralRemainingFrames > 0) {
          accumulatedFrames = structuralRemainingFrames;
        }
      }

      // Handle macro-sentence splitter block if a solitary combined scene block runs too long
      if (accumulatedFrames > MAX_SCENE_DURATION_FRAMES && !isLastBeat) {
        const firstSegmentDuration = Math.round(accumulatedFrames / 2);
        const secondSegmentDuration = accumulatedFrames - firstSegmentDuration;

        const punchyTextSnippet = toPunchyPhrase(accumulatedText);

        // Sub-scene A: Primary Cluster Component
        usedWidgetsGlobal.add(primaryWidgetForCluster);
        const registryEntry1 = widgetRegistry[primaryWidgetForCluster as keyof typeof widgetRegistry];
        const props1 = registryEntry1?.buildFallbackProps({
          shortSummary: punchyTextSnippet,
          extractedData: combinedDataHints,
          durationFrames: firstSegmentDuration,
          text: accumulatedText.trim(),
        }) || { text: punchyTextSnippet };

        // Override text strings to prevent literal full sentences from breaking properties
        const stylizedProps1 = { ...props1, durationInFrames: firstSegmentDuration };
        if (stylizedProps1.hasOwnProperty('text')) stylizedProps1.text = punchyTextSnippet;
        if (stylizedProps1.hasOwnProperty('label')) stylizedProps1.label = punchyTextSnippet;
        if (stylizedProps1.hasOwnProperty('metricLabel')) stylizedProps1.metricLabel = punchyTextSnippet;

        configurations.push({
          widget: primaryWidgetForCluster,
          startFrame: currentGlobalFrame,
          durationFrames: firstSegmentDuration,
          props: stylizedProps1,
        });
        currentGlobalFrame += firstSegmentDuration;

        // Sub-scene B: Secondary Context-Driven Search Fallback
        const secondaryWidgetType = searchDynamicFallbackWidget(accumulatedText, primaryWidgetForCluster, usedWidgetsGlobal);
        usedWidgetsGlobal.add(secondaryWidgetType);
        
        const registryEntry2 = widgetRegistry[secondaryWidgetType as keyof typeof widgetRegistry];
        const props2 = registryEntry2?.buildFallbackProps({
          shortSummary: punchyTextSnippet,
          extractedData: combinedDataHints,
          durationFrames: secondSegmentDuration,
          text: accumulatedText.trim(),
        }) || { text: punchyTextSnippet };

        const stylizedProps2 = { ...props2, durationInFrames: secondSegmentDuration };
        if (stylizedProps2.hasOwnProperty('text')) stylizedProps2.text = punchyTextSnippet;
        if (stylizedProps2.hasOwnProperty('label')) stylizedProps2.label = punchyTextSnippet;
        if (stylizedProps2.hasOwnProperty('metricLabel')) stylizedProps2.metricLabel = punchyTextSnippet;

        configurations.push({
          widget: secondaryWidgetType,
          startFrame: currentGlobalFrame,
          durationFrames: secondSegmentDuration,
          props: stylizedProps2,
        });
        currentGlobalFrame += secondSegmentDuration;

      } else {
        // Standard Pacing Block
        const punchyTextSnippet = toPunchyPhrase(accumulatedText);
        
        usedWidgetsGlobal.add(primaryWidgetForCluster);
        const registryEntry = widgetRegistry[primaryWidgetForCluster as keyof typeof widgetRegistry];
        const props = registryEntry?.buildFallbackProps({
          shortSummary: punchyTextSnippet,
          extractedData: combinedDataHints,
          durationFrames: accumulatedFrames,
          text: accumulatedText.trim(),
        }) || { text: punchyTextSnippet };

        const stylizedProps = { ...props, durationInFrames: accumulatedFrames };
        if (stylizedProps.hasOwnProperty('text')) stylizedProps.text = punchyTextSnippet;
        if (stylizedProps.hasOwnProperty('label')) stylizedProps.label = punchyTextSnippet;
        if (stylizedProps.hasOwnProperty('metricLabel')) stylizedProps.metricLabel = punchyTextSnippet;

        // If the final video trailing cushion stretches a single component beyond safety boundaries (6s / 180f),
        // we isolate the excess frames to prevent breaking Remotion's layout tree.
        if (isLastBeat && accumulatedFrames > MAX_SCENE_DURATION_FRAMES) {
          const splitNormalFrames = MAX_SCENE_DURATION_FRAMES;
          const leftoverPaddingFrames = accumulatedFrames - splitNormalFrames;

          stylizedProps.durationInFrames = splitNormalFrames;

          configurations.push({
            widget: primaryWidgetForCluster,
            startFrame: currentGlobalFrame,
            durationFrames: splitNormalFrames,
            props: stylizedProps,
          });
          currentGlobalFrame += splitNormalFrames;

          // Safe, verified fallback for extra padding space
          // configurations.push({
          //   widget: "TITLE_CARD",
          //   startFrame: currentGlobalFrame,
          //   durationFrames: leftoverPaddingFrames,
          //   props: {
          //     title: punchyTextSnippet,
          //     subtitle: "PORTFOLIO COMPLETION ANALYSIS",
          //     durationInFrames: leftoverPaddingFrames,
          //     align: "center",
          //     cinematic: true
          //   }
          // });
          currentGlobalFrame += leftoverPaddingFrames;
        } else {
          // Standard size commit path
          configurations.push({
            widget: primaryWidgetForCluster,
            startFrame: currentGlobalFrame,
            durationFrames: accumulatedFrames,
            props: stylizedProps,
          });
          currentGlobalFrame += accumulatedFrames;
        }
      }

      // Reset clustering loops cleanly for the next scene block
      accumulatedFrames = 0;
      accumulatedText = "";
      primaryWidgetForCluster = null;
      combinedDataHints = {};
    }
  }

  // Absolute fallback tracking insurance confirmation
  if (configurations.length > 0 && currentGlobalFrame < totalTargetFramesWithPadding) {
    const finalItem = configurations[configurations.length - 1];
    const missingFrames = totalTargetFramesWithPadding - currentGlobalFrame;
    
    // Instead of forcing a specific title layout name, route to generic baseline text types
    if (finalItem.widget !== "TEXT" && finalItem.durationFrames + missingFrames <= MAX_SCENE_DURATION_FRAMES) {
      finalItem.durationFrames += missingFrames;
      if (finalItem.props) {
        finalItem.props.durationInFrames = finalItem.durationFrames;
      }
    } 
    // else {
    //   configurations.push({
    //     widget: "TEXT", // 💡 Enforce the baseline type category configuration
    //     startFrame: currentGlobalFrame,
    //     durationFrames: missingFrames,
    //     props: {
    //       text: "SYSTEM CONTINUITY PROGRESSION",
    //       durationInFrames: missingFrames,
    //       fontSize: 48,
    //       fontWeight: "800",
    //     }
    //   });
    // }
  }

  return configurations;
}