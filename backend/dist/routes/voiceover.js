"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = voiceoverRoutes;
const voiceoverGenerator_1 = require("../services/voiceoverGenerator");
async function voiceoverRoutes(fastify) {
    fastify.post("/voiceover", async (request, reply) => {
        try {
            const { script } = request.body;
            const audioUrl = await (0, voiceoverGenerator_1.generateVoiceover)(script);
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
//# sourceMappingURL=voiceover.js.map