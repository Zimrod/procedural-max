// src/core/taxonomy/widgetMetadata.ts
import { widgetRegistry, WidgetType } from '../widgetRegistry-all-widgets';

export type WidgetMetadata = {
  type: WidgetType;
  category: string;
  description: string;
  bestForKeywords: string[];
  visualStyle: string;
};

const manualDescriptions: Partial<Record<WidgetType, { description: string; visualStyle: string; bestForKeywords: string[] }>> = {
  WATERFALL_CHART: {
    description: 'Shows how a starting total is adjusted into a final outcome with intermediate additions and subtractions.',
    visualStyle: 'Bars cascade into a final total with connector lines and a clean editorial layout.',
    bestForKeywords: ['bridge chart', 'reconciliation', 'gross to net', 'cash flow', 'variance'],
  },
  BAR_CHART: {
    description: 'Compares discrete values across categories.',
    visualStyle: 'Vertical bars rise from a baseline with crisp spacing and simple labels.',
    bestForKeywords: ['compare', 'versus', 'breakdown', 'distribution', 'allocation'],
  },
  LINE_CHART: {
    description: 'Displays a single trend line over time.',
    visualStyle: 'A clean animated path draws across a grid with minimal clutter.',
    bestForKeywords: ['trend', 'growth', 'decline', 'over time', 'projection'],
  },
  AREA_CHART: {
    description: 'Highlights cumulative movement with a filled trend surface.',
    visualStyle: 'Gradient fill expands beneath a smooth path to emphasize scale.',
    bestForKeywords: ['cumulative', 'aggregate', 'build up', 'growth over time'],
  },
  DONUT_CHART: {
    description: 'Shows a simple split of a whole into segments.',
    visualStyle: 'Circular slices animate into place with labels placed around the ring.',
    bestForKeywords: ['share', 'split', 'mix', 'composition', 'allocation'],
  },
  DONUT_STEP_CHART: {
    description: 'Reveals donut segments step by step.',
    visualStyle: 'Segmented circular arcs reveal sequentially for emphasis.',
    bestForKeywords: ['tiered breakdown', 'step reveal', 'phased split'],
  },
  DONUT_COMPARISON: {
    description: 'Compares two donut distributions side by side.',
    visualStyle: 'Twin rings animate together with matching scales.',
    bestForKeywords: ['before and after', 'old vs new', 'scenario shift'],
  },
  PIE_CHART: {
    description: 'Shows categorical slices in a simple radial format.',
    visualStyle: 'Pie segments sweep in with a restrained, chart-first style.',
    bestForKeywords: ['fraction', 'slice', 'budget division', 'ownership breakdown'],
  },
  MULTI_AREA_CHART: {
    description: 'Compares overlapping trend areas across scenarios.',
    visualStyle: 'Layered translucent fills stack over a shared timeline.',
    bestForKeywords: ['scenario comparison', 'stacked totals', 'overlapping trends'],
  },
  MULTI_BAR_CHART: {
    description: 'Compares grouped values across matching categories.',
    visualStyle: 'Paired bars grow in sync with contrasting accent colors.',
    bestForKeywords: ['grouped breakdown', 'side by side comparison', 'multi-category'],
  },
  MULTI_LINE_CHART: {
    description: 'Tracks several trend lines on one grid.',
    visualStyle: 'Multiple paths draw together with a clean legend and balanced spacing.',
    bestForKeywords: ['multiple scenarios', 'forecast comparison', 'competing trends'],
  },
  STAT_REVEAL: {
    description: 'Displays one key number with a supporting label.',
    visualStyle: 'Centered numeral snaps into view with a concise subtitle.',
    bestForKeywords: ['single metric', 'one number', 'stat', 'headline value'],
  },
  TITLE_CARD: {
    description: 'Introduces a section with bold typography.',
    visualStyle: 'Large title text lands on screen with a calm editorial reveal.',
    bestForKeywords: ['intro', 'opening', 'chapter', 'section header'],
  },
  TYPEWRITER: {
    description: 'Builds text character by character.',
    visualStyle: 'Typed text reveals steadily with a subtle cursor rhythm.',
    bestForKeywords: ['typing reveal', 'script style text', 'live narration'],
  },
  TEXT: {
    description: 'Renders straightforward explanatory copy.',
    visualStyle: 'Simple text blocks with generous spacing and readable line length.',
    bestForKeywords: ['summary text', 'caption details', 'context paragraph', 'explanatory statement'],
  },
};

export const widgetMetadata: Record<WidgetType, WidgetMetadata> = Object.keys(widgetRegistry).reduce((acc, key) => {
  const type = key as WidgetType;
  const manual = manualDescriptions[type];

  acc[type] = {
    type,
    category: widgetRegistry[type].category,
    description: manual?.description ?? 'Simple finance-friendly chart or text component.',
    visualStyle: manual?.visualStyle ?? 'Clean vector layout with restrained motion.',
    bestForKeywords: manual?.bestForKeywords ?? [],
  };
  return acc;
}, {} as Record<WidgetType, WidgetMetadata>);
