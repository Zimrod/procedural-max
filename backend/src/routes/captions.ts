// backend/src/routes/captions.ts
import { FastifyInstance } from "fastify";
import fs from "fs";
import path from "path";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";

export default async function captionsRoutes(fastify: FastifyInstance) {
    fastify.post("/captions", async (request, reply) => {
        try {
            const transcriptPath = path.join(process.cwd(), "tmp", "generated_transcript.json");

            if (!fs.existsSync(transcriptPath)) {
                return reply.code(400).send({
                    success: false,
                    error: "No transcription file found. Please generate the voiceover first."
                });
            }

            // 1. Read the cached raw transcription details from the tmp workspace
            const rawTranscriptData = JSON.parse(fs.readFileSync(transcriptPath, "utf-8"));

            // 2. Process the pipeline chain (enrichment -> extraction -> beats -> widgets -> sceneConfig)
            const fps = 30;
            const { transcript, sceneConfig } = await runTranscriptionToScenePipeline(rawTranscriptData, fps);

            // 3. Return payload matching your frontend keys: text, words, and sceneConfig
            return reply.send({
                success: true,
                text: transcript.text,
                words: transcript.words, // The enriched/synchronized words array
                sceneConfig: sceneConfig
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({
                success: false,
                error: err.message,
            });
        }
    });
}