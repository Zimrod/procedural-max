"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = scriptRoutes;
const scriptGenerator_1 = require("../services/scriptGenerator");
async function scriptRoutes(fastify) {
    fastify.post("/script", async (request, reply) => {
        try {
            const { prompt } = request.body;
            const script = await (0, scriptGenerator_1.generateScript)(prompt);
            return reply.send({
                success: true,
                script,
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
//# sourceMappingURL=script.js.map