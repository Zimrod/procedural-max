import { generateVoiceover } from "../services/voiceoverGenerator.js";
export default async function voiceoverRoutes(fastify) {
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body;
            const audioUrl = await generateVoiceover(script);
            return reply.send({
                success: true,
                audioUrl,
            });
        }
        catch (err) {
            request.log.error(err);
            return reply.code(500).send({
                success: false,
                error: err.message,
            });
        }
    });
}
//# sourceMappingURL=narrativeAnalyzer.js.map