// src/core/decisionTrees/decisionTree.ts
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

import {
  NarrativeBeat,
} from '../narrative/narrativeAnalyzer';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

//
// ============================================================
// TYPES
// ============================================================
//

export type CinematicDecision = {
  beatId: string;

  visualStrategy:
    | 'title_card'
    | 'process_flow'
    | 'bullet_points'
    | 'geographic_reveal'
    | 'data_visualization'
    | 'symbolic_tableau'
    | 'environmental_reveal'
    | 'kinetic_typography'
    | 'hybrid';

  motionStyle:
    | 'slow_push'
    | 'sequential_reveal'
    | 'parallax'
    | 'particle_build'
    | 'flow_motion'
    | 'symbolic_transform';

  transitionStrategy:
    | 'hard_cut'
    | 'crossfade'
    | 'additive_blend'
    | 'motion_warp'
    | 'camera_continuation'
    | 'symbolic_morph';

  cameraBehavior:
    | 'locked'
    | 'slow_dolly'
    | 'parallax_orbit'
    | 'push_in'
    | 'drift';

  layoutStrategy:
    | 'center_focus'
    | 'split_composition'
    | 'stacked_information'
    | 'immersive_environment'
    | 'symbolic_stage';

  reasoning: string;
};

//
// ============================================================
// AI VISUAL DIRECTOR
// ============================================================
//

async function generateCinematicDecision(
  beat: NarrativeBeat
): Promise<CinematicDecision> {

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

  const response =
    await openai.chat.completions.create({
      model: 'gpt-4.1',

      temperature: 0.7,

      response_format: {
        type: 'json_object',
      },

      messages: [
        {
          role: 'system',
          content:
            'You are a cinematic visual planning AI.',
        },

        {
          role: 'user',
          content: prompt,
        },
      ],
    });

  const raw =
    response.choices[0].message.content ??
    '{}';

  const parsed =
    JSON.parse(raw);

  return {
    beatId: beat.beatId,

    visualStrategy:
      parsed.visualStrategy,

    motionStyle:
      parsed.motionStyle,

    transitionStrategy:
      parsed.transitionStrategy,

    cameraBehavior:
      parsed.cameraBehavior,

    layoutStrategy:
      parsed.layoutStrategy,

    reasoning:
      parsed.reasoning ?? '',
  };
}

//
// ============================================================
// MAIN ENGINE
// ============================================================
//

// 1. Declare a structured input type matching what route.tsx passes
type DecisionTreeInput = {
  semanticExtractions: any[];
  narrativeScenes: NarrativeBeat[];
};

export async function decisionTree({
  semanticExtractions,
  narrativeScenes,
}: DecisionTreeInput): Promise<CinematicDecision[]> {

  const decisions: CinematicDecision[] = [];

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

  const outputPath = path.resolve(
    process.cwd(),
    'public',
    '05_decision_tree_output.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(decisions, null, 2)
  );

  console.log(
    'Decision tree output saved:',
    outputPath
  );

  return decisions;
}