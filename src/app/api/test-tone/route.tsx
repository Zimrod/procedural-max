import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";

const apiKey = process.env.OPENAI_API_KEY;

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
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You're a tone classification assistant. You only respond with one word representing the tone of a passage: e.g., 'serious', 'lighthearted', 'angry', 'hopeful', 'humorous', 'motivational', 'sarcastic'.",
        },
        {
          role: "user",
          content: `What tone best describes the following transcript: "${text}"`,
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
