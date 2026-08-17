// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";
import { runTranscriptionToScenePipeline } from "../services/pipelineOrchestrator.js";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import os from "os";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function voiceoverRoutes(fastify: FastifyInstance) {
  
  // 1. Text-to-Speech Voiceover Route
  fastify.post("/voiceover", async (request, reply) => {
    try {
      const { script } = request.body as { script: string };

      const { audioLocalPath, publicUrl } = await generateVoiceover(script);
      const projectId = crypto.randomUUID(); 

      console.log(`📝 [Database Init] Creating project record ${projectId}...`);
      
      const { error: initError } = await supabase
        .from("parametric_projects")
        .insert({
          id: projectId,
          script: script,
          voiceover_url: publicUrl,
          status: "processing",
          created_at: new Date().toISOString()
        });

      if (initError) {
        console.error("❌ [Database Init Error] Insertion failed:", initError);
        return reply.code(500).send({ success: false, error: initError.message });
      }

      (async () => {
        try {
          console.log(`🎙️ [Pipeline Process] Extracting Whisper transcript for ${projectId}...`);
          const rawTranscript = await generateTranscription(audioLocalPath);
          
          console.log(`⚙️ [Pipeline Process] Running scene orchestrator calculations...`);
          const pipelineData = await runTranscriptionToScenePipeline(rawTranscript, 30);
          
          const { 
            transcript, 
            sceneConfig, 
            semanticPose, 
            narrativeScenes, 
            selectedWidgets 
          } = pipelineData;

          const { error: updateError } = await supabase
            .from("parametric_projects")
            .update({
              transcript: transcript,
              scene_config: sceneConfig,
              semantic_pose: semanticPose,
              narrative_analysis: narrativeScenes,
              selected_widgets: selectedWidgets,
              status: "done",
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);

          if (updateError) {
            console.error(`❌ [Database Update Error] Failed for ${projectId}:`, updateError);
          } else {
            console.log(`🎉 [Pipeline Success] Project ${projectId} saved.`);
          }

        } catch (err: any) {
          console.error(`💥 [Pipeline Runtime Exception] Process broke for ${projectId}:`, err);
          await supabase
            .from("parametric_projects")
            .update({ 
              status: "failed",
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
        }
      })();

      return reply.send({
        success: true,
        audioUrl: publicUrl, 
        jobId: projectId 
      });

    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // 2. Custom Audio File Upload Route (Tab 3)
  fastify.post("/voiceover/upload", async (request, reply) => {
    let tmpPath = "";
    try {
      const fileData = await request.file();
      if (!fileData) {
        return reply.code(400).send({ success: false, error: "No audio file provided." });
      }

      const buffer = await fileData.toBuffer();
      const fileExtension = path.extname(fileData.filename) || ".mp3";
      const storageFileName = `${crypto.randomUUID()}${fileExtension}`;
      
      // Save local temporary file for Whisper transcription service
      tmpPath = path.join(os.tmpdir(), storageFileName);
      await fs.writeFile(tmpPath, buffer);

      // Upload binary to Supabase Storage bucket 'voiceovers'
      console.log(`📤 [Storage Upload] Uploading ${storageFileName} to Supabase...`);
      const { error: storageError } = await supabase.storage
        .from("voiceovers")
        .upload(storageFileName, buffer, {
          contentType: fileData.mimetype,
          upsert: true,
        });

      if (storageError) {
        console.error("❌ [Storage Upload Error]:", storageError);
        return reply.code(500).send({ success: false, error: storageError.message });
      }

      // Retrieve public URL from Supabase Storage
      const { data: publicUrlData } = supabase.storage
        .from("voiceovers")
        .getPublicUrl(storageFileName);

      const publicUrl = publicUrlData.publicUrl;

      // Extract Whisper word-level timestamps synchronously for prompt text display
      console.log(`🎙️ [Upload Pipeline] Generating Whisper transcription...`);
      const rawTranscript = await generateTranscription(tmpPath);

      const projectId = crypto.randomUUID();

      // Insert tracking record into Supabase
      const { error: initError } = await supabase
        .from("parametric_projects")
        .insert({
          id: projectId,
          script: rawTranscript.text,
          voiceover_url: publicUrl,
          status: "processing",
          created_at: new Date().toISOString()
        });

      if (initError) {
        console.error("❌ [Database Init Error]:", initError);
        return reply.code(500).send({ success: false, error: initError.message });
      }

      // Trigger background pipeline scene extraction
      (async () => {
        try {
          console.log(`⚙️ [Upload Pipeline] Running scene layout generation for ${projectId}...`);
          const pipelineData = await runTranscriptionToScenePipeline(rawTranscript, 30);

          const { 
            transcript, 
            sceneConfig, 
            semanticPose, 
            narrativeScenes, 
            selectedWidgets 
          } = pipelineData;

          await supabase
            .from("parametric_projects")
            .update({
              transcript: transcript,
              scene_config: sceneConfig,
              semantic_pose: semanticPose,
              narrative_analysis: narrativeScenes,
              selected_widgets: selectedWidgets,
              status: "done",
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);

          console.log(`🎉 [Upload Pipeline Success] Project ${projectId} completed.`);
        } catch (err: any) {
          console.error(`💥 [Upload Pipeline Error] ${projectId}:`, err);
          await supabase
            .from("parametric_projects")
            .update({ 
              status: "failed",
              updated_at: new Date().toISOString()
            })
            .eq("id", projectId);
        } finally {
          // Clean up temp file
          if (tmpPath) await fs.unlink(tmpPath).catch(() => {});
        }
      })();

      // Send payload immediately back to Frontend
      return reply.send({
        success: true,
        audioUrl: publicUrl,
        jobId: projectId,
        transcript: rawTranscript,
      });

    } catch (err: any) {
      if (tmpPath) await fs.unlink(tmpPath).catch(() => {});
      request.log.error(err);
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // 3. Status Check Endpoint
  fastify.get("/voiceover/status/:jobId", async (request, reply) => {
    const { jobId } = request.params as { jobId: string };

    const { data, error } = await supabase
      .from("parametric_projects")
      .select("status, transcript, scene_config")
      .eq("id", jobId)
      .single();

    if (error || !data) {
      return reply.code(404).send({ success: false, error: "Project key not found." });
    }

    return reply.send({
      success: true,
      status: data.status,
      result: data.status === "done" ? {
        transcript: data.transcript,
        sceneConfig: data.scene_config
      } : null
    });
  });
}