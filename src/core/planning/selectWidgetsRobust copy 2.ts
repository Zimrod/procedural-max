// src/core/planning/selectWidgetsRobust.ts

import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { widgetRegistry } from '../widgetRegistry';
import { WidgetType } from '../taxonomy/widgetTaxonomy';
import { deduceNarrativeIntentAI } from './intentParser';
import { supabase } from '../../lib/supabaseClient';

export type SelectedWidget = {
  beatId: string;
  widgetType: WidgetType;
  dataHints: Record<string, any>;
};

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function scoreWidget(text: string, dataHints: Record<string, any>, widgetType: WidgetType): number {
  const cleanText = text.toLowerCase();
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const hasNumber = /\d/.test(cleanText) || (dataHints.metrics?.length ?? 0) > 0 || Boolean(dataHints.currency);
  const hasComparisonLanguage = containsAny(cleanText, ['compare', 'versus', 'vs', 'against', 'between', 'split', 'breakdown', 'allocation']);
  const hasTrendLanguage = containsAny(cleanText, ['trend', 'growth', 'decline', 'over time', 'trajectory', 'forecast', 'projection']);
  const hasCompositionLanguage = containsAny(cleanText, ['share', 'mix', 'composition', 'portion', 'segment', 'allocation']);
  const hasBridgeLanguage = containsAny(cleanText, ['bridge', 'reconciliation', 'net', 'gross', 'variance', 'waterfall']);
  const hasNarrativeLanguage = containsAny(cleanText, ['here is', 'this means', 'in short', 'the takeaway', 'the point is', 'so']);

  let score = 0;

  score += (widgetRegistry[widgetType].bestFor ?? []).reduce(
    (count, keyword) => count + (cleanText.includes(keyword.toLowerCase()) ? 5 : 0),
    0
  );

  if (widgetType === 'BAR_CHART' || widgetType === 'MULTI_BAR_CHART') {
    if (hasComparisonLanguage) score += 12;
    if (hasNumber) score += 4;
    if (containsAny(cleanText, ['by ', 'per ', 'across'])) score += 3;
  }

  if (widgetType === 'LINE_CHART' || widgetType === 'MULTI_LINE_CHART') {
    if (hasTrendLanguage) score += 12;
    if (containsAny(cleanText, ['year', 'quarter', 'month', 'monthly', 'annual'])) score += 4;
  }

  if (widgetType === 'AREA_CHART' || widgetType === 'MULTI_AREA_CHART') {
    if (hasTrendLanguage || containsAny(cleanText, ['cumulative', 'aggregate', 'total'])) score += 10;
  }

  if (widgetType === 'DONUT_CHART' || widgetType === 'PIE_CHART' || widgetType === 'DONUT_STEP_CHART') {
    if (hasCompositionLanguage) score += 12;
    if (containsAny(cleanText, ['percent', '%', 'share', 'split'])) score += 4;
  }

  if (widgetType === 'DONUT_COMPARISON') {
    if (hasComparisonLanguage) score += 12;
    if (hasCompositionLanguage) score += 5;
  }

  if (widgetType === 'WATERFALL_CHART') {
    if (hasBridgeLanguage) score += 14;
    if (containsAny(cleanText, ['gross to net', 'cash flow', 'adjustment', 'reconciliation'])) score += 6;
  }

  if (widgetType === 'STAT_REVEAL') {
    if (hasNumber) score += 12;
    if (wordCount < 14) score += 4;
  }

  if (widgetType === 'TITLE_CARD' || widgetType === 'TEXT' || widgetType === 'TYPEWRITER') {
    if (hasNarrativeLanguage) score += 8;
    if (!hasNumber) score += 4;
    if (wordCount <= 16) score += 4;
  }

  if (!hasNumber && widgetType !== 'TITLE_CARD' && widgetType !== 'TEXT' && widgetType !== 'TYPEWRITER') {
    score -= 6;
  }

  return score;
}

