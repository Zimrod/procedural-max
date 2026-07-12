// backend/src/routes/render.ts
import { FastifyInstance } from "fastify";
import { renderMediaOnLambda, getRenderProgress } from "@remotion/lambda-client"; // 👈 Added getRenderProgress
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_ANON_KEY || "");

export default async function renderRoutes(fastify: FastifyInstance) {
    fastify.post("/render/lambda", async (request, reply) => {
        try {
            const { projectId } = request.body as { projectId: string };

            // 1. Grab your freshly processed data matrix from your project row
            const { data: project, error: dbError } = await supabase
                .from("parametric_projects")
                .select("scene_config, voiceover_url")
                .eq("id", projectId)
                .single();

            if (dbError || !project) {
                return reply.code(404).send({ success: false, error: "Project data targets not found." });
            }

            console.log(`🎬 [Lambda Setup] Dispatching render job for ${projectId}...`);

            const targetFunctionName = process.env.REMOTION_LAMBDA_FUNCTION_NAME || "";

            // 2. Invoke the serverless renderer using Remotion's SDK
            const lambdaResult = await renderMediaOnLambda({
                region: (process.env.AWS_REGION as any) || "us-east-1",
                functionName: targetFunctionName,
                composition: "MainVideoComposition",
                serveUrl: process.env.REMOTION_SERVE_URL || "",
                
                secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || "",
                accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || "",

                inputProps: {
                    sceneConfig: project.scene_config,
                    voiceoverUrl: project.voiceover_url
                },
                codec: "h264",
                privacy: "public",
                logLevel: "verbose",
            });

            // 3. Keep track of the render IDs inside your metadata column
            await supabase
                .from("parametric_projects")
                .update({
                    status: "rendering",
                    render_metadata: { renderId: lambdaResult.renderId, bucketName: lambdaResult.bucketName }
                })
                .eq("id", projectId);

            // 🚀 FIRE-AND-FORGET: Spin up the progress monitor loop asynchronously in the background.
            // This allows the route handler to immediately reply back to the UI frontend.
            monitorRenderProgress(lambdaResult.renderId, lambdaResult.bucketName, targetFunctionName, projectId);

            return reply.send({
                success: true,
                renderId: lambdaResult.renderId,
                bucketName: lambdaResult.bucketName
            });

        } catch (err: any) {
            request.log.error(err);
            return reply.code(500).send({ success: false, error: err.message });
        }
    });
}

// 🛠️ Background Polling Worker Strategy
async function monitorRenderProgress(renderId: string, bucketName: string, functionName: string, projectId: string) {
    console.log(`\n🕵️‍♂️ [Monitor] Background polling started for Render ID: ${renderId}`);
    
    while (true) {
        try {
            const progress = await getRenderProgress({
                bucketName: bucketName,
                functionName: functionName,
                renderId: renderId,
                region: (process.env.AWS_REGION as any) || "us-east-1",
                secretAccessKey: process.env.REMOTION_AWS_SECRET_ACCESS_KEY || "",
                accessKeyId: process.env.REMOTION_AWS_ACCESS_KEY_ID || "",
            });

            if (progress.done) {
                console.log(`\n✅ [Monitor] Render Success! Output URL: ${progress.outputFile}`);
                
                // Keep database synchronized with final asset tracking
                await supabase
                    .from("parametric_projects")
                    .update({ status: "done", video_url: progress.outputFile })
                    .eq("id", projectId);
                break;
            }

            if (progress.fatalErrorEncountered) {
                console.error(`\n❌ [Monitor] CRITICAL: Render crashed for Project ID: ${projectId} ❌\n`);
                
                if (progress.errors && progress.errors.length > 0) {
                    progress.errors.forEach((err, idx) => {
                        console.error(`--- Cloud Engine Error Matrix #${idx + 1} ---`);
                        console.error(`Message: ${err.message}`);
                        if (err.stack) console.error(`Stack Trace:\n${err.stack}`);
                    });
                } else {
                    console.error("⚠️ No explicit errors arrays reported from S3 orchestration JSON context.");
                }

                // Push failure update state status flags to Supabase
                await supabase
                    .from("parametric_projects")
                    .update({ status: "failed" })
                    .eq("id", projectId);
                break;
            }

            // Continuous status tracing
            console.log(`⏳ [Monitor Pipeline] Progress: ${(progress.overallProgress * 100).toFixed(1)}%`);
            
            // Wait 2 seconds before checking again (prevents aggressive S3 spamming)
            await new Promise((resolve) => setTimeout(resolve, 2000));

        } catch (pollError) {
            console.error("💥 [Monitor Pipeline Exception] Failed fetching step metrics:", pollError);
            // Don't break immediately on random network hiccups; wait and try again
            await new Promise((resolve) => setTimeout(resolve, 5000));
        }
    }
}