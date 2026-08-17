import { generateScript } from "../services/scriptGenerator.js";
import fs from "fs";
import path from "path";
export default async function scriptRoutes(fastify) {
    fastify.post("/script", async (request, reply) => {
        try {
            const { prompt } = request.body;
            const script = await generateScript(prompt);
            // Save script directly to tmp/ folder
            const outputPath = path.join(process.cwd(), "tmp", "generated_script.txt");
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, script, "utf-8");
            return reply.send({
                success: true,
                script,
                outputPath,
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