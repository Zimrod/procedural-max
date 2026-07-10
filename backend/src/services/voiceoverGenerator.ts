// backend/src/services/voiceoverGenerator.ts
import { openai } from "../lib/openai.js";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Initialize Supabase Client (Ensure these are in your backend .env file)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function generateVoiceover(script: string) {
    // 1. Generate speech via OpenAI
    const speech = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: script,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    const filename = `voiceover_${Date.now()}.mp3`;
    const outputPath = path.join(process.cwd(), "tmp", filename);

    // 2. Write locally first so your transcription service can still read it
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, buffer);

    // 3. Upload the buffer directly to Supabase Storage
    console.log(`📤 Uploading ${filename} to Supabase Storage...`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voiceovers")
        .upload(filename, buffer, {
            contentType: "audio/mpeg",
            cacheControl: "3600",
            upsert: false
        });

    if (uploadError) {
        console.error("❌ Supabase Upload Error:", uploadError);
        throw new Error(`Failed to upload audio to storage: ${uploadError.message}`);
    }

    // 4. Get the permanent Public URL
    const { data: { publicUrl } } = supabase.storage
        .from("voiceovers")
        .getPublicUrl(filename);

    console.log("🔗 Permanent Supabase Audio URL:", publicUrl);

    // Return both the local path (for transcription engine) and the public cloud URL
    return { audioLocalPath: outputPath, publicUrl };
}