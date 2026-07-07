// backend/src/services/transcription.ts
import { openai } from "../lib/openai.js";
import fs from "fs";
import path from "path";

export async function generateTranscription(audioPath: string) {
    // Read the audio file from the tmp folder
    const audioFile = fs.createReadStream(audioPath);

    const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        response_format: "verbose_json", // This flag gives us word-level timestamps
        timestamp_granularities: ["word"],
    });

    const transcriptData = {
        text: transcription.text,
        words: transcription.words ?? [] // Contains [{ word: "...", start: 0.2, end: 0.5 }]
    };

    // Save the transcription JSON to tmp/ for safety
    const outputPath = path.join(process.cwd(), "tmp", "generated_transcript.json");
    fs.writeFileSync(outputPath, JSON.stringify(transcriptData, null, 2), "utf-8");

    return transcriptData;
}