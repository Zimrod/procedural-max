import { openai } from "../lib/openai.js";
import fs from "fs";
import path from "path";
export async function generateVoiceover(script) {
    const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: script,
    });
    const buffer = Buffer.from(await speech.arrayBuffer());
    const outputPath = path.join(process.cwd(), "tmp", "generated_voiceover.mp3");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
}
//# sourceMappingURL=voiceoverGenerator.js.map