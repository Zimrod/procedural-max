// src/core/widgetRegistry.ts
import type {
  WidgetCategory as TaxonomyWidgetCategory,
  WidgetIntent,
  WidgetType as TaxonomyWidgetType,
} from './taxonomy/widgetTaxonomy';

export type WidgetCategory = TaxonomyWidgetCategory;
export type WidgetType = TaxonomyWidgetType;

export type WidgetRegistryEntry = {
  category: WidgetCategory;
  intents: WidgetIntent[];
  purpose: string;
  bestFor: string[];
  avoidFor?: string[];
  defaultProps: Record<string, any>;
  editorFields: WidgetEditorField[];
  buildFallbackProps: (params: {
    shortSummary: string;
    extractedData?: Record<string, any>;
    durationFrames: number;
    text: string;
    seed?: number;
  }) => Record<string, any>;
};

export type WidgetEditorField = {
  key: string;
  label: string;
  kind: "text" | "number" | "color" | "boolean" | "json" | "array" | "select";
  options?: string[];
  defaultValue?: any;
};

const field = (
  key: string,
  label: string,
  kind: WidgetEditorField["kind"],
  options?: string[],
  defaultValue?: any
): WidgetEditorField => ({
  key,
  label,
  kind,
  options,
  defaultValue,
});

const extractFirstNumber = (text: string): number | null => {
  if (!text) return null;
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
};

const detectCurrencySymbol = (text: string): string | null => {
  if (!text) return null;
  const match = text.match(/[$\u00A3\u20AC]/);
  return match ? match[0] : null;
};

const makeSingleSeriesFallback = (text: string, labels: string[] = ['A', 'B', 'C']) => {
  const baseValue = extractFirstNumber(text) ?? 50;
  return {
    data: {
      labels,
      values: [baseValue, baseValue * 1.2, baseValue * 0.85],
    },
  };
};

const makeTextFallback = (text: string, shortSummary: string, durationFrames: number) => ({
  text: text || shortSummary,
  durationInFrames: durationFrames,
});

const makeSeriesFallback = (text: string, seriesNames: string[] = ['Scenario A', 'Scenario B']) => {
  const baseValue = extractFirstNumber(text) ?? 20;
  return {
    data: {
      labels: ['Q1', 'Q2', 'Q3'],
      series: seriesNames.map((name, index) => ({
        name,
        values: [baseValue * (1 + index * 0.1), baseValue * (1.2 + index * 0.1), baseValue * (1.45 + index * 0.1)],
      })),
    },
  };
};

