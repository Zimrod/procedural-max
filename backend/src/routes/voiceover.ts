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

            // 1. Synthesize audio and push it to Supabase cloud storage
            const { audioLocalPath, publicUrl } = await generateVoiceover(script);
            
            // Generate a job ID based on the unique public URL reference
            const jobId = Buffer.from(publicUrl).toString("base64");
            pipelineCache.set(jobId, { status: "processing" });

            // 2. Run your background transcriptions using the local disk asset
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

            // 3. Hand back the verified public asset link straight to the frontend
            return reply.send({
                success: true,
                audioUrl: publicUrl, // 👈 Clean, un-truncated remote link
                jobId: jobId 
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // ENDPOINT C: Polling target remains identical
    fastify.get("/voiceover/status/:jobId", async (request, reply) => {
        const { jobId } = request.params as { jobId: string };
        const job = pipelineCache.get(jobId);

        if (!job) {
            return reply.code(404).send({ success: false, error: "Job status trace windows not found." });
        }

        return reply.send({
            success: true,
            status: job.status,
            result: job.status === "done" ? job.data : null,
            error: job.error
        });
    });
}