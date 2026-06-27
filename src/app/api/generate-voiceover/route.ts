// app/api/generate-voiceover/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const script = body.script;

    const apiKey = process.env.OPENAI_API_KEY;

    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: script,
    });

    const audioBuffer = Buffer.from(
      await speech.arrayBuffer()
    );

    const outputPath = path.resolve(
      process.cwd(),
      "public",
      "generated_voiceover.mp3"
    );

    fs.writeFileSync(outputPath, audioBuffer);

    return NextResponse.json({
      success: true,
      audioUrl: "/generated_voiceover.mp3",
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}