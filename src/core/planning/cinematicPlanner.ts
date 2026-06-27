// src/core/cinematicPlanner/cinematicPlanner.ts

import fs from 'fs';
import path from 'path';

import {
  NarrativeBeat,
} from '../narrative/narrativeAnalyzer';

import {
  CinematicDecision,
} from '../decisionTrees/decisionTree';

//
// ============================================================
// OPENAI
// ============================================================
//

const apiKey = process.env.OPENAI_API_KEY;

//
// ============================================================
// TYPES
// ============================================================
//

export type CinematicShot = {
  shotId: string;

  sourceBeatId: string;

  timing: {
    startSec: number;
    endSec: number;
    startFrame: number;
    endFrame: number;
    durationFrames: number;
  };

  shotPurpose:
    | 'establish'
    | 'focus'
    | 'detail'
    | 'transition'
    | 'payoff'
    | 'emphasis'
    | 'symbolic';

  composition:
    | 'center_frame'
    | 'left_weighted'
    | 'right_weighted'
    | 'symmetrical'
    | 'foreground_depth'
    | 'environmental_scale'
    | 'floating_symbolic';

  cameraPlan: {
    behavior:
      | 'static'
      | 'slow_push'
      | 'parallax'
      | 'orbit'
      | 'drift'
      | 'follow_flow';

    intensity: number;

    shake:
      | 'none'
      | 'subtle'
      | 'cinematic'
      | 'impact';
  };

  lightingStyle:
    | 'clean_ui'
    | 'cinematic_dark'
    | 'high_contrast'
    | 'ambient_glow'
    | 'documentary'
    | 'symbolic';

  transitionIn:
    | 'cut'
    | 'fade'
    | 'motion_warp'
    | 'symbolic_morph'
    | 'camera_continue';

  transitionOut:
    | 'cut'
    | 'fade'
    | 'motion_warp'
    | 'symbolic_morph'
    | 'camera_continue';

  environmentBehavior:
    | 'minimal'
    | 'immersive'
    | 'particle_field'
    | 'abstract_space'
    | 'world_simulation';

  focalElements: string[];

  emotionalGoal: string;

  reasoning: string;
};

