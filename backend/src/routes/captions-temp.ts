// backend/src/routes/captions-temp.ts
import { FastifyInstance } from "fastify";
import { runTextOnlyPipelinePreview } from "../services/pipelineOrchestrator-temp.js";

export default async function captionsRoutesTemp(fastify: FastifyInstance) {
  fastify.post("/captions-temp", async (request, reply) => {
    try {
      const { script } = request.body as { script: string };

      if (!script || typeof script !== "string") {
        return reply.code(400).send({
          success: false,
          error: "A valid 'script' string is required in the request body."
        });
      }

      const pipelineResult = await runTextOnlyPipelinePreview(script);

      return reply.send({
        success: true,
        sceneConfig: pipelineResult.sceneConfig,
        semanticPose: pipelineResult.semanticPose,
        narrativeScenes: pipelineResult.narrativeScenes,
        selectedWidgets: pipelineResult.selectedWidgets
      });

    } catch (err: any) {
      request.log.error(err);
      return reply.code(500).send({
        success: false,
        error: err.message,
      });
    }
  });
}