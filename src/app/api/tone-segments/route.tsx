import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

const apiKey = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "src/app/api/data/transcription.json");

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "transcription.json not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);

    const text = data.text;

    if (!text) {
      return NextResponse.json({ error: "No transcript text found" }, { status: 400 });
    }

    const toneResponse = await apiKey.chat.completions.create({
        model: "gpt-5-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              `You are an emotional tone segmentation assistant. Your job is to analyze a transcript and divide it into sections based on tone. Each section should be consistent in emotional tone and mood. For each segment, return:
      - start_text: the beginning of the segment
      - end_text: the ending words of the segment
      - tone: one word like 'serious', 'humorous', 'motivational', 'angry', 'hopeful', etc.
      - summary: a short 1-line summary of the segment
      
      Output as a JSON array.`,
          },
          {
            role: "user",
            content: `Analyze the following transcript and segment it by emotional tone:\n\n${text}`,
          },
        ],
    });
      

    const tone = toneResponse.choices[0].message.content.trim().toLowerCase();

    console.log("Detected Tone:", tone);

    return NextResponse.json({ tone });
  } catch (err) {
    console.error("Error detecting tone:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