export type CinematicPlan = {
  beatId: string;

  cinematicLanguage:
    | 'documentary'
    | 'commercial'
    | 'cinematic'
    | 'symbolic'
    | 'hybrid';

  energyCurve: number;

  shots: CinematicShot[];

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

function isValidDecision(
  decision: any
): decision is CinematicDecision {
  return (
    decision &&
    typeof decision.beatId === 'string'
  );
}

//
// ============================================================
// AI SHOT PLANNER
// ============================================================
//

async function generateShotPlan(
  beat: NarrativeBeat,
  decision: CinematicDecision
): Promise<CinematicPlan> {

  const beatDuration =
    beat.timing.endSec -
    beat.timing.startSec;

  const prompt = `
You are an AI cinematic shot planner.

You receive:
1. A narrative beat
2. A cinematic direction decision

You must transform them into:
- cinematic shots
- visual progression
- camera choreography
- environmental behavior

IMPORTANT:
- Do NOT change beat timing
- Shots must fit INSIDE the beat duration
- Total shot durations must equal beat duration
- Think like a film director + motion designer

--------------------------------------------------
NARRATIVE BEAT
--------------------------------------------------

${JSON.stringify(beat, null, 2)}

--------------------------------------------------
CINEMATIC DECISION
--------------------------------------------------

${JSON.stringify(decision, null, 2)}

--------------------------------------------------
TASK
--------------------------------------------------

Create:
- 1 to 4 cinematic shots
- emotional progression
- camera rhythm
- composition changes
- environmental motion

IMPORTANT:
- Avoid repetitive compositions
- Escalate emotional rhythm when possible
- Shots should feel cinematic, not templated

--------------------------------------------------
OUTPUT JSON ONLY
--------------------------------------------------

{
  "cinematicLanguage": "",
  "energyCurve": 0.7,
  "shots": [
    {
      "shotPurpose": "",
      "durationRatio": 0.4,

      "composition": "",

      "cameraPlan": {
        "behavior": "",
        "intensity": 0.5,
        "shake": ""
      },

      "lightingStyle": "",

      "transitionIn": "",
      "transitionOut": "",

      "environmentBehavior": "",

      "focalElements": [],

      "emotionalGoal": "",

      "reasoning": ""
    }
  ],

  "reasoning": ""
}

IMPORTANT:
- durationRatio values must total 1.0
`;

  const response =
    await apiKey.chat.completions.create({
      model: 'gpt-4.1',

      temperature: 0.8,

      response_format: {
        type: 'json_object',
      },

      messages: [
        {
          role: 'system',
          content:
            'You are an expert cinematic storyboard AI.',
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
// MAIN ENGINE
// ============================================================
//

export async function cinematicPlanner(input: {
  narrativeBeats?: NarrativeBeat[];
  narrativeScenes?: NarrativeBeat[]; // Backwards compatibility alias for route.tsx
  cinematicDecisions?: CinematicDecision[];
  decisionTreeOutput?: CinematicDecision[]; // Backwards compatibility alias for route.tsx
}): Promise<CinematicPlan[]> {

  // Fallback assignment captures both the original and route parameter names cleanly
  const beats = input.narrativeBeats || input.narrativeScenes || [];
  const decisions = input.cinematicDecisions || input.decisionTreeOutput || [];

  //
  // ==========================================================
  // VALIDATE
  // ==========================================================
  //

  const validDecisions = Array.isArray(decisions)
    ? decisions.filter(isValidDecision)
    : [];

  const decisionMap = new Map(
    validDecisions.map((d) => [d.beatId, d])
  );

  const plans: CinematicPlan[] = [];

  //
  // ==========================================================
  // PROCESS BEATS
  // ==========================================================
  //

  // Change loop indicator variable from narrativeBeats to our guarded beats array context
  for (const beat of beats) {

    const decision = decisionMap.get(beat.beatId);

    if (!decision) {
      continue;
    }

    //
    // --------------------------------------------------------
    // AI PLAN
    // --------------------------------------------------------
    //

    const aiPlan =
      await generateShotPlan(
        beat,
        decision
      );

    const shots =
      aiPlan.shots ?? [];

    if (!shots.length) {
      continue;
    }

    //
    // --------------------------------------------------------
    // NORMALIZE RATIOS
    // --------------------------------------------------------
    //

    const ratioTotal = shots.reduce(
      (sum: number, shot: any) =>
        sum + (shot.durationRatio ?? 0),
      0
    );

    const normalizedShots =
      shots.map((shot: any) => ({
        ...shot,
        normalizedRatio:
          (shot.durationRatio ?? 0) /
          ratioTotal,
      }));

    //
    // --------------------------------------------------------
    // SUBDIVIDE BEAT TIMING
    // --------------------------------------------------------
    //

    const beatStart =
      beat.timing.startSec;

    const beatEnd =
      beat.timing.endSec;

    const totalDuration =
      beatEnd - beatStart;

    let cursor = beatStart;

    const cinematicShots:
      CinematicShot[] = [];

    normalizedShots.forEach(
      (shot: any, index: number) => {

        const isLast =
          index ===
          normalizedShots.length - 1;

        const durationSec = isLast
          ? beatEnd - cursor
          : totalDuration *
            shot.normalizedRatio;

        const startSec = cursor;

        const endSec =
          startSec + durationSec;

        cursor = endSec;

        cinematicShots.push({
          shotId: `${beat.beatId}_shot_${
            index + 1
          }`,

          sourceBeatId:
            beat.beatId,

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

          shotPurpose:
            shot.shotPurpose,

          composition:
            shot.composition,

          cameraPlan: {
            behavior:
              shot.cameraPlan
                ?.behavior ??
              'static',

            intensity:
              clamp(
                shot.cameraPlan
                  ?.intensity ?? 0.5,
                0,
                1
              ),

            shake:
              shot.cameraPlan
                ?.shake ?? 'none',
          },

          lightingStyle:
            shot.lightingStyle,

          transitionIn:
            shot.transitionIn,

          transitionOut:
            shot.transitionOut,

          environmentBehavior:
            shot.environmentBehavior,

          focalElements:
            shot.focalElements ?? [],

          emotionalGoal:
            shot.emotionalGoal ?? '',

          reasoning:
            shot.reasoning ?? '',
        });
      }
    );

    //
    // --------------------------------------------------------
    // PUSH PLAN
    // --------------------------------------------------------
    //

    plans.push({
      beatId: beat.beatId,

      cinematicLanguage:
        aiPlan.cinematicLanguage ??
        'hybrid',

      energyCurve:
        clamp(
          aiPlan.energyCurve ?? 0.5,
          0,
          1
        ),

      shots: cinematicShots,

      reasoning:
        aiPlan.reasoning ?? '',
    });
  }

  //
  // ==========================================================
  // SAVE
  // ==========================================================
  //

  const outputPath = path.resolve(
    process.cwd(),
    'public',
    '06_cinematic_plan.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(plans, null, 2)
  );

  console.log(
    'Cinematic planner output saved:',
    outputPath
  );

  return plans;
}