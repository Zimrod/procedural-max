// src/routes/render.ts
import { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { createClient } from "@supabase/supabase-js";

// 1. Explicit .js file extensions for NodeNext module resolution compliance
import { executeApi } from "../helpers/api-response.js";
import { RenderRequest } from "../types/schema.js";

// @ts-ignore
import {
  DISK,
  RAM,
  TIMEOUT,
} from "../../config.js";

// Initialize the Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("⚠️ [Supabase Warning] Missing credentials. Database queries will fail.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  // 2. Fixed: Removed explicit type annotations (req, body) to let Fastify / executeApi infer them correctly
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

    // ------------------------------------------------------------
    // 🛠️ FETCH DATA FROM SUPABASE
    // ------------------------------------------------------------
    const targetId = body.inputProps?.id || body.id;
    let fetchedSceneConfig = null;
    let fetchedVoiceoverUrl = null;

    if (targetId) {
      console.log(`🛰️ [Supabase Sync] Querying video row metadata for ID: "${targetId}"...`);
      
      const { data, error } = await supabase
        .from("video_jobs") 
        .select("scene_config, voiceover_url")
        .eq("id", targetId)
        .single();

      if (error) {
        console.error("❌ [Supabase Error] Query failed actively:", error.message);
      } else if (data) {
        console.log("✅ [Supabase Sync] Raw data extracted successfully.");
        fetchedSceneConfig = data.scene_config;
        fetchedVoiceoverUrl = data.voiceover_url;
      }
    } else {
      console.log("⚠️ [Supabase Skip] No lookup ID found in payload. Proceeding with default inputs.");
    }

    // Combine any base inputProps passed by the client with the fresh Supabase assets
    const finalInputProps = {
      ...body.inputProps,
      scene_config: fetchedSceneConfig || body.inputProps?.scene_config,
      voiceover_url: fetchedVoiceoverUrl || body.inputProps?.voiceover_url,
    };

    // 🕵️‍♂️ Speculating what function name pattern your Remotion configuration matches
    const predictedFunction = speculateFunctionName({
      diskSizeInMb: DISK,
      memorySizeInMb: RAM,
      timeoutInSeconds: TIMEOUT,
    });

    console.log("🔍 [Stage 2] Extracted Configurations Context Matrix:");
    console.log(`  -> Speculated Target Lambda Function Name: "${predictedFunction}"`);
    console.log(`  -> Target Composition ID: "${body.id}"`);
    console.log(`  -> Resolved Input Props Matrix Payload:`, JSON.stringify(finalInputProps, null, 2));

    try {
      console.log("📡 [Stage 3] Initiating renderMediaOnLambda dispatch request wire call...");
      
      const result = await renderMediaOnLambda({
        codec: "h264",
        functionName: process.env.LAMBDA_FUNCTION_NAME || predictedFunction,
        region: "us-east-1",
        serveUrl: process.env.SITE_NAME || "",
        composition: body.id,
        inputProps: finalInputProps,
        framesPerLambda: 10,
        downloadBehavior: {
          type: "download",
          fileName: "video.mp4",
        },
      });

      console.log("✅ [Stage 4] AWS Orchestration Hook Accepted Request!");
      console.log(`  -> Generated Render ID token: ${result.renderId}`);
      console.log(`  -> Targeted Output Bucket: ${result.bucketName}`);
      
      return result;
    } catch (lambdaError: any) {
      console.error("💥 [Stage 3 Crash] AWS Lambda Dispatch Hook Actively Rejected Call!");
      console.error(`  -> Error Message: ${lambdaError.message}`);
      console.error(`  -> Stack Trace Summary:\n`, lambdaError.stack);
      throw lambdaError;
    }
  },
);