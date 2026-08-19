// src/core/planning/selectWidgetsRobust.ts

import { NarrativeBeat } from '../narrative/narrativeAnalyzer.js';
import { widgetRegistry } from '../widgetRegistry.js';
import { WidgetType } from '../taxonomy/widgetTaxonomy.js';
import { supabase } from '../../lib/supabaseClient.js';

export type SelectedWidget = {
  beatId: string;
  widgetType: WidgetType;
  dataHints: Record<string, any>;
  metadata: {
    intent: string;
    role: string;
    primaryIdeaText: string;
    primaryIdeaMeaning?: string;
    ideaType: string;
  };
};

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90,
};

function normalizeNumber(value: string): number | null {
  const numeric = Number(value.replace(/,/g, ''));
  if (Number.isFinite(numeric)) return numeric;

  const words = value.toLowerCase().split(/[- ]+/).filter(Boolean);
  if (words.length === 1 && NUMBER_WORDS[words[0]] !== undefined) return NUMBER_WORDS[words[0]];
  if (words.length === 2 && NUMBER_WORDS[words[0]] !== undefined && NUMBER_WORDS[words[1]] !== undefined) {
    return NUMBER_WORDS[words[0]] + NUMBER_WORDS[words[1]];
  }
  return null;
}

export function extractDataHints(text: string): Record<string, any> {
  const normalized = text.replace(/[\u2013\u2014]/g, '-');
  const values: number[] = [];
  const valuePattern = /\b(\d+(?:\.\d+)?|[a-z]+(?:-[a-z]+)?)\s*(?:percent|%)(?=\s|[.,;!?)]|$)/gi;
  for (const match of normalized.matchAll(valuePattern)) {
    const value = normalizeNumber(match[1]);
    if (value !== null) values.push(value);
  }

  const labels = [...normalized.matchAll(/\b(?:quarter|q)\s*[- ]?([1-4])\b/gi)]
    .map((match) => `Q${match[1]}`);

  if (labels.length === 0 && values.length === 1) {
    const labelMatch = normalized.match(/\b([a-z][a-z ]{2,40}?)\s+represent(?:s)?\b/i);
    if (labelMatch) {
      labels.push(labelMatch[1].split(',').pop()?.trim() || labelMatch[1].trim());
    }
  }

  if (values.length === 0) return {};

  const uniqueLabels = labels.filter((label, index) => labels.indexOf(label) === index);
  const chartLabels = uniqueLabels.length === values.length
    ? uniqueLabels
    : values.map((_, index) => uniqueLabels[index] ?? `Metric ${index + 1}`);
  const chartValues = values.slice(0, chartLabels.length);

  // A single share is more useful as a complete split when the remainder is known.
  if (chartValues.length === 1 && chartValues[0] > 0 && chartValues[0] < 100) {
    chartLabels.push('Other');
    chartValues.push(100 - chartValues[0]);
  }

  return {
    labels: chartLabels,
    values: chartValues,
    data: { labels: chartLabels, values: chartValues },
  };
}

function inferIntents(text: string): Set<string> {
  const lower = text.toLowerCase();
  const intents = new Set<string>();

  if (/market share|share of|proportion|split|allocation|represent/.test(lower)) {
    intents.add('PROPORTIONAL_SPLIT');
  }
  if (/quarter|month|year|over time|histor|trend|growth|jumped|surged|increased|declined|accelerat/.test(lower)) {
    intents.add('HISTORICAL_TREND');
    intents.add('ACCELERATION_VECTOR');
  }
  if (/versus|vs\.?|compared|comparison|against/.test(lower)) intents.add('COMPETITIVE_VERSUS');
  if (/\b\d+(?:\.\d+)?\b|\b(?:one|two|three|four|five|sixty|seventy|eighty|ninety)\b/.test(lower)) {
    intents.add('SINGLE_METRIC');
  }
  if (intents.size === 0) intents.add('CORE_THESIS');
  return intents;
}

/**
 * Robustly selects the best matching graphical layout widgets for each individual narrative beat.
 * This execution layer runs purely in-memory to safely handle serverless deployments.
 */
