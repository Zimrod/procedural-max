"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionTree = decisionTree;
// src/core/decisionTrees/decisionTree.ts
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
//
// ============================================================
// AI VISUAL DIRECTOR
// ============================================================
//
async function generateCinematicDecision(beat) {
    const prompt = `
You are an AI cinematic motion graphics director.

You are given an EXISTING narrative beat.

You DO NOT create timing.
You DO NOT change timing.
You ONLY decide cinematic presentation.

Narrative Beat:
${JSON.stringify(beat, null, 2)}

TASK:
Decide:

- visual strategy
- motion style
- transition style
- camera behavior
- layout composition

OUTPUT JSON ONLY:

{
  "visualStrategy": "",
  "motionStyle": "",
  "transitionStrategy": "",
  "cameraBehavior": "",
  "layoutStrategy": "",
  "reasoning": ""
}
`;
    const response = await openai.chat.completions.create({
        model: 'gpt-4.1',
        temperature: 0.7,
        response_format: {
            type: 'json_object',
        },
        messages: [
            {
                role: 'system',
                content: 'You are a cinematic visual planning AI.',
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
    });
    const raw = response.choices[0].message.content ??
        '{}';
    const parsed = JSON.parse(raw);
    return {
        beatId: beat.beatId,
        sourceSentenceId: beat.sourceSentenceId,
        visualStrategy: parsed.visualStrategy,
        motionStyle: parsed.motionStyle,
        transitionStrategy: parsed.transitionStrategy,
        cameraBehavior: parsed.cameraBehavior,
        layoutStrategy: parsed.layoutStrategy,
        reasoning: parsed.reasoning ?? '',
    };
}
async function decisionTree({ semanticExtractions, narrativeScenes, }) {
    const decisions = [];
    // 2. Safeguard input processing with an array check runtime guard
    const beatsToProcess = Array.isArray(narrativeScenes) ? narrativeScenes : [];
    for (const beat of beatsToProcess) {
        const decision = await generateCinematicDecision(beat);
        decisions.push(decision);
    }
    //
    // ==========================================================
    // SAVE
    // ==========================================================
    //
    const outputPath = path_1.default.resolve(process.cwd(), 'public', '05_decision_tree_output.json');
    fs_1.default.writeFileSync(outputPath, JSON.stringify(decisions, null, 2));
    console.log('Decision tree output saved:', outputPath);
    return decisions;
}
//# sourceMappingURL=decisionTree.js.map