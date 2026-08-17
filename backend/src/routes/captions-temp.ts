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

      // Set headers for chunked streaming
      reply.raw.setHeader("Content-Type", "text/plain; charset=utf-8");
      reply.raw.setHeader("Transfer-Encoding", "chunked");

      const sendLog = (msg: string) => {
        reply.raw.write(`[LOG] ${msg}\n`);
      };

      sendLog("🚀 Pipeline request received. Initializing text segmentation...");

      const pipelineResult = await runTextOnlyPipelinePreview(script, 30, sendLog);

      sendLog("✅ Scene composition complete!");
      reply.raw.write("\n--- RESULT JSON ---\n");
      reply.raw.write(JSON.stringify(pipelineResult, null, 2));
      reply.raw.end();

    } catch (err: any) {
      request.log.error(err);
      if (!reply.raw.headersSent) {
        return reply.code(500).send({ success: false, error: err.message });
      }
      reply.raw.write(`\n❌ Error: ${err.message}\n`);
      reply.raw.end();
    }
  });
}