export async function selectWidgetsRobust(beats: NarrativeBeat[]): Promise<SelectedWidget[]> {
  const usedWidgetsGlobal = new Set<string>();
  const batchPassTallies: Record<string, { count: number }> = {};

  console.log(`\n==== STARTING WIDGET SELECTION ORCHESTRATION (Total Beats: ${beats.length}) ====`);

  const analysisPromises = beats.map((beat) => deduceNarrativeIntentAI(beat.sentenceText));
  const analyzedBeats = await Promise.all(analysisPromises);

  const selectedWidgets = beats.map((beat, index) => {
    const text = beat.sentenceText;
    const { dataHints } = analyzedBeats[index];

    let selectedWidgetType: string | null = null;
    let highestScore = -Infinity;
    let validCandidates: string[] = [];

    const diagnosticLogDump: Array<{ widget: string; total: number; avoided: boolean }> = [];

    for (const [widgetType, meta] of Object.entries(widgetRegistry)) {
      const shouldAvoid = (meta.avoidFor ?? []).some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));

      if (shouldAvoid) {
        diagnosticLogDump.push({ widget: widgetType, total: -999, avoided: true });
        continue;
      }

      let score = scoreWidget(text, dataHints, widgetType as WidgetType);
      score += (meta.bestFor ?? []).reduce(
        (count, keyword) => count + (text.toLowerCase().includes(keyword.toLowerCase()) ? 2 : 0),
        0
      );

      if (usedWidgetsGlobal.has(widgetType)) {
        score -= 2;
      }

      diagnosticLogDump.push({ widget: widgetType, total: score, avoided: false });

      if (score > highestScore) {
        highestScore = score;
        validCandidates = [widgetType];
      } else if (score === highestScore) {
        validCandidates.push(widgetType);
      }
    }

    diagnosticLogDump.sort((a, b) => b.total - a.total);
    console.log('   Top Selection Candidates Evaluated:');
    diagnosticLogDump.slice(0, 4).forEach((candidate) => {
      console.log(`     - ${candidate.widget.padEnd(24)} | Total Score: ${String(candidate.total).padEnd(4)} (Avoided: ${candidate.avoided})`);
    });

    if (validCandidates.length > 0 && highestScore > -50) {
      selectedWidgetType = validCandidates[Math.floor(Math.random() * validCandidates.length)];
    } else {
      const completelyUnused = Object.keys(widgetRegistry).find((key) => !usedWidgetsGlobal.has(key));
      selectedWidgetType = completelyUnused || Object.keys(widgetRegistry)[0];
      console.log(`   Fallback selection engaged: "${selectedWidgetType}"`);
    }

    usedWidgetsGlobal.add(selectedWidgetType);

    if (!batchPassTallies[selectedWidgetType]) {
      batchPassTallies[selectedWidgetType] = { count: 0 };
    }
    batchPassTallies[selectedWidgetType].count += 1;

    return {
      beatId: beat.beatId,
      widgetType: selectedWidgetType as WidgetType,
      dataHints,
    };
  });

  console.log(`\n==== SELECTION MATRIX COMPLETE. PROCESSING TELEMETRY LOGS TO SUPABASE ====`);

  if (Object.keys(batchPassTallies).length > 0) {
    const upsertPayload = Object.entries(batchPassTallies).map(([widgetType, data]) => ({
      widget_type: widgetType,
      intent_category: 'UNSPECIFIED',
      global_render_count: data.count,
      updated_at: new Date().toISOString(),
    }));

    Promise.resolve(supabase.rpc('increment_widget_tallies', { payload: upsertPayload }))
      .then(({ error }) => {
        if (error) console.error('Supabase RPC Increment Warning:', error.message);
      })
      .catch((err) => {
        console.error('Network failure trying to log widget metadata tallies:', err);
      });
  }

  return selectedWidgets;
}
