// src/core/narrative/narrativeAnalyzer.ts

import fs from 'fs';
import path from 'path';

import OpenAI from 'openai';

import {
  SemanticExtraction,
} from '../segmentation/semanticExtraction';

const apiKey = process.env.OPENAI_API_KEY;

//
// ============================================================
// TYPES
// ============================================================
//

export type NarrativeBeat = {
  beatId: string;

  sourceSentenceId: string;

  sentenceText: string;

  timing: {
    startSec: number;
    endSec: number;
    startFrame: number;
    endFrame: number;
    durationFrames: number;
  };

  beatPurpose:
    | 'hook'
    | 'context'
    | 'scale'
    | 'finance'
    | 'impact'
    | 'transition'
    | 'payoff'
    | 'symbolic';

  narrativeRole:
    | 'intro'
    | 'middle'
    | 'outro';

  selectedIdeas: {
    id: string;
    phrase: string;
    type: string;
    importance: number;
    visualPotential: number;
  }[];

  emotionalIntensity: number;

  reasoning: string;
};

//
// ============================================================
// HELPERS
// ============================================================
//

function secondsToFrames(
  seconds: number,
  fps = 30
) {
  return Math.round(seconds * fps);
}

function clamp(
  value: number,
  min: number,
  max: number
) {
  return Math.max(min, Math.min(max, value));
}

//
// ============================================================
// AI BEAT PLANNER
// ============================================================
//

async function generateNarrativeBeats(
  sentence: SemanticExtraction
) {

  const totalDuration =
    sentence.timing.endSec -
    sentence.timing.startSec;

  const recommendedBeatCount =
    totalDuration < 4
      ? 1
      : totalDuration < 8
      ? 2
      : totalDuration < 12
      ? 3
      : 4;

  const prompt = `
You are an AI cinematic pacing director.

You divide narration into cinematic beats.

IMPORTANT:
- You DO NOT create new global timing.
- You ONLY subdivide the sentence duration.
- Total beat durations MUST equal sentence duration.

Sentence:
${sentence.sentenceText}

Sentence Duration:
${totalDuration}

Narrative Section:
${sentence.narrativePosition.section}

Semantic Ideas:
${JSON.stringify(sentence.semanticIdeas, null, 2)}

TASK:

Create cinematic beats.

Rules:
- Recommended beat count: ${recommendedBeatCount}
- You may override if cinematically necessary
- Each beat should feel emotionally distinct
- Beats should form a progression
- Total durations MUST approximately equal ${totalDuration}

OUTPUT JSON ONLY:

{
  "beats": [
    {
      "beatPurpose": "",
      "durationRatio": 0.3,
      "selectedIdeaIds": [],
      "emotionalIntensity": 0.7,
      "reasoning": ""
    }
  ]
}

IMPORTANT:
- durationRatio values across all beats MUST total 1.0
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
            'You are a cinematic pacing AI.',
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

  return JSON.parse(raw);
}

//
// ============================================================
// MAIN ANALYZER
// ============================================================
//

export async function narrativeAnalyzer(
  semanticExtractions: SemanticExtraction[]
): Promise<NarrativeBeat[]> {

  const allBeats: NarrativeBeat[] = [];

  let globalBeatIndex = 0;

  for (const sentence of semanticExtractions) {

    const aiPlan =
      await generateNarrativeBeats(
        sentence
      );

    const beats =
      aiPlan.beats ?? [];

    if (!beats.length) {
      continue;
    }

    //
    // --------------------------------------------------------
    // NORMALIZE RATIOS
    // --------------------------------------------------------
    //

    const ratioTotal = beats.reduce(
      (sum: number, beat: any) =>
        sum + (beat.durationRatio ?? 0),
      0
    );

    const normalizedBeats =
      beats.map((beat: any) => ({
        ...beat,
        normalizedRatio:
          (beat.durationRatio ?? 0) /
          ratioTotal,
      }));

    //
    // --------------------------------------------------------
    // SUBDIVIDE SENTENCE TIMING
    // --------------------------------------------------------
    //

    const sentenceStart =
      sentence.timing.startSec;

    const sentenceEnd =
      sentence.timing.endSec;

    const totalDuration =
      sentenceEnd - sentenceStart;

    let cursor = sentenceStart;

    normalizedBeats.forEach(
      (beat: any, index: number) => {

        const isLast =
          index ===
          normalizedBeats.length - 1;

        const durationSec = isLast
          ? sentenceEnd - cursor
          : totalDuration *
            beat.normalizedRatio;

        const startSec = cursor;

        const endSec =
          startSec + durationSec;

        cursor = endSec;

        //
        // MAP IDEAS
        //

        const selectedIdeas =
          sentence.semanticIdeas.filter(
            (idea) =>
              beat.selectedIdeaIds.includes(
                idea.id
              )
          );

        allBeats.push({
          beatId: `beat_${
            globalBeatIndex + 1
          }`,

          sourceSentenceId:
            sentence.sentenceId,

          sentenceText:
            sentence.sentenceText,

          timing: {
            startSec,
            endSec,

            startFrame:
              secondsToFrames(startSec),

            endFrame:
              secondsToFrames(endSec),

            durationFrames:
              secondsToFrames(
                durationSec
              ),
          },

          beatPurpose:
            beat.beatPurpose,

          narrativeRole:
            sentence
              .narrativePosition
              .section,

          selectedIdeas:
            selectedIdeas.map(
              (idea) => ({
                id: idea.id,
                phrase: idea.phrase,
                type: idea.type,
                importance:
                  idea.importance,
                visualPotential:
                  idea.visualPotential,
              })
            ),

          emotionalIntensity:
            clamp(
              beat.emotionalIntensity ??
                0.5,
              0,
              1
            ),

          reasoning:
            beat.reasoning ?? '',
        });

        globalBeatIndex++;
      }
    );
  }

  //
  // ==========================================================
  // SAVE
  // ==========================================================
  //

  const outputPath = path.resolve(
    process.cwd(),
    'public',
    '04_narrative_analysis.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(allBeats, null, 2)
  );

  console.log(
    'Narrative analysis saved:',
    outputPath
  );

  return allBeats;
}