// src/core/planning/selectWidgetsRobust.ts

import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { widgetRegistry } from '../widgetRegistry';
import { WidgetType, WidgetIntent } from '../taxonomy/widgetTaxonomy';
import { deduceNarrativeIntent } from './intentParser';
import { createClient } from '@supabase/supabase-js'; // Adjust source path accordingly

const SUPABASE_URL = 'https://svmgfmftwiblwfztnqws.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p07E0yfzmkf1Y0yoce15qA_mek34vUe';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type SelectedWidget = {
  beatId: string;
  widgetType: WidgetType;
  dataHints: Record<string, any>;
};

export async function selectWidgetsRobust(beats: NarrativeBeat[]): Promise<SelectedWidget[]> {
  const localUsedWidgetsThisComposition = new Set<string>();

  // 1. Fetch live global usage metric histories across all community projects
  const { data: databaseTallies } = await supabase
    .from('widget_usage_tallies')
    .select('widget_type, global_render_count');

  const globalTallyMap = new Map<string, number>(
    databaseTallies?.map(row => [row.widget_type, row.global_render_count]) || []
  );

  const selectedResults: SelectedWidget[] = [];
  const widgetsToIncrement: string[] = [];

  for (const beat of beats) {
    const text = beat.sentenceText;
    
    // Tier 1: Extract intent room
    const targetIntent: WidgetIntent = deduceNarrativeIntent(text);
    
    // Tier 2: Isolate pool belonging to intent
    const filteredPool = Object.entries(widgetRegistry).filter(([_, meta]) => 
      meta.intents.includes(targetIntent)
    );

    let highestScore = -100000; // Allow negative starting limits because of tally penalties
    let validCandidates: string[] = [];

    for (const [widgetType, meta] of filteredPool) {
      // Avoidance rules
      const shouldAvoid = meta.avoidFor.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()));
      if (shouldAvoid) continue;

      // Base context score from keywords
      let score = 0;
      meta.bestFor.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10; 
        }
      });

      // Constraint A: Heavily penalize duplication within the EXACT SAME video project
      if (localUsedWidgetsThisComposition.has(widgetType)) {
        score -= 50; 
      }

      // Constraint B: Dynamic Tally Penalty based on historic global usage
      const globalUsageCount = globalTallyMap.get(widgetType) || 0;
      const tallyPenalty = globalUsageCount * 0.5; // Every 2 prints across the ecosystem reduces selection favor by 1 point
      score -= tallyPenalty;

      // Track the best candidate
      if (score > highestScore) {
        highestScore = score;
        validCandidates = [widgetType];
      } else if (score === highestScore) {
        validCandidates.push(widgetType);
      }
    }

    // Resolve selection
    let pickedWidgetType: string;
    if (validCandidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * validCandidates.length);
      pickedWidgetType = validCandidates[randomIndex];
    } else {
      // Emergency default
      pickedWidgetType = Object.keys(widgetRegistry)[0];
    }

    // Log tracking status values
    localUsedWidgetsThisComposition.add(pickedWidgetType);
    widgetsToIncrement.push(pickedWidgetType);

    // Increment local tally balance so back-to-back checks step down smoothly
    const currentLocalTally = globalTallyMap.get(pickedWidgetType) || 0;
    globalTallyMap.set(pickedWidgetType, currentLocalTally + 1);

    selectedResults.push({
      beatId: beat.beatId,
      widgetType: pickedWidgetType as WidgetType,
      dataHints: {},
    });
  }

  // 4. Batch update transaction back into Supabase asynchronously to log utilization increments
  Promise.all(
    widgetsToIncrement.map(type =>
      supabase.rpc('increment_widget_tally', { target_widget: type })
    )
  ).catch(err => console.error('[Supabase Tracking Error] Failed updating database counters:', err));

  return selectedResults;
}