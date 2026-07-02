// src/core/segmentation/semanticExtraction.ts

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error("OPENAI_API_KEY is not set");
}

const openai = new OpenAI({ apiKey });

//
// --------------------------------------------------------
// BASE INPUT TYPE
// --------------------------------------------------------
//

export type SentenceSegment = {
  id: string;

  text: string;

  startSec: number;
  endSec: number;

  startFrame: number;
  endFrame: number;

  durationFrames: number;

  words?: {
    word: string;
    start: number;
    end: number;
  }[];
};

export type TranscriptionWord = {
  word: string;
  start: number;
  end: number;
};

//
// --------------------------------------------------------
// SEMANTIC IDEA TYPES
// --------------------------------------------------------
//

export type SemanticIdeaType =
  | 'energy_capacity'
  | 'infrastructure'
  | 'finance'
  | 'geography'
  | 'human_impact'
  | 'technology'
  | 'environment'
  | 'growth'
  | 'investment'
  | 'symbolism'
  | 'process_outcome'
  | 'problem'
  | 'solution'
  | 'vision'
  | 'opportunity'
  | 'market'
  | 'timeline'
  | 'organization'
  | 'social_impact'
  | 'economic_impact'
  | 'abstract_concept'
  | 'cta'
  | 'unknown';

//
// --------------------------------------------------------
// NARRATIVE SECTION
// --------------------------------------------------------
//

export type NarrativeSection =
  | 'intro'
  | 'middle'
  | 'outro';

//
// --------------------------------------------------------
// RELATIONSHIP TYPES
// --------------------------------------------------------
//

export type SemanticRelationshipType =
  | 'supports'
  | 'causes'
  | 'results_in'
  | 'located_in'
  | 'funds'
  | 'powers'
  | 'modifies'
  | 'describes'
  | 'depends_on'
  | 'parent_of'
  | 'sequence';

//
// --------------------------------------------------------
// SEMANTIC IDEA
// --------------------------------------------------------
//

export type SemanticIdea = {
  id: string;

  type: SemanticIdeaType;

  phrase: string;

  meaning: string;

  importance: number;

  emotionalWeight: number;

  visualPotential: number;

  abstractionLevel: number;

  parentRelationship?: string | null;

  cinematicRole:
    | 'primary'
    | 'secondary'
    | 'supporting';

  timingWeight: number;
};

//
// --------------------------------------------------------
// RELATIONSHIPS
// --------------------------------------------------------
//

export type SemanticRelationship = {
  from: string;

  to: string;

  relationshipType: SemanticRelationshipType;
};

//
// --------------------------------------------------------
// EXTRACTION OUTPUT
// --------------------------------------------------------
//

export type SemanticExtraction = {
  sentenceId: string;

  sentenceText: string;

  timing: {
    startSec: number;
    endSec: number;

    startFrame: number;
    endFrame: number;

    durationFrames: number;
  };

  narrativePosition: {
    section: NarrativeSection;

    progressionWeight: number;
  };

  semanticIdeas: SemanticIdea[];

  semanticRelationships: SemanticRelationship[];

  semanticSummary: {
    dominantTheme: string;

    complexityScore: number;

    emotionalIntensity: number;

    visualDensity: number;

    recommendedMaxVisualIdeas: number;
  };

  reasoning: string;

  confidence: number;
};

//
// --------------------------------------------------------
// HELPERS
// --------------------------------------------------------
//

