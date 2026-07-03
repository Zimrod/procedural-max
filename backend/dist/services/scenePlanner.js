"use strict";
// backend/src/services/scenePlanner.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScene = buildScene;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_1 = require("../lib/openai");
const enrichTranscription_1 = require("../core/transcription/enrichTranscription");
const semanticExtraction_1 = require("../core/segmentation/semanticExtraction");
const narrativeAnalyzer_1 = require("../core/narrative/narrativeAnalyzer");
const selectWidgetsRobust_1 = require("../core/planning/selectWidgetsRobust");
const buildSceneConfigFromWidgets_1 = require("../core/segmentation/buildSceneConfigFromWidgets");
async function buildScene() {
    //--------------------------------------------------------
    // Load generated voiceover
    //--------------------------------------------------------
    const audioPath = path_1.default.join(process.cwd(), "tmp", "generated_voiceover.mp3");
    if (!fs_1.default.existsSync(audioPath)) {
        throw new Error("Generated voiceover not found.");
    }
    //--------------------------------------------------------
    // Whisper transcription
    //--------------------------------------------------------
    const rawTranscription = await openai_1.openai.audio.transcriptions.create({
        file: fs_1.default.createReadStream(audioPath),
        model: "whisper-1",
        response_format: "verbose_json",
        timestamp_granularities: ["word"],
    });
    //--------------------------------------------------------
    // Enrich timings
    //--------------------------------------------------------
    const transcription = (0, enrichTranscription_1.enrichTranscription)(rawTranscription);
    if (!Array.isArray(transcription.words)) {
        throw new Error("Invalid transcription.");
    }
    //--------------------------------------------------------
    // Sentence segmentation
    //--------------------------------------------------------
    const sentenceSegments = (0, semanticExtraction_1.segmentTranscriptionIntoSentences)(transcription.words);
    //--------------------------------------------------------
    // Semantic extraction
    //--------------------------------------------------------
    const semanticPose = await (0, semanticExtraction_1.semanticExtractionPipeline)(sentenceSegments);
    //--------------------------------------------------------
    // Narrative analysis
    //--------------------------------------------------------
    const narrativeScenes = await (0, narrativeAnalyzer_1.narrativeAnalyzer)(semanticPose);
    //--------------------------------------------------------
    // Widget planner
    //--------------------------------------------------------
    const selectedWidgets = await (0, selectWidgetsRobust_1.selectWidgetsRobust)(narrativeScenes);
    //--------------------------------------------------------
    // Build Remotion scene config
    //--------------------------------------------------------
    const sceneConfig = (0, buildSceneConfigFromWidgets_1.buildSceneConfigFromWidgets)(narrativeScenes, selectedWidgets, 30, transcription);
    //--------------------------------------------------------
    // Save debug artifacts
    //--------------------------------------------------------
    const outputDir = path_1.default.join(process.cwd(), "tmp");
    fs_1.default.mkdirSync(outputDir, {
        recursive: true,
    });
    fs_1.default.writeFileSync(path_1.default.join(outputDir, "02_transcription.json"), JSON.stringify(transcription, null, 2));
    fs_1.default.writeFileSync(path_1.default.join(outputDir, "03_semantic_pose.json"), JSON.stringify(semanticPose, null, 2));
    fs_1.default.writeFileSync(path_1.default.join(outputDir, "04_narrative_scenes.json"), JSON.stringify(narrativeScenes, null, 2));
    fs_1.default.writeFileSync(path_1.default.join(outputDir, "05_selected_widgets.json"), JSON.stringify(selectedWidgets, null, 2));
    fs_1.default.writeFileSync(path_1.default.join(outputDir, "06_scene_config.json"), JSON.stringify(sceneConfig, null, 2));
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