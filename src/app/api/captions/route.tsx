// src/app/api/captions/route.tsx

import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import path from "path";
import fs from "fs";

import { enrichTranscription } from "../../../core/transcription/enrichTranscription";
import {
  semanticExtractionPipeline,
  segmentTranscriptionIntoSentences,
} from "../../../core/segmentation/semanticExtraction";
import { narrativeAnalyzer } from "../../../core/narrative/narrativeAnalyzer";

// import { selectWidgets } from "../../../core/planning/selectWidgets";
import { selectWidgetsRobust } from "../../../core/planning/selectWidgetsRobust";
import { buildSceneConfigFromWidgets } from "../../../core/segmentation/buildSceneConfigFromWidgets";

export async function POST() {
  try {
    const publicPath = path.join(
      process.cwd(),
      "public",
      "generated_voiceover.mp3"
    );

    if (!fs.existsSync(publicPath)) {
      throw new Error("Voiceover file not found.");
    }

    const apiKey = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // ---------------------------------------------------
    // 1. TRANSCRIBE
    // ---------------------------------------------------
    const rawTranscription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(publicPath),
      model: "whisper-1",
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });

    // ---------------------------------------------------
    // 2. ENRICH WORD TIMINGS
    // ---------------------------------------------------
    const transcription = enrichTranscription(rawTranscription);

    // Guard checking matching structure from your old verified route file
    if (!Array.isArray(transcription.words)) {
      throw new Error("Transcription words are missing or invalid.");
    }

    const transcriptionPath = path.resolve(process.cwd(), "public", "02_transcription.json");
    fs.writeFileSync(transcriptionPath, JSON.stringify(transcription, null, 2));

    // ---------------------------------------------------
    // 3. TAXONOMY PIPELINE & SCENE EXTRACTION
    // ---------------------------------------------------
    
    // Pass ONLY the enriched word array matching the old working configuration
    const sentenceSegments = segmentTranscriptionIntoSentences(
      transcription.words
    );

    const semanticPose = await semanticExtractionPipeline(
      sentenceSegments
    );

    const narrativeScenes = await narrativeAnalyzer(
      semanticPose
    );

    // Step A: Map beats directly using our updated robust deterministic taxonomy processor
    const selectedWidgets = await selectWidgetsRobust(narrativeScenes);

    // Step B: Build the clean frame-accurate scene config array for your Remotion player
    const sceneConfig = buildSceneConfigFromWidgets(
      narrativeScenes,
      selectedWidgets,
      30,
      transcription
    );

    // ---------------------------------------------------
    // 4. WRITE PERSISTENT FILE BACKUPS
    // ---------------------------------------------------
    const semanticPosePath = path.resolve(
      process.cwd(),
      "public",
      "semantic_pose.json"
    );
    fs.writeFileSync(semanticPosePath, JSON.stringify(semanticPose, null, 2));

    const sceneConfigPath = path.resolve(
      process.cwd(),
      "public",
      "08_scene_config.json"
    );
    fs.writeFileSync(sceneConfigPath, JSON.stringify(sceneConfig, null, 2));

    const runtimeSceneConfigPath = path.resolve(
      process.cwd(),
      "public",
      "scene_config.json"
    );
    fs.writeFileSync(runtimeSceneConfigPath, JSON.stringify(sceneConfig, null, 2));

    // ---------------------------------------------------
    // RESPONSE (Returning data seamlessly back to your testing sidebar)
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      text: transcription.text,
      words: transcription.words,
      sentenceSegments,
      narrativeScenes,
      selectedWidgets,  
      sceneConfig,      
      semanticPose,
    });

  } catch (err: any) {
    console.error("API Error:", err);

    return NextResponse.json(
      {
        error: err.message,
      },
      {
        status: 500,
      }
    );
  }
}
