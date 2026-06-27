// src/core/planning/selectWidgets.ts
import OpenAI from 'openai';
import { NarrativeBeat } from '../narrative/narrativeAnalyzer';
import { widgetRegistry } from '../widgetRegistry';
import { WidgetType } from '../taxonomy/widgetTaxonomy';

const apiKey = process.env.OPENAI_API_KEY;

export type SelectedWidget = {
  beatId: string;
  widgetType: WidgetType;
  dataHints: Record<string, any>;
  reasoning: string;
};

export async function selectWidgets(beats: NarrativeBeat[]): Promise<SelectedWidget[]> {
  // 1. Build a dynamic registry manifest directly from the code definitions
  const runtimeRegistryPayload = Object.entries(widgetRegistry).map(([type, meta]) => ({
    widgetType: type,
    purpose: meta.purpose,
    bestFor: meta.bestFor,
    avoidFor: meta.avoidFor || [],
  }));

  const beatsForPrompt = beats.map(b => ({
    beatId: b.beatId,
    text: b.sentenceText,
    ideas: b.selectedIdeas?.map(i => i.phrase) || [],
  }));

  const systemPrompt = `
    You are an expert financial and structural layout architect specializing in general finance explainer presentations.
    Your task is to review an array of narrative beats and map exactly ONE structural component widget to each beat.

    You must read the metadata of the available widget types dynamically to discover the absolute best contextual match. 
    Match the financial or narrative intent of the sentence text with the component's 'purpose' and 'bestFor' keywords. 
    Never select a widget type if the sentence text contains elements explicitly flagged in its 'avoidFor' criteria.

    CRITICAL RULES FOR SEQUENCE SELECTION:
    1. GLOBAL UNIQUENESS CONSTRAINT: Every widgetType chosen in your final array should ideally be unique across the timeline to maximize layout engagement. If you choose an option for one beat, avoid recycling it elsewhere in this specific video sequence.
    2. DATA HINTS PARSING: Extract specific numbers, percentages, financial labels, names of regions, or specific milestones from the beat text and structure them inside the 'dataHints' object. Do not copy the entire raw paragraph into single properties like labels or text.
    3. TEXT COHESION: If sequential narrative beats have heavily overlapping texts or ideas, focus on extracting distinct variables into 'dataHints' or fallback gracefully to standard typographic components.
  `;

  const userPrompt = `
    Available Registry Assets:
    ${JSON.stringify(runtimeRegistryPayload, null, 2)}

    Beats to Process:
    ${JSON.stringify(beatsForPrompt, null, 2)}
  `;

  // 2. Query the LLM using strict JSON Schema formatting constraints
  const response = await apiKey.chat.completions.create({
    model: 'gpt-4.1',
    temperature: 0.1, 
    response_format: { 
      type: 'json_schema',
      json_schema: {
        name: 'widget_selections_profile',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            selections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  beatId: { type: 'string' },
                  widgetType: { type: 'string' },
                  reasoning: { type: 'string' },
                  shadowDesire: { 
                    type: 'string',
                    description: 'If our current registry was too basic or general for this specific finance context, write out exactly what more specialized widget you would have preferred to use here instead.'
                  },
                  dataHints: { 
                    type: 'object',
                    description: 'Extracted key data attributes native to the specific selected widget needs.',
                    properties: {
                      value: { type: 'number', description: 'Numeric metrics like valuations, rates, or counts.' },
                      prefix: { type: 'string', description: 'Currency or unit prefixes like $, £, €.' },
                      suffix: { type: 'string', description: 'Unit suffixes like %, M, B, MW, MWh.' },
                      label: { type: 'string', description: 'Contextual fallback labels or metric tags.' },
                      labels: { 
                        type: 'array', 
                        items: { type: 'string' }, 
                        description: 'Array of categories or timeline markers for chart engines.' 
                      },
                      values: { 
                        type: 'array', 
                        items: { type: 'number' }, 
                        description: 'Array of continuous metric numbers corresponding to labels.' 
                      }
                    },
                    required: ['value', 'prefix', 'suffix', 'label', 'labels', 'values'],
                    additionalProperties: false
                  }
                },
                required: ['beatId', 'widgetType', 'dataHints', 'reasoning', 'shadowDesire'],
                additionalProperties: false
              }
            }
          },
          required: ['selections'],
          additionalProperties: false
        }
      }
    },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
  });

  const rawText = response.choices[0].message.content ?? '{"selections":[]}';
  const parsedJson = JSON.parse(rawText);
  const selectedArray = parsedJson.selections || [];

  // 3. Telemetry Console Logger Loop for your Shadow Desires
  console.log(`\n============== WIDGET ENGINE ROUTER DIAGNOSTICS ==============`);
  selectedArray.forEach((item: any) => {
    const matchingBeat = beats.find(b => b.beatId === item.beatId);
    const textSnippet = matchingBeat ? `"${matchingBeat.sentenceText.slice(0, 40)}..."` : `Beat ${item.beatId}`;
    
    console.log(`[Track Router] assigned: ${item.widgetType} -> to context: ${textSnippet}`);
    
    if (item.shadowDesire && item.shadowDesire.toLowerCase() !== 'none' && item.shadowDesire.trim() !== '') {
      console.log(`💡 [LLM Product Wishlist]: For context ${textSnippet}, I wanted a custom rig for: ${item.shadowDesire}`);
    }
  });
  console.log(`==============================================================\n`);

  // 4. Runtime Code-Level Backup Stability Guard
  const seenWidgets = new Set<string>();

  return selectedArray.map((item: any) => {
    let type = String(item.widgetType ?? 'TEXT').toUpperCase();

    // Enforce uniqueness constraint: fallback to standard TEXT if a layout component attempts to repeat
    if (type !== 'TEXT' && seenWidgets.has(type)) {
      type = 'TEXT';
    }
    
    // Only verify against active registry keys to protect against stray string generation
    if (!Object.prototype.hasOwnProperty.call(widgetRegistry, type)) {
      type = 'TEXT';
    }

    seenWidgets.add(type);

    return {
      beatId: String(item.beatId ?? ''),
      widgetType: type as WidgetType,
      dataHints: item.dataHints ?? {},
      reasoning: item.reasoning ?? '',
    };
  });
}
