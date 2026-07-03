"use strict";
// src/core/planning/intentParser.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deduceNarrativeIntentAI = deduceNarrativeIntentAI;
const openai_1 = __importDefault(require("openai"));
const apiKey = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
/**
 * Uses a small, fast LLM with strict JSON schema definitions to extract
 * deep semantic intent and real entities without brittle string matching.
 */
async function deduceNarrativeIntentAI(text) {
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
        return parsedResult;
    }
    catch (error) {
        console.error("AI Intent Parsing failed, falling back to safe baseline:", error);
        // Bulletproof baseline safe fallback if network drops or API rate-limits
        return {
            intent: 'SINGLE_METRIC',
            dataHints: {}
        };
    }
}
//# sourceMappingURL=intentParser.js.map