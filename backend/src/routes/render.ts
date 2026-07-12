// backend/src/routes/render.ts
import { FastifyInstance } from "fastify";
import { renderMediaOnLambda } from "@remotion/lambda/client";
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

            // 2. Invoke the serverless renderer using Remotion's SDK
            const lambdaResult = await renderMediaOnLambda({
                region: (process.env.AWS_REGION as any) || "us-east-1",
                functionName: process.env.REMOTION_LAMBDA_FUNCTION_NAME || "",
                composition: "MainVideoComposition", // Must match your Remotion Root config
                serveUrl: process.env.REMOTION_SERVE_URL || "",     // Your deployed bundle URL
                inputProps: {
                    sceneConfig: project.scene_config,
                    voiceoverUrl: project.voiceover_url
                },
                codec: "h264",
                privacy: "public",
            });

            // 3. Keep track of the render IDs inside your metadata column
            await supabase
                .from("parametric_projects")
                .update({
                    status: "rendering",
                    render_metadata: { renderId: lambdaResult.renderId, bucketName: lambdaResult.bucketName }
                })
                .eq("id", projectId);

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