import { openai } from "../lib/openai.js";

import fs from "fs";
import path from "path";

export async function generateVoiceover(script: string) {
    const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: script,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());

    // 🛠️ FIX: Add a unique timestamp so files and resulting jobIds are distinct
    const filename = `voiceover_${Date.now()}.mp3`;
    const outputPath = path.join(process.cwd(), "tmp", filename);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    return outputPath;
}
