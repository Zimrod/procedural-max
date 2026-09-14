// src/core/planning/selectWidgetsRobust.ts

import fs from 'fs';
import path from 'path';
import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { widgetRegistry } from '../widgetRegistry';
import { WidgetType } from '../taxonomy/widgetTaxonomy';
import { supabase } from '../../lib/supabaseClient';

export type SelectedWidget = {
  beatId: string;
  widgetType: WidgetType;
  dataHints: Record<string, any>;
  metadata: {
    intent: string;
    role: string;
    primaryIdeaText: string;
    ideaType: string;
  };
};

export async function selectWidgetsRobust(beats?: NarrativeBeat[]): Promise<SelectedWidget[]> {
  const usedWidgetsGlobal = new Set<string>();
  const batchPassTallies: Record<string, { count: number }> = {};
  let lastWasDataWidget = false;

  // Read from the provided narrative analysis first, then fall back to disk.
  let sourceBeats = beats;
  if (!sourceBeats) {
    const analysisPath = path.resolve(process.cwd(), 'public', '04_narrative_analysis.json');
    if (!fs.existsSync(analysisPath)) {
      throw new Error(`Execution failed: ${analysisPath} does not exist on disk.`);
    }

    sourceBeats = JSON.parse(fs.readFileSync(analysisPath, 'utf-8')) as NarrativeBeat[];
  }

  const resolvedBeats = sourceBeats ?? [];
  const supportedCountries = ['zimbabwe', 'botswana', 'mali', 'kenya', 'zambia'];

  console.log(`\n==== SELECTING WIDGETS FROM DISK: 04_NARRATIVE_ANALYSIS.JSON (${resolvedBeats.length} Beats) ====`);

  const selectedWidgets = resolvedBeats.map((beat) => {
    const text = beat.sentenceText.toLowerCase();
    const intent = beat.intent || 'concept';
    const role = beat.narrativeRole || 'middle';
    
    // Extract the semantic idea selected by the narrative analyzer
    const primaryIdea = beat.selectedIdeas?.[0];
    const primaryIdeaText = primaryIdea?.phrase || beat.sentenceText;
    const ideaType = primaryIdea?.type || intent;
    const hasDataSignal = /(?:\$\s*)?\d+(?:\.\d+)?\s*(?:%|percent|x|trillion|billion|million)\b/i.test(beat.sentenceText);
    const country = supportedCountries.find((candidate) =>
      new RegExp(`\\b${candidate}\\b`, 'i').test(beat.sentenceText)
    );
    const hasGeographySignal = Boolean(country) && /\b(country|geograph|region|located|location|map|africa|southern|northern|eastern|western)\b/i.test(text);

    let selectedWidgetType: string | null = null;
    const rankedCandidates: Array<{ widgetType: string; category: string; score: number }> = [];

    // Loop through ALL widgets declared in the widget registry dynamically
    for (const [widgetType, meta] of Object.entries(widgetRegistry)) {
      // Never emit an empty chart. A numeric claim without a chart-ready data
      // signal is better represented as typography.
      if (meta.category === 'DATA_REPORTING' && !hasDataSignal) {
        continue;
      }

      const shouldAvoid = (meta.avoidFor ?? []).some((keyword) => text.includes(keyword.toLowerCase()));
      if (shouldAvoid) continue;

      let score = 0;

      // Base weight for matching general typography options
      if (meta.category === 'TEXT_TYPOGRAPHY') {
        score += 10; 
      }
      
      // Match the analyzer's exact selected intent or idea type to the widget's bestFor criteria
      const matchesIntent = (meta.bestFor ?? []).some(
        (keyword) => keyword.toLowerCase() === intent.toLowerCase() || keyword.toLowerCase() === ideaType.toLowerCase()
      );
      if (matchesIntent) {
        score += 30;
      }

      if (meta.category === 'DATA_REPORTING' && hasDataSignal) {
        score += 20;
      }

      // Explicit country/location language is a stronger visual signal than a
      // bare number. Without this branch, a sentence such as "Zimbabwe has a
      // population of 15 million" can incorrectly become a chart or TEXT.
      if (hasGeographySignal && meta.category === 'GEOGRAPHY') {
        score += 55;
        if (widgetType === 'COUNTRY_FOCUS' && /\b(country|region|africa|southern|northern|eastern|western|geograph)/i.test(text)) {
          score += 15;
        }
        if (widgetType === 'COUNTRY_DROP_PIN' && /\b(location|located|where|pin|callout)/i.test(text)) {
          score += 15;
        }
        if (widgetType === 'COUNTRY_ROUTE' && !/\b(route|travel|between|from .* to|flow)/i.test(text)) {
          score -= 30;
        }
      }

      // Dynamic position weight modifiers
      if (role === 'intro' && widgetType.includes('TITLE')) score += 10;
      if (role === 'outro' && (widgetType.includes('TYPEWRITER') || widgetType.includes('CARD'))) score += 5;

      // Global pacing de-duplication penalty
      if (usedWidgetsGlobal.has(widgetType)) {
        score -= meta.category === 'DATA_REPORTING' ? 45 : 15;
      }

      rankedCandidates.push({ widgetType, category: meta.category, score });
    }

    // Keep quantitative scenes from becoming a wall of charts.
    // Do not force a typography spacer over an explicit geography beat just
    // because the sentence also contains a number (for example population).
    const shouldInsertTextScene = hasDataSignal && lastWasDataWidget && !hasGeographySignal;
    const preferredCandidates = (shouldInsertTextScene
      ? rankedCandidates.filter((candidate) => candidate.category === 'TEXT_TYPOGRAPHY')
      : rankedCandidates
    ).sort((a, b) => b.score - a.score);

    // Assign best scoring candidate, or default to the first registry key available
    if (preferredCandidates.length > 0 && preferredCandidates[0].score > -100) {
      selectedWidgetType = preferredCandidates[0].widgetType;
    } else {
      selectedWidgetType = Object.keys(widgetRegistry)[0];
    }

    usedWidgetsGlobal.add(selectedWidgetType);
    lastWasDataWidget = widgetRegistry[selectedWidgetType as WidgetType]?.category === 'DATA_REPORTING';

    if (!batchPassTallies[selectedWidgetType]) {
      batchPassTallies[selectedWidgetType] = { count: 0 };
    }
    batchPassTallies[selectedWidgetType].count += 1;

    return {
      beatId: beat.beatId,
      widgetType: selectedWidgetType as WidgetType,
      dataHints: country ? { country } : {},
      metadata: {
        intent,
        role,
        primaryIdeaText,
        ideaType
      }
    };
  });

  // Log telemetry metrics safely using standard promise catches
  if (Object.keys(batchPassTallies).length > 0) {
    const upsertPayload = Object.entries(batchPassTallies).map(([widgetType, data]) => ({
      widget_type: widgetType,
      intent_category: 'DISK_BOUND_SELECTION',
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
