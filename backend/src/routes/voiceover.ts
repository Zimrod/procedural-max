// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import { generateVoiceover } from "../services/voiceoverGenerator.js";

export default async function voiceoverRoutes(
    fastify: FastifyInstance
) {

    fastify.post("/voiceover", async (request, reply) => {

        try {

            const { script } = request.body as {
                script: string;
            };

            const audioUrl =
                await generateVoiceover(script);

            return reply.send({

                success: true,
                audioUrl,

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
