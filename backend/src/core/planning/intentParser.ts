// src/core/planning/intentParser.ts

import OpenAI from 'openai';
import { WidgetIntent } from '../taxonomy/widgetTaxonomy';

const apiKey = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type AnalysedIntentResult = {
  intent: WidgetIntent;
  dataHints: {
    country?: string;
    metrics?: number[];
    currency?: string;
    labels?: string[];
    timeframe?: string;
  };
};

/**
 * Uses a small, fast LLM with strict JSON schema definitions to extract 
 * deep semantic intent and real entities without brittle string matching.
 */
export async function deduceNarrativeIntentAI(text: string): Promise<AnalysedIntentResult> {
  try {
    const response = await apiKey.chat.completions.create({
      model: 'gpt-4.1', // Extremely fast and cheap for classification tasks
      messages: [
        {
          role: 'system',
          content: `You are the structural intent engine for a procedural video system. Your job is to analyze a video script sentence and classify its core visualization intent into exactly ONE taxonomy token. You must also extract relevant entities. Do not invent tokens.`
        },
        {
          role: 'user',
          content: `Analyze this sentence: "${text}"`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "intent_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: {
                type: "string",
                enum: [
                  "SINGLE_METRIC",
                  "PROPORTIONAL_SPLIT",
                  "HISTORICAL_TREND",
                  "MATRIX_DISTRIBUTION",
                  "COMPETITIVE_VERSUS",
                  "VALUE_FLOW",
                  "ACCELERATION_VECTOR",
                  "CORE_THESIS",
                  "STATUS_BADGE"
                ]
              },
              dataHints: {
                type: "object",
                properties: {
                  country: { type: ["string", "null"] },
                  metrics: { type: "array", items: { type: "number" } },
                  currency: { type: ["string", "null"] },
                  labels: { type: "array", items: { type: "string" } },
                  timeframe: { type: ["string", "null"] }
                },
                required: ["country", "metrics", "currency", "labels", "timeframe"],
                additionalProperties: false
              }
            },
            required: ["intent", "dataHints"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.0, // Absolute deterministic accuracy
    });

    const parsedResult = JSON.parse(response.choices[0].message.content || '{}');
    return parsedResult as AnalysedIntentResult;

  } catch (error) {
    console.error("AI Intent Parsing failed, falling back to safe baseline:", error);
    // Bulletproof baseline safe fallback if network drops or API rate-limits
    return {
      intent: 'SINGLE_METRIC',
      dataHints: {}
    };
  }
}
