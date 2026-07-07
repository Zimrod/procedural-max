// backend/src/routes/voiceover.ts
import { FastifyInstance } from "fastify";
import { generateVoiceover } from "../services/voiceoverGenerator.js";
import { generateTranscription } from "../services/transcription.js";

export default async function voiceoverRoutes(
    fastify: FastifyInstance
) {

    fastify.post("/voiceover", async (request, reply) => {

        try {

            const { script } = request.body as {
                script: string;
            };

            // 1. Generate the voiceover MP3 and save it locally to tmp/
            const audioLocalPath = await generateVoiceover(script);

            // 2. Automatically feed that exact local file path into Whisper
            const transcript = await generateTranscription(audioLocalPath);

            // 3. Return a clean, combined payload to your frontend app
            return reply.send({
                success: true,
                audioUrl: audioLocalPath, // This matches your existing front-end state expectations
                transcript: transcript    // Contains the synchronized text and word arrays
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