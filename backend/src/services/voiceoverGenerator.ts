// backend/src/services/voiceoverGenerator.ts
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
    
    // Convert to base64 string for instant browser delivery
    const base64Audio = buffer.toString("base64");

    const filename = `voiceover_${Date.now()}.mp3`;
    const outputPath = path.join(process.cwd(), "tmp", filename);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    // Return both the local path for the transcript service and the base64 string for the client
    return { audioLocalPath: outputPath, base64Audio };
}