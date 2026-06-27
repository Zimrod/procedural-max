// src/app/api/save-project/route.ts
import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { supabase } from "../../../lib/supabaseClient"; // 🚀 Import your initialized client link

// Use the explicit API key to authenticate embedding generation requests
const apiKey = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const { title, rawText, sceneConfig } = await req.json();

    if (!sceneConfig || !Array.isArray(sceneConfig)) {
      return NextResponse.json({ error: "Invalid layout config array." }, { status: 400 });
    }

    // 1. Save the video asset timeline directly to the tracking table
    const { data: project, error: projectError } = await supabase
      .from("video_projects")
      .insert({
        title: title || `Composition - ${new Date().toLocaleDateString()}`,
        raw_transcription: rawText || "",
        scene_config: sceneConfig,
      })
      .select()
      .single();

    if (projectError || !project) {
      throw new Error(`Master config insert failed: ${projectError?.message}`);
    }

    // 2. Filter active widgets and process semantic RAG text vectors
    const activeBeats = sceneConfig.filter((item: any) => item.props?.beatId && !item.props?.isSilenceBridge);

    if (activeBeats.length > 0) {
      const phrasesToEmbed = activeBeats.map((item: any) => item.props.textToAnimate || item.props.text || "VIDEO PHRASE");

      // Generate the 1536-dimensional embeddings match for pgvector
      const embeddingResponse = await apiKey.embeddings.create({
        model: "text-embedding-3-small",
        input: phrasesToEmbed,
      });

      const embeddingPayloads = activeBeats.map((item: any, idx: number) => ({
        project_id: project.id,
        beat_id: item.props.beatId,
        sentence_text: item.props.sentenceText || "",
        punchy_phrase_text: phrasesToEmbed[idx],
        embedding: embeddingResponse.data[idx].embedding, // High-dimensional vector array
        metadata: {
          widgetType: item.widget,
          durationFrames: item.durationFrames,
        },
      }));

      const { error: vectorInsertError } = await supabase
        .from("video_transcription_embeddings")
        .insert(embeddingPayloads);

      if (vectorInsertError) {
        throw new Error(`Vector matching insert failed: ${vectorInsertError.message}`);
      }
    }

    return NextResponse.json({ success: true, projectId: project.id });
  } catch (err: any) {
    console.error("❌ API Save Error Exception:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}