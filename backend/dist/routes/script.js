import { generateScript } from "../services/scriptGenerator.js";
export default async function scriptRoutes(fastify) {
    fastify.post("/script", async (request, reply) => {
        try {
            const { prompt } = request.body;
            const script = await generateScript(prompt);
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