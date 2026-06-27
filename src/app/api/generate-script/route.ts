// app/api/generate-script/route.ts

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt;

    const apiKey = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await apiKey.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `
            You generate concise 30-40 second finance explainer scripts.

            Tone:
            - professional
            - cinematic
            - investor-focused
            - concise

            Avoid markdown.
          `,
        },
        {
          role: "user",
          content: prompt,
        },
      ]
    });

    const script =
      completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      script,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
