// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function voiceoverRoutes(fastify: FastifyInstance) {
    
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body as { script: string };

            // 1. Synthesize audio, get public URL and short filename
            const { audioLocalPath, publicUrl, filename } = await generateVoiceover(script);
            
            // Generate a secure UUID-like job ID string to act as the primary key for this project
            const projectId = crypto.randomUUID(); 

            // 2. Insert initial project row into Supabase so it exists while processing
            await supabase
                .from("parametric_projects")
                .insert({
                    id: projectId,
                    script: script,
                    voiceover_url: publicUrl,
                    status: "processing",
                    created_at: new Date().toISOString()
                });

            // 3. Fire-and-forget background pipeline
            (async () => {
                try {
                    console.log(`[Pipeline] Generating transcription for project ${projectId}...`);
                    const rawTranscript = await generateTranscription(audioLocalPath);
                    
                    console.log(`[Pipeline] Running orchestrator for project ${projectId}...`);
                    const { transcript, sceneConfig, semanticPose, narrativeScenes, selectedWidgets } = await runTranscriptionToScenePipeline(rawTranscript, 30);
                    
                    // 4. Update the project row in Supabase with all pipeline outputs!
                    console.log(`[Pipeline] Pipeline finished. Saving artifacts to Supabase...`);
                    const { error } = await supabase
                        .from("parametric_projects")
                        .update({
                            transcript: transcript,
                            scene_config: sceneConfig,
                            semantic_pose: semanticPose, // Requires you to return this from orchestrator
                            narrative_analysis: narrativeScenes, // Requires you to return this from orchestrator
                            selected_widgets: selectedWidgets, // Requires you to return this from orchestrator
                            status: "done",
                            updated_at: new Date().toISOString()
                        })
                        .eq("id", projectId);

                    if (error) {
                        console.error("[Pipeline] Supabase Update Error:", error);
                    } else {
                        console.log(`[Pipeline] Project ${projectId} saved successfully.`);
                    }

                } catch (err: any) {
                    console.error("[Pipeline] Exception:", err);
                    await supabase
                        .from("parametric_projects")
                        .update({ status: "failed" })
                        .eq("id", projectId);
                }
            })();

            // 5. Return the Supabase Public URL and the DB Primary Key (projectId)
            return reply.send({
                success: true,
                audioUrl: publicUrl, 
                jobId: projectId // 👈 This is now the Supabase Row ID!
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });

    // ENDPOINT C: Switch polling target to query Supabase directly
    fastify.get("/voiceover/status/:jobId", async (request, reply) => {
        const { jobId } = request.params as { jobId: string };

        const { data, error } = await supabase
            .from("parametric_projects")
            .select("status, transcript, scene_config")
            .eq("id", jobId)
            .single();

        if (error || !data) {
            return reply.code(404).send({ success: false, error: "Project not found in database." });
        }

        return reply.send({
            success: true,
            status: data.status,
            result: data.status === "done" ? {
                transcript: data.transcript,
                sceneConfig: data.scene_config
            } : null,
        });
    });
}