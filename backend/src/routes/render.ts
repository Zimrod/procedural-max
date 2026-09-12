// backend/src/routes/render.ts
import { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
  getRenderProgress,
} from "@remotion/lambda/client";
import { createClient } from "@supabase/supabase-js";

// 1. Explicit .js file extensions for NodeNext module resolution compliance
import { executeApi } from "../helpers/api-response.js";
import { RenderRequest } from "../types/schema.js";
import { FastifyInstance } from "fastify";
import { z } from "zod";

// @ts-ignore
import {
  DISK,
  RAM,
  TIMEOUT,
} from "../config.js";

// Initialize the Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ [Supabase Warning] Missing credentials. Database queries will fail.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    console.log("🚀 [Stage 1] Render request incoming. Parsing identity keys...");
    
    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID) {
      console.error("❌ [Stage 1 Error] Missing AWS Access Key Identification.");
      throw new TypeError(
        "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
      );
    }
    if (!process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
      console.error("❌ [Stage 1 Error] Missing AWS Secret Access Key Definition.");
      throw new TypeError(
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
      );
    }

    const targetId = body.projectId || body.inputProps?.id;
    
    // Extract incoming workspace configurations sent directly from RenderAndSaveButtons.tsx
    const incomingSceneConfig = (body as any).sceneConfig; 
    const incomingRawText = (body as any).rawText;
    const incomingVideoName = (body as any).title || body.inputProps?.title || (body as any).video_name;

    let fetchedSceneConfig = incomingSceneConfig || null;
    let fetchedVoiceoverUrl = null;
    let fetchedVideoName = incomingVideoName || null;

    // ------------------------------------------------------------
    // 🛠️ SAVE TO & SYNC WITH SUPABASE
    // ------------------------------------------------------------
    if (targetId) {
      // 1. Save updated workspace configurations and video_name to Supabase
      if (incomingSceneConfig || incomingVideoName) {
        console.log(`💾 [Supabase Write] Auto-persisting latest data for ID: "${targetId}" before render...`);
        
        const { error: saveError } = await supabase
          .from("parametric_projects")
          .update({
            ...(incomingSceneConfig ? { scene_config: incomingSceneConfig } : {}),
            ...(incomingRawText ? { raw_text: incomingRawText } : {}),
            ...(incomingVideoName ? { video_name: incomingVideoName } : {}),
          })
          .eq("id", targetId);

        if (saveError) {
          console.error("❌ [Supabase Save Error] Failed to auto-persist layout:", saveError.message);
        } else {
          console.log("✅ [Supabase Write] Workspace configurations and video_name auto-saved successfully.");
        }
      }

      // 2. Query remaining metadata (like voiceover_url and video_name) to finalize parameters
      console.log(`🛰️ [Supabase Sync] Querying remaining metadata for ID: "${targetId}"...`);
      const { data, error } = await supabase
        .from("parametric_projects") 
        .select("scene_config, voiceover_url, video_name")
        .eq("id", targetId)
        .single();

      if (error) {
        console.error("❌ [Supabase Read Error] Query failed actively:", error.message);
      } else if (data) {
        console.log("✅ [Supabase Sync] Project metadata synced successfully.");
        fetchedSceneConfig = fetchedSceneConfig || data.scene_config;
        fetchedVoiceoverUrl = data.voiceover_url;
        fetchedVideoName = fetchedVideoName || data.video_name;
      }
    } else {
      console.log("⚠️ [Supabase Skip] No lookup ID found in payload. Proceeding with default inputs.");
    }

    // Resolve final video name and format sanitized MP4 filename
    const resolvedTitle = fetchedVideoName || body.inputProps?.title || "render";
    const sanitizedFileName = `${resolvedTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;

    // Prepare inputProps for Remotion
    const finalInputProps = {
      ...body.inputProps,
      title: resolvedTitle,
      scene_config: fetchedSceneConfig || body.inputProps?.scene_config,
      voiceover_url: fetchedVoiceoverUrl || body.inputProps?.voiceover_url,
      aspectRatio: body.inputProps?.aspectRatio ?? 16 / 9,
    };

    const renderHeight = 1080;
    const renderWidth = Math.max(
      2,
      Math.round((renderHeight * finalInputProps.aspectRatio) / 2) * 2,
    );

    const predictedFunction = speculateFunctionName({
      diskSizeInMb: DISK,
      memorySizeInMb: RAM,
      timeoutInSeconds: TIMEOUT,
    });

    const finalCompositionId = body.id || "MainScene";

    console.log("🔍 [Stage 2] Extracted Configurations Context Matrix:");
    console.log(`  -> Speculated Target Lambda Function Name: "${predictedFunction}"`);
    console.log(`  -> Target Composition ID: "${finalCompositionId}"`);
    console.log(`  -> Download Output File Name: "${sanitizedFileName}"`);
    console.log(`  -> Resolved Input Props Matrix Payload:`, JSON.stringify(finalInputProps, null, 2));

    try {
      console.log("📡 [Stage 3] Initiating renderMediaOnLambda dispatch request wire call...");

      const result = await renderMediaOnLambda({
        codec: "h264",
        functionName: process.env.LAMBDA_FUNCTION_NAME || predictedFunction,
        region: "us-east-1",
        serveUrl:
          process.env.REMOTION_SITE_URL ||
          "https://remotionlambda-useast1-u8m4fsf2at.s3.us-east-1.amazonaws.com/sites/procedural-max-studio/index.html",
        composition: finalCompositionId,
        inputProps: finalInputProps,
        forceWidth: renderWidth,
        forceHeight: renderHeight,
        framesPerLambda: 10,
        outName: sanitizedFileName, // 👈 Fixes out.mp4 -> custom name (e.g. verbatim.mp4)
        downloadBehavior: {
          type: "download",
          fileName: sanitizedFileName,
        },
      });

      console.log("✅ [Stage 4] AWS Orchestration Hook Accepted Request!");
      console.log(`  -> Generated Render ID token: ${result.renderId}`);
      console.log(`  -> Targeted Output Bucket: ${result.bucketName}`);
      
      return result;
    } catch (lambdaError: any) {
      console.error("💥 [Stage 3 Crash] AWS Lambda Dispatch Hook Actively Rejected Call!");
      console.error(`  -> Error Message: ${lambdaError.message}`);
      throw lambdaError;
    }
  },
);

const RenderProgressRequest = z.object({
  id: z.string(),
  bucketName: z.string(),
});

export const PROGRESS = executeApi(
  RenderProgressRequest,
  async (req, body) => {
    const progress = await getRenderProgress({
      bucketName: body.bucketName,
      functionName: process.env.LAMBDA_FUNCTION_NAME || speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: "us-east-1",
      renderId: body.id,
    });

    if (progress.fatalErrorEncountered) {
      return { type: "error", message: progress.errors[0]?.message || "Lambda render failed." };
    }
    if (progress.done) {
      return { type: "done", url: progress.outputFile as string, size: progress.outputSizeInBytes as number };
    }
    return { type: "progress", progress: Math.max(0.03, progress.overallProgress) };
  },
);

export default async function renderRoutes(fastify: FastifyInstance) {
  fastify.post("/render/lambda", POST);
  fastify.post("/render/lambda/progress", PROGRESS);
}
