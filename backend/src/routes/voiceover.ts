// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import fs from "fs";
import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";

// Ephemeral in-memory job state cache
const pipelineCache = new Map<string, { status: "processing" | "done" | "failed"; data?: any; error?: string; audioPath?: string }>();

export default async function voiceoverRoutes(fastify: FastifyInstance) {
    
    // ENDPOINT A: Generate Voiceover quickly and kick off background math
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body as { script: string };
            console.log('Script in voiceover.tsx: ', script);   

            // 1. Synthesize audio output file to disk as fast as possible
            const audioLocalPath = await generateVoiceover(script);
            
            // Create a deterministic unique key for this specific generation run
            const jobId = Buffer.from(audioLocalPath).toString("base64");
            pipelineCache.set(jobId, { status: "processing", audioPath: audioLocalPath });

            // 2. Fire-and-forget: Trigger heavy transcription and extraction on background thread
            // This prevents the HTTP thread from hanging or timing out
            (async () => {
                try {
                    const rawTranscript = await generateTranscription(audioLocalPath);
                    console.log('Raw transcript: ', rawTranscript);
                    const pipelineData = await runTranscriptionToScenePipeline(rawTranscript, 30);
                    
                    pipelineCache.set(jobId, {
                        status: "done",
                        data: pipelineData,
                        audioPath: audioLocalPath,
                    });
                } catch (err: any) {
                    pipelineCache.set(jobId, { status: "failed", error: err.message, audioPath: audioLocalPath });
                }
            })();

            // 3. Return the browser-safe audio URL instantly so the frontend audio player can play it immediately
            return reply.send({
                success: true,
                audioUrl: `/voiceover/audio/${jobId}`,
                jobId: jobId // Hand this key to frontend so it can check status later
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // ENDPOINT B: Stream generated voiceover audio for browser playback
    fastify.get("/voiceover/audio/:jobId", async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const job = pipelineCache.get(jobId);

        if (!job?.audioPath || !fs.existsSync(job.audioPath)) {
            return reply.code(404).send({ success: false, error: "Audio file not found." });
        }

        const stream = fs.createReadStream(job.audioPath);
        reply.header("Content-Type", "audio/mpeg");
        return reply.send(stream);
    });

    // ENDPOINT C: Lightweight status check/polling target
    fastify.get("/voiceover/status/:jobId", async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const job = pipelineCache.get(jobId);

        if (!job) {
            return reply.code(404).send({ success: false, error: "Job pipeline execution window not found." });
        }

        return reply.send({
            success: true,
            status: job.status,
            result: job.status === "done" ? job.data : null,
            error: job.error
        });
    });
}