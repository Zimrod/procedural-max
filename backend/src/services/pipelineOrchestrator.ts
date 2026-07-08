// backend/src/services/pipelineOrchestrator.ts
import { enrichTranscription } from "../core/transcription/enrichTranscription.js";
import { 
  segmentTranscriptionIntoSentences, 
  semanticExtractionPipeline 
} from "../core/segmentation/semanticExtraction.js";
import { narrativeAnalyzer } from "../core/narrative/narrativeAnalyzer.js";
import { selectWidgetsRobust } from "../core/planning/selectWidgetsRobust.js";
import { buildSceneConfigFromWidgets } from "../core/segmentation/buildSceneConfigFromWidgets.js";

interface RawTranscriptionInput {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

export async function runTranscriptionToScenePipeline(rawTranscription: RawTranscriptionInput, fps = 30) {
  console.log("🚀 Starting Video Generation Pipeline...");

  // 1. Clean and enrich transcript (Handles punctuation mappings and decimals)
  const enrichedTranscript = enrichTranscription(rawTranscription);

  // 2. Segment the continuous stream of words into physical sentences
  const sentenceSegments = segmentTranscriptionIntoSentences(enrichedTranscript.words, fps);

  // 3. Extract core visual concepts and taxonomy data via LLM Prompting
  const semanticExtractions = await semanticExtractionPipeline(sentenceSegments);

  // 4. Transform semantic Extractions into explicit production Narrative Beats
  const narrativeBeats = narrativeAnalyzer(semanticExtractions);

  // 5. Select the ideal graphical widgets from the registry based on Intent scores
  const selectedWidgets = await selectWidgetsRobust(narrativeBeats);

  // 6. Build final frame-accurate scene timeline configuration settings
  const finalSceneConfig = buildSceneConfigFromWidgets(
    narrativeBeats, 
    selectedWidgets, 
    fps, 
    enrichedTranscript
  );

  console.log("✅ Scene Composition complete!");
  
  return {
    transcript: enrichedTranscript,
    sceneConfig: finalSceneConfig
  };
}