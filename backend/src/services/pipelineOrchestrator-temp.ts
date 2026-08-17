import { enrichTranscription } from "../core/transcription/enrichTranscription.js";
import { 
  segmentTranscriptionIntoSentences, 
  semanticExtractionPipeline 
} from "../core/segmentation/semanticExtraction.js";
import { narrativeAnalyzer } from "../core/narrative/narrativeAnalyzer.js";
import { selectWidgetsRobust } from "../core/planning/selectWidgetsRobust.js";
import { buildSceneConfigFromWidgets } from "../core/segmentation/buildSceneConfigFromWidgets-temp.js";

interface RawTranscriptionInput {
  text: string;
  words: Array<{ word: string; start: number; end: number }>;
}

export async function runTranscriptionToScenePipelineTemp(rawTranscription: RawTranscriptionInput, fps = 30) {
  console.log("🚀 [TEMP] Starting Video Generation Pipeline...");

  const enrichedTranscript = enrichTranscription(rawTranscription);
  const sentenceSegments = segmentTranscriptionIntoSentences(enrichedTranscript.words, fps);
  const semanticPose = await semanticExtractionPipeline(sentenceSegments);
  const narrativeScenes = narrativeAnalyzer(semanticPose);
  const selectedWidgets = await selectWidgetsRobust(narrativeScenes);

  const finalSceneConfig = buildSceneConfigFromWidgets(
    narrativeScenes, 
    selectedWidgets, 
    fps, 
    enrichedTranscript
  );

  console.log("✅ [TEMP] Scene Composition complete!");

  return {
    transcript: enrichedTranscript,
    sceneConfig: finalSceneConfig,
    semanticPose,
    narrativeScenes,
    selectedWidgets
  };
}

/**
 * Diagnostic entry point: Accepts a raw text script, builds simulated timestamps,
 * and outputs summaries and scene configs instantly without audio generation.
 */
export async function runTextOnlyPipelinePreview(
  scriptText: string, 
  fps = 30, 
  logger?: (msg: string) => void
) {
  const log = logger || console.log;

  log("Segmenting script into simulated timestamps...");
  const words = scriptText.trim().split(/\s+/).map((word, index) => ({
    word,
    start: Number((index * 0.35).toFixed(2)),
    end: Number(((index + 1) * 0.35).toFixed(2))
  }));

  const mockRawTranscription = { text: scriptText, words };

  log("Extracting semantic pose with LLM...");
  const result = await runTranscriptionToScenePipelineTemp(mockRawTranscription, fps);

  return result;
}