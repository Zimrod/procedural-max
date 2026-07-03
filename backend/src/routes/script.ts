import { FastifyInstance } from "fastify";
import { generateScript } from "../services/scriptGenerator.js";

export default async function scriptRoutes(
    fastify: FastifyInstance
) {
    fastify.post("/script", async (request, reply) => {

        try {

            const { prompt } = request.body as {
                prompt: string;
            };

            const script = await generateScript(prompt);

            return reply.send({
                success: true,
                script,
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
