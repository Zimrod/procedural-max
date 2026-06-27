// src/core/narrative/narrativeAnalyzer.ts
import fs from 'fs';
import path from 'path';
import { SemanticExtraction } from '../segmentation/semanticExtraction';

export type NarrativeIntent =
  | 'concept'
  | 'capital_structure'
  | 'financial_metric'
  | 'geography'
  | 'process'
  | 'timeline'
  | 'comparison'
  | 'ownership'
  | 'entity'
  | 'statistic'
  | 'outcome';

export interface NarrativeBeat {
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
  intent: NarrativeIntent;
  narrativeRole: 'intro' | 'middle' | 'outro';
  selectedIdeas: {
    id: string;
    phrase: string;
    type: string;
    importance: number;
    visualPotential: number;
  }[];
  emotionalIntensity: number;
  reasoning: string;
}

/**
 * Maps semantic tags to programmatic widget taxonomy intents
 */
function mapIdeaTypeToIntent(type: string): NarrativeIntent {
  const t = type.toLowerCase();
  if (t.includes('finance') || t.includes('capital') || t.includes('debt') || t.includes('equity')) return 'capital_structure';
  if (t.includes('metric') || t.includes('ratio') || t.includes('dscr') || t.includes('noi')) return 'financial_metric';
  if (t.includes('process') || t.includes('flow') || t.includes('step') || t.includes('sequence')) return 'process';
  if (t.includes('timeline') || t.includes('schedule') || t.includes('gantt')) return 'timeline';
  if (t.includes('geography') || t.includes('country') || t.includes('map')) return 'geography';
  if (t.includes('comparison') || t.includes('versus')) return 'comparison';
  if (t.includes('ownership') || t.includes('shareholder')) return 'ownership';
  if (t.includes('statistic') || t.includes('percent')) return 'statistic';
  if (t.includes('institutional') || t.includes('role') || t.includes('bank')) return 'entity';
  return 'concept';
}

export function narrativeAnalyzer(extractions: SemanticExtraction[]): NarrativeBeat[] {
  const beats: NarrativeBeat[] = [];

  for (let i = 0; i < extractions.length; i++) {
    const sentence = extractions[i];
    
    // Safety check: If the sentence layer has zero ideas, build a simple fallback
    if (!sentence.semanticIdeas || sentence.semanticIdeas.length === 0) {
      beats.push({
        beatId: `beat_${i + 1}`,
        sourceSentenceId: sentence.sentenceId,
        sentenceText: sentence.sentenceText,
        timing: { ...sentence.timing },
        intent: 'concept',
        narrativeRole: (sentence.narrativePosition.section as any) || 'middle',
        selectedIdeas: [],
        emotionalIntensity: sentence.semanticSummary?.emotionalIntensity ?? 0.5,
        reasoning: 'Fallback beat setup due to empty idea matrix array.',
      });
      continue;
    }

    // -------------------------------------------------------------------------
    // WINNING THE BEAT VICTORY: Sort ideas to find the ONE highest value focus
    // -------------------------------------------------------------------------
    const primaryIdea = [...sentence.semanticIdeas].sort((a, b) => {
      // Prioritize highest structural importance first, then visual potential
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.visualPotential - a.visualPotential;
    })[0];

    const chosenIntent = mapIdeaTypeToIntent(primaryIdea.type);

    // Build exactly one beat asset keeping the true timing frame lengths
    beats.push({
      beatId: `beat_${i + 1}`,
      sourceSentenceId: sentence.sentenceId,
      sentenceText: sentence.sentenceText,
      timing: {
        startSec: sentence.timing.startSec,
        endSec: sentence.timing.endSec,
        startFrame: sentence.timing.startFrame,
        endFrame: sentence.timing.endFrame,
        durationFrames: sentence.timing.durationFrames, // Keeps your 1152 frames exact
      },
      intent: chosenIntent,
      narrativeRole: (sentence.narrativePosition.section as any) || 'middle',
      selectedIdeas: [
        {
          id: primaryIdea.id,
          phrase: primaryIdea.phrase,
          type: primaryIdea.type,
          importance: primaryIdea.importance,
          visualPotential: primaryIdea.visualPotential,
        },
      ],
      emotionalIntensity: sentence.semanticSummary?.emotionalIntensity ?? 0.5,
      reasoning: `Selected primary structural focus "${primaryIdea.phrase}" (${primaryIdea.type}) out of ${sentence.semanticIdeas.length} potential semantic tags.`,
    });
  }

  // Write out the pristine un-duplicated sequence file mapping perfectly to your transcription
  const outputPath = path.resolve(process.cwd(), 'public', '04_narrative_analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(beats, null, 2));

  return beats;
}