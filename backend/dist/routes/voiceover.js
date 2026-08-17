import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default async function voiceoverRoutes(fastify) {
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body;
            // 1. Generate Voiceover and upload to storage bucket
            const { audioLocalPath, publicUrl } = await generateVoiceover(script);
            // Create a unique UUID primary key identifier for the row
            const projectId = crypto.randomUUID();
            console.log(`📝 [Database Init] Creating project record ${projectId}...`);
            // 2. Insert initial processing marker row mapping to snake_case column names
            const { error: initError } = await supabase
                .from("parametric_projects")
                .insert({
                id: projectId,
                script: script,
                voiceover_url: publicUrl, // ✅ Correctly mapping storage URL to voiceover_url
                status: "processing",
                created_at: new Date().toISOString()
            });
            if (initError) {
                console.error("❌ [Database Init Error] Insertion failed:", initError);
                return reply.code(500).send({ success: false, error: initError.message });
            }
            // 3. Hand off background analytical computations
            (async () => {
                try {
                    console.log(`🎙️ [Pipeline Process] Extracting OpenAI whisper arrays for ${projectId}...`);
                    const rawTranscript = await generateTranscription(audioLocalPath);
                    console.log(`⚙️ [Pipeline Process] Running pipeline orchestrator calculations...`);
                    const pipelineData = await runTranscriptionToScenePipeline(rawTranscript, 30);
                    // Unpack in-memory properties returned from your pipelineOrchestrator
                    const { transcript, sceneConfig, semanticPose, narrativeScenes, selectedWidgets } = pipelineData;
                    console.log(`💾 [Database Update] Saving orchestration layers into Supabase row...`);
                    // 4. Update the project row mapping JavaScript properties cleanly to snake_case columns
                    const { error: updateError } = await supabase
                        .from("parametric_projects")
                        .update({
                        transcript: transcript,
                        scene_config: sceneConfig, // camelCase -> snake_case
                        semantic_pose: semanticPose, // camelCase -> snake_case
                        narrative_analysis: narrativeScenes, // camelCase -> snake_case
                        selected_widgets: selectedWidgets, // camelCase -> snake_case
                        status: "done",
                        updated_at: new Date().toISOString()
                    })
                        .eq("id", projectId);
                    if (updateError) {
                        console.error(`❌ [Database Update Error] Failed to write artifacts for ${projectId}:`, updateError);
                    }
                    else {
                        console.log(`🎉 [Pipeline Success] Project row ${projectId} successfully saved.`);
                    }
                }
                catch (err) {
                    console.error(`💥 [Pipeline Runtime Exception] Process broke for project ${projectId}:`, err);
                    await supabase
                        .from("parametric_projects")
                        .update({
                        status: "failed",
                        updated_at: new Date().toISOString()
                    })
                        .eq("id", projectId);
                }
            })();
            // 5. Instantly return target pointers to frontend
            return reply.send({
                success: true,
                audioUrl: publicUrl,
                jobId: projectId
            });
        }
        catch (err) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });
    // 6. Polling endpoint verification check
    fastify.get("/voiceover/status/:jobId", async (request, reply) => {
        const { jobId } = request.params;
        const { data, error } = await supabase
            .from("parametric_projects")
            .select("status, transcript, scene_config")
            .eq("id", jobId)
            .single();
        if (error || !data) {
            return reply.code(404).send({ success: false, error: "Project key traces not found in database." });
        }
        return reply.send({
            success: true,
            status: data.status,
            result: data.status === "done" ? {
                transcript: data.transcript,
                sceneConfig: data.scene_config // Expose camelCase back out safely to frontend UI
            } : null
        });
    });
}
//# sourceMappingURL=voiceover.js.map