export async function selectWidgetsRobust(beats: NarrativeBeat[]): Promise<SelectedWidget[]> {
  // 🛠️ Guard check against empty arrays or undefined pipelines
  if (!beats || beats.length === 0) {
    throw new Error("Execution failed: Narrative beats matrix is empty or undefined. Pipeline halted.");
  }

  const usedWidgetsGlobal = new Set<string>();
  const batchPassTallies: Record<string, { count: number }> = {};

  console.log(`\n==== SELECTING WIDGETS: PROCESSING PIPELINE MEMORY MATRICES (${beats.length} Beats) ====`);

  const selectedWidgets = beats.map((beat) => {
    const text = beat.sentenceText.toLowerCase();
    const intent = beat.intent || 'concept';
    const role = beat.narrativeRole || 'middle';
    
    // Extract the semantic idea selected by the narrative analyzer
    const primaryIdea = beat.selectedIdeas?.[0];
    const primaryIdeaText = primaryIdea?.phrase || beat.sentenceText;
    const ideaType = primaryIdea?.type || intent;
    const inferredIntents = inferIntents(beat.sentenceText);
    const dataHints = extractDataHints(beat.sentenceText);

    let selectedWidgetType: string | null = null;
    let highestScore = -Infinity;
    let validCandidates: string[] = [];

    // Loop through ALL widgets declared in the widget registry dynamically
    for (const [widgetType, meta] of Object.entries(widgetRegistry)) {
      const shouldAvoid = (meta.avoidFor ?? []).some((keyword) => text.includes(keyword.toLowerCase()));
      if (shouldAvoid) continue;

      let score = 0;

      // Base weight for matching general typography options
      if (meta.category === 'TEXT_TYPOGRAPHY') {
        score += 10; 
      }

      // The registry declares which semantic intents each widget supports.
      // This keeps the planner independent from individual component names.
      const intentMatches = meta.intents.filter((candidate) => inferredIntents.has(candidate)).length;
      score += intentMatches * 40;
      if (inferredIntents.has('PROPORTIONAL_SPLIT') && meta.intents.includes('PROPORTIONAL_SPLIT')) score += 20;
      if (inferredIntents.has('HISTORICAL_TREND') && meta.intents.includes('HISTORICAL_TREND')) score += 20;
      if (meta.category === 'DATA_REPORTING' && Object.keys(dataHints).length > 0) score += 20;
      
      // Match the analyzer's exact selected intent or idea type to the widget's bestFor criteria
      const matchesIntent = (meta.bestFor ?? []).some(
        (keyword) => keyword.toLowerCase() === intent.toLowerCase() || keyword.toLowerCase() === ideaType.toLowerCase()
      );
      if (matchesIntent) {
        score += 30;
      }

      // Dynamic position weight modifiers
      if (role === 'intro' && widgetType.includes('TITLE')) score += 10;
      if (role === 'outro' && (widgetType.includes('TYPEWRITER') || widgetType.includes('CARD'))) score += 5;

      // Global pacing de-duplication penalty
      if (usedWidgetsGlobal.has(widgetType)) {
        score -= 15;
      }

      if (score > highestScore) {
        highestScore = score;
        validCandidates = [widgetType];
      } else if (score === highestScore) {
        validCandidates.push(widgetType);
      }
    }

    // Assign best scoring candidate, or default to the first registry key available
    if (validCandidates.length > 0 && highestScore > -100) {
      // Keep scene generation reproducible for the same transcript and registry.
      selectedWidgetType = validCandidates[0];
    } else {
      selectedWidgetType = Object.keys(widgetRegistry)[0];
    }

    usedWidgetsGlobal.add(selectedWidgetType);

    if (!batchPassTallies[selectedWidgetType]) {
      batchPassTallies[selectedWidgetType] = { count: 0 };
    }
    batchPassTallies[selectedWidgetType].count += 1;

    return {
      beatId: beat.beatId,
      widgetType: selectedWidgetType as WidgetType,
      metadata: {
        intent,
        role,
        primaryIdeaText,
        primaryIdeaMeaning: primaryIdea?.meaning,
        ideaType
      },
      dataHints,
    };
  });

  // Log telemetry metrics safely using database RPC hooks
  if (Object.keys(batchPassTallies).length > 0) {
    const upsertPayload = Object.entries(batchPassTallies).map(([widgetType, data]) => ({
      widget_type: widgetType,
      intent_category: 'PIPELINE_IN_MEMORY_SELECTION',
      global_render_count: data.count,
      updated_at: new Date().toISOString(),
    }));

    Promise.resolve(
      supabase.rpc('increment_widget_tallies', { payload: upsertPayload })
    ).catch((err) => {
      console.warn('Telemetry tally logging skipped:', err);
    });
  }

  return selectedWidgets;
}
