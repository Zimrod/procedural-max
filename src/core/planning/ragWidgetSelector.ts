// src/core/planning/ragWidgetSelector.ts
import { OpenAI } from "openai";
import { supabase } from "@/lib/supabaseClient";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateRAGSceneConfig(newScriptSentences: string[]) {
  const finalInferredConfig = [];
  let currentTimelinePointer = 0;

  for (const sentence of newScriptSentences) {
    // 1. Vectorize the incoming new sentence snippet
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: [sentence]
    });
    const [queryEmbedding] = embeddingResponse.data.map(d => d.embedding);

    // 2. Query Supabase Vectors to find the closest layout match among your 10 scripts
    const { data: matches, error } = await supabase.rpc("match_video_segments", {
      query_embedding: queryEmbedding,
      match_threshold: 0.3, // Filter out weak context matches
      match_count: 1       // Grab the absolute best layout anchor
    });

    if (error || !matches || matches.length === 0) {
      // Fallback layout if no highly relevant semantic match is found
      const duration = 120;
      finalInferredConfig.push({
        widget: "TITLE_CARD",
        startFrame: currentTimelinePointer,
        durationFrames: duration,
        props: { title: sentence.toUpperCase(), durationInFrames: 60 }
      });
      currentTimelinePointer += duration;
      continue;
    }

    const bestMatch = matches[0];
    
    // 3. Retrieve the full parent scene configuration
    const { data: project } = await supabase
      .from("video_projects")
      .select("scene_config")
      .eq("id", bestMatch.project_id)
      .single();

    // 4. Extract the exact design configuration used for that specific matched beat
    const matchingWidgetBlueprint = project?.scene_config.find(
      (item: any) => item.props?.beatId === bestMatch.beat_id
    );

    const baseDuration = matchingWidgetBlueprint?.durationFrames || 120;

    // 5. Clone the layout blueprint but swap in the new sentence text seamlessly
    finalInferredConfig.push({
      widget: matchingWidgetBlueprint?.widget || "TEXT",
      startFrame: currentTimelinePointer,
      durationFrames: baseDuration,
      props: {
        ...matchingWidgetBlueprint?.props,
        textToAnimate: sentence.substring(0, 30).toUpperCase(),
        sentenceText: sentence,
        title: sentence.substring(0, 30).toUpperCase(),
        durationInFrames: baseDuration > 120 ? baseDuration - 60 : baseDuration - 40
      }
    });

    currentTimelinePointer += baseDuration;
  }

  return finalInferredConfig;
}