"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = sceneRoutes;
const scenePlanner_1 = require("../services/scenePlanner");
async function sceneRoutes(fastify) {
    fastify.post("/scene", async (request, reply) => {
        try {
            const result = await (0, scenePlanner_1.buildScene)();
            return reply.send({
                success: true,
                ...result,
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
//# sourceMappingURL=scene.js.map