import { FastifyInstance } from "fastify";

import { buildScene } from "../services/scenePlanner";

export default async function sceneRoutes(
    fastify: FastifyInstance
) {

    fastify.post("/scene", async (request, reply) => {

        try {

            const result =
                await buildScene();

            return reply.send({

                success: true,

                ...result,

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