function determineNarrativeSection(
  index: number,
  total: number
): NarrativeSection {
  const ratio = index / total;

  if (ratio <= 0.2) {
    return 'intro';
  }

  if (ratio >= 0.8) {
    return 'outro';
  }

  return 'middle';
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function isSentenceBoundary(word: string): boolean {
  return /[.!?]["')\]]*$/.test(word);
}

export function segmentTranscriptionIntoSentences(
  words: TranscriptionWord[],
  fps: number = 30
): SentenceSegment[] {
  const segments: SentenceSegment[] = [];
  let currentWords: TranscriptionWord[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentWords.push(word);

    const isLastWord = i === words.length - 1;
    const shouldCloseSentence =
      isSentenceBoundary(word.word) || isLastWord;

    if (!shouldCloseSentence) {
      continue;
    }

    const startSec = currentWords[0].start;
    const endSec = currentWords[currentWords.length - 1].end;
    const startFrame = Math.floor(startSec * fps);
    // Use ceil for endFrame so the final spoken partial-second is included
    const endFrame = Math.ceil(endSec * fps);

    segments.push({
      id: `sentence-${segments.length + 1}`,
      text: currentWords
        .map((currentWord) => currentWord.word)
        .join(' '),
      startSec,
      endSec,
      startFrame,
      endFrame,
      durationFrames: Math.max(1, endFrame - startFrame),
      words: [...currentWords],
    });

    currentWords = [];
  }

  return segments;
}

//
// --------------------------------------------------------
// PROMPT
// --------------------------------------------------------
//

function buildPrompt(
  segment: SentenceSegment,
  narrativeSection: NarrativeSection
) {
  return `
You are a cinematic semantic extraction engine.

Your task is NOT to choose widgets.

Your task is to deeply analyze the meaning structure of a sentence for a future cinematic motion graphics system.

You must extract:

- semantic ideas
- semantic relationships
- narrative meaning
- conceptual hierarchy
- cinematic importance

--------------------------------------------------
CRITICAL RULES
--------------------------------------------------

1. Treat the ENTIRE sentence as a connected semantic unit.

2. DO NOT fragment related concepts.

3. Numbers MUST remain attached to their denomination and meaning.

BAD:
125
million

GOOD:
125 megawatt
348 million dollars
19,000 homes

4. Identify semantic concepts, not words.

5. Concepts may represent:
- finance
- geography
- energy
- infrastructure
- growth
- symbolism
- social impact
- technology
- environmental outcomes
- investment opportunity
- processes
- cause/effect

6. Extract relationships between concepts.

7. Decide which concepts are:
- primary
- secondary
- supporting

8. Estimate cinematic usefulness:
- emotional impact
- visual potential
- abstraction level
- pacing importance

9. Some sentences represent:
- process trees
- parent/outcome structures
- symbolic vision
- geographic reveals
- financial arguments
- environmental transformation

Recognize these structures.

--------------------------------------------------
NARRATIVE CONTEXT
--------------------------------------------------

Sentence section:
${narrativeSection}

--------------------------------------------------
INPUT SENTENCE
--------------------------------------------------

"${segment.text}"

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return ONLY valid JSON.

{
  "semanticIdeas": [
    {
      "id": "idea_01",
      "type": "finance",
      "phrase": "$348 million funding",
      "meaning": "Large scale funding requirement",
      "importance": 0.95,
      "emotionalWeight": 0.7,
      "visualPotential": 0.9,
      "abstractionLevel": 0.3,
      "parentRelationship": null,
      "cinematicRole": "primary",
      "timingWeight": 0.8
    }
  ],

  "semanticRelationships": [
    {
      "from": "idea_01",
      "to": "idea_02",
      "relationshipType": "supports"
    }
  ],

  "semanticSummary": {
    "dominantTheme": "Renewable energy investment",
    "complexityScore": 0.7,
    "emotionalIntensity": 0.6,
    "visualDensity": 0.8,
    "recommendedMaxVisualIdeas": 3
  },

  "reasoning": "Explanation",

  "confidence": 0.95
}
`;
}

//
// --------------------------------------------------------
// SINGLE EXTRACTION
// --------------------------------------------------------
//

export async function extractSemanticMeaning(
  segment: SentenceSegment,
  index: number,
  total: number
): Promise<SemanticExtraction> {
  const narrativeSection =
    determineNarrativeSection(index, total);

  const prompt = buildPrompt(
    segment,
    narrativeSection
  );

  const response =
    await openai.chat.completions.create({
      model: 'gpt-4.1',

      response_format: {
        type: 'json_object',
      },

      messages: [
        {
          role: 'system',
          content:
            'You are a semantic cinematography extraction engine.',
        },

        {
          role: 'user',
          content: prompt,
        },
      ],
    });

  const raw =
    response.choices[0].message.content ?? '{}';

  const parsed = JSON.parse(raw);

  return {
    sentenceId: segment.id,

    sentenceText: segment.text,

    timing: {
      startSec: segment.startSec,
      endSec: segment.endSec,

      startFrame: segment.startFrame,
      endFrame: segment.endFrame,

      durationFrames: segment.durationFrames,
    },

    narrativePosition: {
      section: narrativeSection,

      progressionWeight: clamp(
        index / Math.max(total - 1, 1)
      ),
    },

    semanticIdeas:
      parsed.semanticIdeas ?? [],

    semanticRelationships:
      parsed.semanticRelationships ?? [],

    semanticSummary: {
      dominantTheme:
        parsed.semanticSummary?.dominantTheme ??
        'Unknown',

      complexityScore: clamp(
        parsed.semanticSummary?.complexityScore ?? 0.5
      ),

      emotionalIntensity: clamp(
        parsed.semanticSummary?.emotionalIntensity ?? 0.5
      ),

      visualDensity: clamp(
        parsed.semanticSummary?.visualDensity ?? 0.5
      ),

      recommendedMaxVisualIdeas:
        parsed.semanticSummary
          ?.recommendedMaxVisualIdeas ?? 2,
    },

    reasoning:
      parsed.reasoning ??
      'No reasoning provided.',

    confidence:
      parsed.confidence ?? 0.5,
  };
}

//
// --------------------------------------------------------
// FALLBACK
// --------------------------------------------------------
//

function createFallbackExtraction(
  segment: SentenceSegment,
  index: number,
  total: number
): SemanticExtraction {
  return {
    sentenceId: segment.id,

    sentenceText: segment.text,

    timing: {
      startSec: segment.startSec,
      endSec: segment.endSec,

      startFrame: segment.startFrame,
      endFrame: segment.endFrame,

      durationFrames: segment.durationFrames,
    },

    narrativePosition: {
      section:
        determineNarrativeSection(
          index,
          total
        ),

      progressionWeight:
        index / Math.max(total - 1, 1),
    },

    semanticIdeas: [
      {
        id: 'fallback_idea',

        type: 'unknown',

        phrase: segment.text,

        meaning: segment.text,

        importance: 0.5,

        emotionalWeight: 0.5,

        visualPotential: 0.5,

        abstractionLevel: 0.5,

        cinematicRole: 'primary',

        timingWeight: 0.5,
      },
    ],

    semanticRelationships: [],

    semanticSummary: {
      dominantTheme: 'Unknown',

      complexityScore: 0.5,

      emotionalIntensity: 0.5,

      visualDensity: 0.5,

      recommendedMaxVisualIdeas: 1,
    },

    reasoning:
      'Fallback extraction used.',

    confidence: 0.2,
  };
}

//
// --------------------------------------------------------
// PIPELINE
// --------------------------------------------------------
//

export async function semanticExtractionPipeline(
  segments: SentenceSegment[]
): Promise<SemanticExtraction[]> {
  const results: SemanticExtraction[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    try {
      console.log(
        `Semantic extraction: ${i + 1}/${segments.length}`
      );

      const extraction =
        await extractSemanticMeaning(
          segment,
          i,
          segments.length
        );

      results.push(extraction);
    } catch (err) {
      console.error(
        'Semantic extraction failed:',
        segment.text,
        err
      );

      results.push(
        createFallbackExtraction(
          segment,
          i,
          segments.length
        )
      );
    }
  }

  //
  // SAVE OUTPUT
  //

  const outputPath = path.resolve(
    process.cwd(),
    'public',
    '03_semantic_extraction.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(results, null, 2)
  );

  console.log(
    'Semantic extraction saved:',
    outputPath
  );

  return results;
}
