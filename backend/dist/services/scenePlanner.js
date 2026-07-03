// backend/src/services/scenePlanner.ts
import fs from "fs";
import path from "path";
import { openai } from "../lib/openai.js";
import { enrichTranscription } from "../core/transcription/enrichTranscription.js";
import { semanticExtractionPipeline, segmentTranscriptionIntoSentences, } from "../core/segmentation/semanticExtraction.js";
import { narrativeAnalyzer } from "../core/narrative/narrativeAnalyzer.js";
import { selectWidgetsRobust } from "../core/planning/selectWidgetsRobust.js";
import { buildSceneConfigFromWidgets } from "../core/segmentation/buildSceneConfigFromWidgets.js";
export async function buildScene() {
    //--------------------------------------------------------
    // Load generated voiceover
    //--------------------------------------------------------
    const audioPath = path.join(process.cwd(), "tmp", "generated_voiceover.mp3");
    if (!fs.existsSync(audioPath)) {
        throw new Error("Generated voiceover not found.");
    }
    //--------------------------------------------------------
    // Whisper transcription
    //--------------------------------------------------------
    const rawTranscription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
    });
    //--------------------------------------------------------
    // Enrich timings
    //--------------------------------------------------------
    const transcription = enrichTranscription(rawTranscription);
    if (!Array.isArray(transcription.words)) {
        throw new Error("Invalid transcription.");
    }
    //--------------------------------------------------------
    // Sentence segmentation
    //--------------------------------------------------------
    const sentenceSegments = segmentTranscriptionIntoSentences(transcription.words);
    //--------------------------------------------------------
    // Semantic extraction
    //--------------------------------------------------------
    const semanticPose = await semanticExtractionPipeline(sentenceSegments);
    //--------------------------------------------------------
    // Narrative analysis
    //--------------------------------------------------------
    const narrativeScenes = await narrativeAnalyzer(semanticPose);
    //--------------------------------------------------------
    // Widget planner
    //--------------------------------------------------------
    const selectedWidgets = await selectWidgetsRobust(narrativeScenes);
    //--------------------------------------------------------
    // Build Remotion scene config
    //--------------------------------------------------------
    const sceneConfig = buildSceneConfigFromWidgets(narrativeScenes, selectedWidgets, 30, transcription);
    //--------------------------------------------------------
    // Save debug artifacts
    //--------------------------------------------------------
    const outputDir = path.join(process.cwd(), "tmp");
    fs.mkdirSync(outputDir, {
        recursive: true,
    });
    fs.writeFileSync(path.join(outputDir, "02_transcription.json"), JSON.stringify(transcription, null, 2));
    fs.writeFileSync(path.join(outputDir, "03_semantic_pose.json"), JSON.stringify(semanticPose, null, 2));
    fs.writeFileSync(path.join(outputDir, "04_narrative_scenes.json"), JSON.stringify(narrativeScenes, null, 2));
    fs.writeFileSync(path.join(outputDir, "05_selected_widgets.json"), JSON.stringify(selectedWidgets, null, 2));
    fs.writeFileSync(path.join(outputDir, "06_scene_config.json"), JSON.stringify(sceneConfig, null, 2));
    //--------------------------------------------------------
    // Return to Fastify
    //--------------------------------------------------------
    return {
        text: transcription.text,
        words: transcription.words,
        transcription,
        sentenceSegments,
        semanticPose,
        narrativeScenes,
        selectedWidgets,
        sceneConfig,
    };
}
//# sourceMappingURL=scenePlanner.js.map