export const widgetRegistry: Record<WidgetType, WidgetRegistryEntry> = {
  WATERFALL_CHART: {
    category: 'DATA_REPORTING',
    intents: ['VALUE_FLOW'],
    purpose: 'Show how a starting total moves through adjustments before resolving into a final figure.',
    bestFor: ['gross to net', 'bridge chart', 'reconciliation', 'cash flow bridge', 'value waterfall'],
    avoidFor: ['single value callouts', 'pure narration blocks'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('increaseColor', 'Increase Color', 'color'),
      field('decreaseColor', 'Decrease Color', 'color'),
      field('startEndColor', 'Start / End Color', 'color'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('borderRadius', 'Border Radius', 'number'),
      field('maxValue', 'Max Value', 'number'),
      field('showConnectors', 'Show Connectors', 'boolean'),
      field('axisColor', 'Axis Color', 'color'),
      field('gridColor', 'Grid Color', 'color'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => {
      const baseValue = extractFirstNumber(text) ?? 100;
      return {
        data: {
          labels: ['Start', 'Adjust 1', 'Adjust 2', 'Final'],
          values: [baseValue, -baseValue * 0.2, baseValue * 0.1, baseValue * 0.9],
          startValue: 0,
          finalLabel: shortSummary || 'Total',
        },
        showConnectors: true,
      };
    },
  },
  BAR_CHART: {
    category: 'DATA_REPORTING',
    intents: ['MATRIX_DISTRIBUTION', 'COMPETITIVE_VERSUS'],
    purpose: 'Compare discrete values across categories or alternatives.',
    bestFor: ['compare', 'versus', 'breakdown', 'allocation', 'distribution', 'by segment', 'by category'],
    avoidFor: ['pure timeline narration'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('barColors', 'Bar Colors', 'array'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('borderRadius', 'Border Radius', 'number'),
      field('axisColor', 'Axis Color', 'color'),
      field('gridColor', 'Grid Color', 'color'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
    ],
    buildFallbackProps: ({ text }) => makeSingleSeriesFallback(text, ['A', 'B', 'C']),
  },
  LINE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'ACCELERATION_VECTOR'],
    purpose: 'Track a trend across time or across sequential steps.',
    bestFor: ['trend', 'growth', 'decline', 'over time', 'projection', 'trajectory', 'forecast'],
    avoidFor: ['one-off static totals'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('lineColor', 'Line Color', 'color'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('pointColors', 'Point Colors', 'array'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
      field('axisColor', 'Axis Color', 'color'),
      field('gridColor', 'Grid Color', 'color'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 10;
      return {
        data: {
          labels: ['W1', 'W2', 'W3', 'W4'],
          values: [baseValue, baseValue * 1.1, baseValue * 1.35, baseValue * 1.6],
        },
        curveType: 'curved',
      };
    },
  },
  AREA_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'ACCELERATION_VECTOR'],
    purpose: 'Emphasize cumulative growth or volume with a filled trend surface.',
    bestFor: ['cumulative', 'aggregate', 'total volume', 'build up', 'growth over time'],
    avoidFor: ['single metric labels'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('areaColor', 'Area Color', 'color'),
      field('lineColor', 'Line Color', 'color'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
      field('opacity', 'Opacity', 'number'),
      field('axisColor', 'Axis Color', 'color'),
      field('gridColor', 'Grid Color', 'color'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 100;
      return {
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          values: [baseValue, baseValue * 1.15, baseValue * 1.45, baseValue * 1.9],
        },
        curveType: 'curved',
        opacity: 0.3,
      };
    },
  },
  DONUT_CHART: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT'],
    purpose: 'Show a whole broken into shares.',
    bestFor: ['share', 'split', 'mix', 'composition', 'allocation', 'percentage breakdown'],
    avoidFor: ['chronological trend lines'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('pieColors', 'Pie Colors', 'array'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('fontFamily', 'Font Family', 'text'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 30;
      return {
        data: {
          labels: ['Segment A', 'Segment B', 'Others'],
          values: [baseValue, baseValue * 0.8, Math.max(10, 100 - (baseValue * 1.8))],
        },
      };
    },
  },
  DONUT_STEP_CHART: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT'],
    purpose: 'Reveal donut slices step by step to emphasize composition changes.',
    bestFor: ['tiered breakdown', 'step reveal', 'phased split'],
    avoidFor: ['single line narration'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('pieColors', 'Pie Colors', 'array'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('fontFamily', 'Font Family', 'text'),
    ],
    buildFallbackProps: ({ text }) => makeSingleSeriesFallback(text, ['Phase 1', 'Phase 2', 'Phase 3']),
  },
  DONUT_COMPARISON: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT', 'COMPETITIVE_VERSUS'],
    purpose: 'Compare two proportional distributions side by side.',
    bestFor: ['before and after', 'old vs new', 'scenario shift', 'composition comparison'],
    avoidFor: ['single standalone metrics'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('donutColors', 'Donut Colors', 'array'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('maxValue', 'Max Value', 'number'),
      field('columns', 'Columns', 'number'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 75;
      return {
        data: {
          labels: ['Metric A', 'Metric B'],
          values: [Math.min(100, baseValue), Math.min(100, baseValue * 0.85)],
        },
        maxValue: 100,
        columns: 2,
      };
    },
  },
  PIE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT'],
    purpose: 'Show a simple categorical slice breakdown.',
    bestFor: ['fraction', 'slice', 'budget division', 'ownership breakdown', 'allocation percent'],
    avoidFor: ['time series'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('pieColors', 'Pie Colors', 'array'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('strokeWidth', 'Stroke Width', 'number'),
      field('labelColor', 'Label Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('fontFamily', 'Font Family', 'text'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 30;
      return {
        data: {
          labels: ['A', 'B', 'C'],
          values: [baseValue, baseValue * 0.8, Math.max(10, 100 - (baseValue * 1.8))],
        },
      };
    },
  },
  MULTI_AREA_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'COMPETITIVE_VERSUS'],
    purpose: 'Compare overlapping volume trends.',
    bestFor: ['scenario comparison', 'stacked totals', 'overlapping trends'],
    avoidFor: ['single quote cards'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
      field('legendPosition', 'Legend Position', 'select', ['right', 'bottom']),
      field('areaOpacity', 'Area Opacity', 'number'),
      field('lineWidth', 'Line Width', 'number'),
    ],
    buildFallbackProps: ({ text }) => makeSeriesFallback(text, ['Target', 'Actual']),
  },
  MULTI_BAR_CHART: {
    category: 'DATA_REPORTING',
    intents: ['MATRIX_DISTRIBUTION', 'COMPETITIVE_VERSUS'],
    purpose: 'Compare grouped bars across matching categories.',
    bestFor: ['grouped breakdown', 'side by side comparison', 'multi-category'],
    avoidFor: ['single total statements'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('maxValue', 'Max Value', 'number'),
      field('legendPosition', 'Legend Position', 'select', ['right', 'bottom']),
      field('groupPadding', 'Group Padding', 'number'),
      field('barColors', 'Bar Colors', 'array'),
    ],
    buildFallbackProps: ({ text }) => {
      const baseValue = extractFirstNumber(text) ?? 40;
      return {
        data: {
          labels: ['Region A', 'Region B'],
          series: [
            { name: 'Baseline', values: [baseValue, baseValue * 1.25] },
            { name: 'Current', values: [baseValue * 1.1, baseValue * 1.45] },
          ],
        },
        legendPosition: 'bottom',
        groupPadding: 0.2,
      };
    },
  },
  MULTI_LINE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'ACCELERATION_VECTOR'],
    purpose: 'Track several scenarios on the same timeline.',
    bestFor: ['multiple scenarios', 'forecast comparison', 'competing trends'],
    avoidFor: ['single value callouts'],
    defaultProps: {},
    editorFields: [
      field('data', 'Data', 'json'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
      field('legendPosition', 'Legend Position', 'select', ['right', 'bottom']),
      field('lineWidth', 'Line Width', 'number'),
      field('pointRadius', 'Point Radius', 'number'),
    ],
    buildFallbackProps: ({ text }) => makeSeriesFallback(text, ['Optimistic', 'Conservative']),
  },
  STAT_REVEAL: {
    category: 'DATA_REPORTING',
    intents: ['SINGLE_METRIC'],
    purpose: 'Reveal one key number with a label.',
    bestFor: ['single metric', 'one number', 'stat', 'headline value', 'key figure'],
    avoidFor: ['multi-step process'],
    defaultProps: {},
    editorFields: [
      field('text', 'Text', 'text'),
      field('durationInFrames', 'Duration In Frames', 'number'),
      field('fontSize', 'Font Size', 'number'),
      field('color', 'Text Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('fontFamily', 'Font Family', 'text'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => ({
      value: extractFirstNumber(text) ?? 0,
      prefix: detectCurrencySymbol(text) ?? '',
      text: shortSummary || text,
    }),
  },
  TITLE_CARD: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS', 'STATUS_BADGE'],
    purpose: 'Introduce a section or frame with bold typographic emphasis.',
    bestFor: ['intro', 'opening', 'chapter', 'section header', 'topic shift'],
    avoidFor: ['dense charts'],
    defaultProps: {},
    editorFields: [
      field('title', 'Title', 'text'),
      field('subtitle', 'Subtitle', 'text'),
      field('align', 'Align', 'select', ['left', 'center']),
      field('maxWidth', 'Max Width', 'number'),
      field('titleFontSize', 'Title Font Size', 'number'),
      field('subtitleFontSize', 'Subtitle Font Size', 'number'),
      field('fontFamily', 'Font Family', 'text'),
      field('titleColor', 'Title Color', 'color'),
      field('subtitleColor', 'Subtitle Color', 'color'),
      field('accentColor', 'Accent Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('revealDirection', 'Reveal Direction', 'select', ['up', 'down', 'left', 'right']),
      field('cinematic', 'Cinematic', 'boolean'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => ({
      title: text || shortSummary,
      subtitle: shortSummary || '',
    }),
  },
  TYPEWRITER: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS'],
    purpose: 'Reveal text character by character.',
    bestFor: ['typing reveal', 'script style text', 'live narration'],
    avoidFor: ['dense quantitative charts'],
    defaultProps: {},
    editorFields: [
      field('text', 'Text', 'text'),
      field('typingSpeed', 'Typing Speed', 'number'),
      field('boxWidth', 'Box Width', 'number'),
      field('boxHeight', 'Box Height', 'number'),
      field('fontSize', 'Font Size', 'number'),
      field('fontFamily', 'Font Family', 'text'),
      field('textColor', 'Text Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('cursorColor', 'Cursor Color', 'color'),
      field('startDelay', 'Start Delay', 'number'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => ({
      text: text || shortSummary,
      typingSpeed: 2,
      startDelay: 0,
    }),
  },
  TEXT: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS', 'STATUS_BADGE'],
    purpose: 'Render simple explanatory copy blocks.',
    bestFor: ['summary text', 'caption details', 'context paragraph', 'explanatory statement'],
    avoidFor: ['complex numeric charting'],
    defaultProps: {},
    editorFields: [
      field('text', 'Text', 'text'),
      field('fontSize', 'Font Size', 'number'),
      field('color', 'Text Color', 'color'),
      field('fontFamily', 'Font Family', 'text'),
      field('fontWeight', 'Font Weight', 'text'),
      field('background', 'Background', 'color'),
      field('durationInFrames', 'Duration In Frames', 'number'),
      field('fadeInFrames', 'Fade In Frames', 'number'),
      field('fadeOutFrames', 'Fade Out Frames', 'number'),
    ],
    buildFallbackProps: ({ text, shortSummary, durationFrames }) => {
      const baseFallback = makeTextFallback(text, shortSummary, durationFrames);
      return {
        ...baseFallback,
        durationInFrames: durationFrames, // Ensures the lesser calculated frame value is baked in
      };
    },
  },
};

export function getWidgetDefinition(widget: string) {
  return widgetRegistry[widget as WidgetType];
}
