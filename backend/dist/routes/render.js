import { renderMediaOnLambda, speculateFunctionName, } from "@remotion/lambda/client";
import { createClient } from "@supabase/supabase-js";
// 1. Explicit .js file extensions for NodeNext module resolution compliance
import { executeApi } from "../helpers/api-response.js";
import { RenderRequest } from "../types/schema.js";
// @ts-ignore
import { DISK, RAM, TIMEOUT, } from "../config.js";
// Initialize the Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("⚠️ [Supabase Warning] Missing credentials. Database queries will fail.");
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);
export const POST = executeApi(RenderRequest, async (req, body) => {
    console.log("🚀 [Stage 1] Render request incoming. Parsing identity keys...");
    if (!process.env.REMOTION_AWS_ACCESS_KEY_ID) {
        console.error("❌ [Stage 1 Error] Missing AWS Access Key Identification.");
        throw new TypeError("Set up Remotion Lambda to render videos. See the README.md for how to do so.");
    }
    if (!process.env.REMOTION_AWS_SECRET_ACCESS_KEY) {
        console.error("❌ [Stage 1 Error] Missing AWS Secret Access Key Definition.");
        throw new TypeError("The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.");
    }
    const targetId = body.projectId || body.inputProps?.id;
    // Extract incoming workspace configurations sent directly from RenderAndSaveButtons.tsx
    // (Ensure your 'RenderRequest' schema validation allows these optional fields)
    const incomingSceneConfig = body.sceneConfig;
    const incomingRawText = body.rawText;
    let fetchedSceneConfig = incomingSceneConfig || null;
    let fetchedVoiceoverUrl = null;
    // ------------------------------------------------------------
    // 🛠️ SAVE TO & SYNC WITH SUPABASE
    // ------------------------------------------------------------
    if (targetId) {
        // 1. If the client sent updated workspace configurations, save them to the database first!
        if (incomingSceneConfig) {
            console.log(`💾 [Supabase Write] Auto-persisting latest scene_config for ID: "${targetId}" before render...`);
            const { error: saveError } = await supabase
                .from("parametric_projects")
                .update({
                scene_config: incomingSceneConfig,
                ...(incomingRawText ? { raw_text: incomingRawText } : {})
            })
                .eq("id", targetId);
            if (saveError) {
                console.error("❌ [Supabase Save Error] Failed to auto-persist layout:", saveError.message);
                // We continue anyway so the user doesn't experience a broken render if the DB save fails but we still have the layout in-memory.
            }
            else {
                console.log("✅ [Supabase Write] Workspace configurations auto-saved successfully.");
            }
        }
        // 2. Query remaining metadata (like voiceover_url) to finalize input parameters
        console.log(`🛰️ [Supabase Sync] Querying remaining metadata for ID: "${targetId}"...`);
        const { data, error } = await supabase
            .from("parametric_projects")
            .select("scene_config, voiceover_url")
            .eq("id", targetId)
            .single();
        if (error) {
            console.error("❌ [Supabase Read Error] Query failed actively:", error.message);
        }
        else if (data) {
            console.log("✅ [Supabase Sync] Project metadata synced successfully.");
            // Fall back to DB state if nothing was passed in memory
            fetchedSceneConfig = fetchedSceneConfig || data.scene_config;
            fetchedVoiceoverUrl = data.voiceover_url;
        }
    }
    else {
        console.log("⚠️ [Supabase Skip] No lookup ID found in payload. Proceeding with default inputs.");
    }
    // Prepare inputProps for Remotion
    const finalInputProps = {
        ...body.inputProps,
        scene_config: fetchedSceneConfig || body.inputProps?.scene_config,
        voiceover_url: fetchedVoiceoverUrl || body.inputProps?.voiceover_url,
    };
    const predictedFunction = speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
    });
    const finalCompositionId = body.id || "MainScene";
    console.log("🔍 [Stage 2] Extracted Configurations Context Matrix:");
    console.log(`  -> Speculated Target Lambda Function Name: "${predictedFunction}"`);
    console.log(`  -> Target Composition ID: "${finalCompositionId}"`);
    console.log(`  -> Resolved Input Props Matrix Payload:`, JSON.stringify(finalInputProps, null, 2));
    try {
        console.log("📡 [Stage 3] Initiating renderMediaOnLambda dispatch request wire call...");
        const result = await renderMediaOnLambda({
            codec: "h264",
            functionName: process.env.LAMBDA_FUNCTION_NAME || predictedFunction,
            region: "us-east-1",
            serveUrl: process.env.SITE_NAME || "https://remotionlambda-useast1-u8m4fsf2at.s3.us-east-1.amazonaws.com/sites/parametric-video/index.html",
            composition: finalCompositionId,
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
    }
    catch (lambdaError) {
        console.error("💥 [Stage 3 Crash] AWS Lambda Dispatch Hook Actively Rejected Call!");
        console.error(`  -> Error Message: ${lambdaError.message}`);
        throw lambdaError;
    }
});
export default async function renderRoutes(fastify) {
    fastify.post("/render/lambda", POST);
}
//# sourceMappingURL=render.js.map