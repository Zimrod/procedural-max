// src/core/planning/inspectSceneConfig.ts

import { OpenAI } from "openai";
import { SceneConfigItem } from "../segmentation/buildSceneConfigFromWidgets";

// Initialize OpenAI connection
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * AI Quality Pass Agent to clean up, truncate, and polish layout properties
 * right before saving out to 08_scene_config.json
 */
export async function inspectAndRefineConfig(config: SceneConfigItem[]): Promise<SceneConfigItem[]> {
  const systemPrompt = `
    You are an expert video editor and automated video design QA engine. Your core task is to inspect an array of timeline scene config structures, fixing text length or structural framing errors based on rigid rules:

    1. MAX DURATION ENFORCEMENT: No single scene item should have a 'durationFrames' exceeding 180 frames. 
    2. PUNCHY TEXT RULES: Ensure fields like 'props.textToAnimate', 'props.text', 'props.title', and array items in 'props.wordsToCycle' are clean, short, and punchy. If you encounter long paragraphs or multi-sentence blocks, rewrite them to be snappy (max 4-6 words).
    3. INTERNAL DURATION PROPS MATH: You MUST recalculate and override 'props.durationInFrames' for every scene using these exact constraints:
       - If the scene's outer 'durationFrames' is more than 120 frames (> 120), set 'props.durationInFrames' to be exactly 'durationFrames - 60'.
       - If the scene's outer 'durationFrames' is less than 121 frames (<= 120), set 'props.durationInFrames' to be exactly 'durationFrames - 40'.
    
    CRITICAL: Maintain absolute valid timeline continuity. The 'startFrame' of an item must equal the 'startFrame + durationFrames' of the preceding item. Do not include any narrative explanations or markdown ticks. Return ONLY a pure JSON object containing a top-level "scenes" array.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(config, null, 2) }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    
    // Ensure accurate array extraction from the structured schema
    if (parsed.scenes && Array.isArray(parsed.scenes)) {
      return parsed.scenes;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    
    return config;
  } catch (err) {
    console.warn("AI Quality Check validation failed or timed out. Falling back to core configuration architecture:", err);
    
    // Programmatic safety mesh fallback if the LLM drops structural payload parameters
    return config.map((scene) => {
      const d = scene.durationFrames;
      const calculatedInternalFrames = d > 120 ? Math.max(1, d - 60) : Math.max(1, d - 40);
      
      return {
        ...scene,
        props: {
          ...scene.props,
          durationInFrames: calculatedInternalFrames
        }
      };
    });
  }
}