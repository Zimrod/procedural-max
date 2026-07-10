// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";

const pipelineCache = new Map<string, { status: "processing" | "done" | "failed"; data?: any; error?: string }>();

export default async function voiceoverRoutes(fastify: FastifyInstance) {
    
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body as { script: string };

            // 1. Generate audio buffer & get both path and its Base64 string
            const { audioLocalPath, base64Audio } = await generateVoiceover(script);
            
            // Create your unique job key
            const jobId = Buffer.from(audioLocalPath).toString("base64");
            pipelineCache.set(jobId, { status: "processing" });

            // 2. Fire background calculations using local path
            (async () => {
                try {
                    const rawTranscript = await generateTranscription(audioLocalPath);
                    const pipelineData = await runTranscriptionToScenePipeline(rawTranscript, 30);
                    
                    pipelineCache.set(jobId, {
                        status: "done",
                        data: pipelineData
                    });
                } catch (err: any) {
                    pipelineCache.set(jobId, { status: "failed", error: err.message });
                }
            })();

            // 3. Return the Base64 Data URI straight to the browser instantly!
            return reply.send({
                success: true,
                audioDataUri: `data:audio/mpeg;base64,${base64Audio}`,
                jobId: jobId 
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // ENDPOINT C: Polling target remains exactly the same
    fastify.get("/voiceover/status/:jobId", async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const job = pipelineCache.get(jobId);

        if (!job) {
            return reply.code(404).send({ success: false, error: "Job pipeline window not found." });
        }

        return reply.send({
            success: true,
            status: job.status,
            result: job.status === "done" ? job.data : null,
            error: job.error
        });
    });
}