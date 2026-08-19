// src/core/widgetRegistry.ts
import type {
  WidgetCategory as TaxonomyWidgetCategory,
  WidgetIntent,
  WidgetType as TaxonomyWidgetType,
} from './taxonomy/widgetTaxonomy.js';

const SUMMARY_STOP_WORDS = new Set([
  'a', 'an', 'and', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'he', 'her', 'his', 'i', 'in', 'is', 'it', 'its', 'of', 'on', 'or', 'our',
  'she', 'that', 'the', 'their', 'them', 'they', 'this', 'to', 'we', 'were',
  'with', 'you', 'your', 'into', 'about', 'through', 'using', 'while', 'which',
  'what', 'when', 'where', 'why', 'how', 'also', 'just', 'like', 'more', 'most',
  'over', 'under', 'after', 'before', 'because', 'around', 'across', 'again',
  'there', 'here', 'all', 'some', 'any', 'each', 'every', 'these', 'those',
  'company', 'people', 'story'
]);

function summarizeSentenceToHeadline(text: string): string {
  const rawText = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!rawText) return '';

  const sentence = rawText
    .replace(/[“”"'`]/g, '')
    .replace(/\s+(?:by|using|through|with|via|that|which|while|because|as)\s+/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const candidate = sentence.split(/(?<=[.!?])\s+|;\s+|\s+-\s+/).find((part) => part && part.length > 12) ?? sentence;
  const tokens = candidate
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
    .filter((token) => token.length > 1 && !SUMMARY_STOP_WORDS.has(token.toLowerCase()))
    .slice(0, 5);

  if (tokens.length === 0) {
    const fallback = sentence
      .split(/\s+/)
      .map((token) => token.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
      .filter(Boolean)
      .slice(0, 4);

    return fallback.length > 0 ? fallback.join(' ').toUpperCase() : rawText.slice(0, 32).toUpperCase();
  }

  return tokens.join(' ').toUpperCase();
}

function buildBulletItemsFromText(text: string): string[] {
  const rawText = (text ?? '').replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  if (!rawText) return [];

  const bulletCandidates = rawText
    .split(/\n|•|▪|\u2022|\s+-\s+|\s*\|\s*|;\s+/)
    .map((part) => part.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);

  const explicitBullets = bulletCandidates.length > 1
    ? bulletCandidates
    : rawText
        .split(/(?<=[.!?])\s+|\s+(?:and|but|however)\s+/i)
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => part.length > 12);

  const summarized = explicitBullets
    .map((item) => summarizeSentenceToHeadline(item))
    .filter((item) => item && item.length > 0)
    .filter((item, index, arr) => arr.indexOf(item) === index);

  if (summarized.length > 0) {
    return summarized.slice(0, 4);
  }

  return [summarizeSentenceToHeadline(rawText)].filter(Boolean);
}

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

const DEFAULT_CHART_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

export const widgetRegistry: Partial<Record<WidgetType, WidgetRegistryEntry>> = {
  BAR_CHART: {
    category: 'DATA_REPORTING',
    intents: ['SINGLE_METRIC', 'COMPETITIVE_VERSUS', 'MATRIX_DISTRIBUTION'],
    purpose: 'Display comparative categorical numerical data using animated vertical bars.',
    bestFor: ['product comparison', 'monthly revenue', 'categorical benchmarks'],
    avoidFor: ['text heavy narration'],
    defaultProps: {},
    editorFields: [
      field('data', 'Chart Data', 'json'),
      field('barColors', 'Bar Colors', 'array'),
    ],
    buildFallbackProps: ({ extractedData }) => ({
      data: extractedData?.data ?? { labels: [], values: [] },
      barColors: extractedData?.barColors ?? DEFAULT_CHART_COLORS,
    }),
  },
  LINE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'ACCELERATION_VECTOR'],
    purpose: 'Display sequential metric trends over continuous ranges.',
    bestFor: ['time series', 'growth projections', 'performance history'],
    avoidFor: ['unordered static lists'],
    defaultProps: {},
    editorFields: [
      field('data', 'Chart Data', 'json'),
      field('lineColor', 'Line Color', 'color'),
      field('pointColors', 'Point Colors', 'array'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
    ],
    buildFallbackProps: ({ extractedData }) => ({
      data: extractedData?.data ?? { labels: [], values: [] },
      lineColor: extractedData?.lineColor ?? DEFAULT_CHART_COLORS[0],
      pointColors: extractedData?.pointColors ?? DEFAULT_CHART_COLORS,
      ...(extractedData?.curveType ? { curveType: extractedData.curveType } : {}),
      ...(extractedData?.maxValue ? { maxValue: extractedData.maxValue } : {}),
    }),
  },
  DONUT_CHART: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT', 'MATRIX_DISTRIBUTION'],
    purpose: 'Show proportion splits with an open hollow center ring.',
    bestFor: ['market share', 'budget allocation', 'category composition'],
    avoidFor: ['multi-series time trends'],
    defaultProps: {},
    editorFields: [
      field('data', 'Chart Data', 'json'),
      field('pieColors', 'Pie Colors', 'array'),
    ],
    buildFallbackProps: ({ extractedData }) => ({
      data: extractedData?.data ?? { labels: [], values: [] },
      pieColors: extractedData?.pieColors ?? DEFAULT_CHART_COLORS,
    }),
  },
  PIE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['PROPORTIONAL_SPLIT', 'MATRIX_DISTRIBUTION'],
    purpose: 'Show sector shares of a complete whole.',
    bestFor: ['segment share', 'demographic split', 'percentage distributions'],
    avoidFor: ['negative values'],
    defaultProps: {},
    editorFields: [
      field('data', 'Chart Data', 'json'),
      field('pieColors', 'Pie Colors', 'array'),
    ],
    buildFallbackProps: ({ extractedData }) => ({
      data: extractedData?.data ?? { labels: [], values: [] },
      pieColors: extractedData?.pieColors ?? DEFAULT_CHART_COLORS,
    }),
  },
  MULTI_LINE_CHART: {
    category: 'DATA_REPORTING',
    intents: ['HISTORICAL_TREND', 'COMPETITIVE_VERSUS'],
    purpose: 'Compare multiple trend series along a common scale.',
    bestFor: ['revenue vs costs', 'multi-product growth', 'competitor trends'],
    avoidFor: ['single value callouts'],
    defaultProps: {},
    editorFields: [
      field('data', 'Chart Data', 'json'),
      field('curveType', 'Curve Type', 'select', ['linear', 'curved']),
      field('maxValue', 'Max Value', 'number'),
      field('legendPosition', 'Legend Position', 'select', ['right', 'bottom']),
      field('lineWidth', 'Line Width', 'number'),
      field('pointRadius', 'Point Radius', 'number'),
    ],
    buildFallbackProps: ({ extractedData }) => ({
      data: extractedData?.data ?? { labels: [], series: [] },
      ...(extractedData?.curveType ? { curveType: extractedData.curveType } : {}),
      ...(extractedData?.maxValue ? { maxValue: extractedData.maxValue } : {}),
      ...(extractedData?.legendPosition ? { legendPosition: extractedData.legendPosition } : {}),
      ...(extractedData?.lineWidth ? { lineWidth: extractedData.lineWidth } : {}),
      ...(extractedData?.pointRadius ? { pointRadius: extractedData.pointRadius } : {}),
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
    buildFallbackProps: ({ shortSummary }) => ({
      title: shortSummary,
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
      field('boxWidth', 'Box Width', 'number'),
      field('boxHeight', 'Box Height', 'number'),
      field('fontSize', 'Font Size', 'number'),
      field('fontFamily', 'Font Family', 'text'),
      field('textColor', 'Text Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('cursorColor', 'Cursor Color', 'color'),
    ],
    buildFallbackProps: ({ shortSummary }) => ({
      text: shortSummary,
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
      field('letterSpacing', 'Letter Spacing', 'number'),
      field('spaceWidth', 'Space Width', 'number'),
      field('startDelay', 'Start Delay', 'number'),
      field('scaleFrom', 'Scale From', 'select', ['ground', 'center']),
      field('baseY', 'Base Y', 'number'),
      field('letterHeight', 'Letter Height', 'number'),
      field('letterScale', 'Letter Scale', 'number'),
      field('color', 'Text Color', 'color'),
      field('maxLineWidthPercent', 'Max Line Width Percent', 'number'),
      field('lineHeight', 'Line Height', 'number'),
      field('textAlign', 'Text Align', 'select', ['left', 'center']),
    ],
    buildFallbackProps: ({ shortSummary }) => ({
      text: shortSummary,
    }),
  },
  TERMINAL_TYPING_TEXT: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS'],
    purpose: 'Simulate an IDE developer terminal coding script execution.',
    bestFor: ['code snippets', 'technical walkthroughs', 'developer tools', 'command-line examples'],
    avoidFor: ['creative prose', 'poetry'],
    defaultProps: {},
    editorFields: [
      field('textToAnimate', 'Text to Animate', 'text'),
      field('fontSize', 'Font Size', 'number'),
      field('startFrameOffset', 'Start Frame Offset', 'number'),
      field('durationInFrames', 'Total Duration (Frames)', 'number'),
      field('holdDurationInFrames', 'Hold Duration (Frames)', 'number'),
      field('entranceDurationInFrames', 'Entrance Duration (Frames)', 'number'),
      field('exitDurationInFrames', 'Exit Duration (Frames)', 'number'),
      field('textColor', 'Text Color', 'color'),
      field('cursorColor', 'Cursor Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('borderColor', 'Border Color', 'color'),
      field('headerBgColor', 'Header Background Color', 'color'),
      field('titleColor', 'Title Color', 'color'),
      field('terminalTitle', 'Terminal Title', 'text'),
    ],
    buildFallbackProps: ({ shortSummary }) => ({
      textToAnimate: shortSummary,
      terminalTitle: 'bash',
    }),
  },
  TEXT_ANIMATIONS_WORD_HIGHLIGHT: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS'],
    purpose: 'Highlight a specific keyword within a sentence structure for targeted readability.',
    bestFor: ['key quotes', 'hook sentences', 'marketing copy emphasis', 'social videos'],
    avoidFor: ['long paragraphs'],
    defaultProps: {},
    editorFields: [
      field('text', 'Text', 'text'),
      field('highlightWord', 'Highlight Word', 'text'),
      field('fontSize', 'Font Size', 'number'),
      field('fontWeight', 'Font Weight', 'number'),
      field('colorBg', 'Background Color', 'color'),
      field('colorText', 'Text Color', 'color'),
      field('colorHighlight', 'Highlight Color', 'color'),
    ],
    buildFallbackProps: ({ shortSummary }) => {
      const words = shortSummary.split(' ');
      return {
        text: shortSummary,
        highlightWord: words[0] || '',
      };
    },
  },
  SVG_DRAW_IN_TEXT: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS', 'STATUS_BADGE'],
    purpose: 'Draw text characters out seamlessly with paths before filling them solid.',
    bestFor: ['premium intros', 'signature fonts', 'logo typography revealing', 'branding accents'],
    avoidFor: ['dense multi-line descriptions'],
    defaultProps: {},
    editorFields: [
      field('textToAnimate', 'Text to Animate', 'text'),
      field('size', 'Size', 'number'),
      field('strokeColor', 'Stroke Color', 'color'),
      field('fillColor', 'Fill Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('startFrameOffset', 'Start Frame Offset', 'number'),
    ],
    buildFallbackProps: ({ shortSummary }) => ({
      textToAnimate: shortSummary.substring(0, 15),
    }),
  },
  SEQUENTIAL_ELASTIC_TEXT: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS', 'STATUS_BADGE'],
    purpose: 'Animate individual characters sequentially using an elastic, bounce-overshoot spring scale rhythm.',
    bestFor: ['playful titles', 'impactful headers', 'attention-grabbing callouts'],
    avoidFor: ['technical documentation summaries'],
    defaultProps: {},
    editorFields: [
      field('textToAnimate', 'Text to Animate', 'text'),
      field('fontSize', 'Font Size', 'number'),
      field('fontWeight', 'Font Weight', 'text'),
      field('fontFamily', 'Font Family', 'text'),
      field('letterSpacing', 'Letter Spacing', 'text'),
      field('baseColor', 'Base Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('startFrameOffset', 'Start Frame Offset', 'number'),
    ],
    buildFallbackProps: ({ shortSummary }) => ({
      textToAnimate: shortSummary,
    }),
  },
  BULLET_POINTS: {
    category: 'TEXT_TYPOGRAPHY',
    intents: ['CORE_THESIS'],
    purpose: 'Display a clean layout array list utilizing staggered arrival vectors.',
    bestFor: ['feature lists', 'key takeaways', 'agenda items', 'presentation slides'],
    avoidFor: ['unstructured stories'],
    defaultProps: {},
    editorFields: [
      field('items', 'Items', 'array'),
      field('fontSize', 'Font Size', 'number'),
      field('fontWeight', 'Font Weight', 'text'),
      field('fontFamily', 'Font Family', 'text'),
      field('itemGap', 'Item Gap', 'number'),
      field('textColor', 'Text Color', 'color'),
      field('bulletColor', 'Bullet Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('startFrameOffset', 'Start Frame Offset', 'number'),
    ],
    buildFallbackProps: ({ shortSummary }) => {
      const content = shortSummary;
      const items = buildBulletItemsFromText(content);
      return { items: items.length > 0 ? items : [shortSummary || 'KEY TAKEAWAYS'] };
    },
  },
};

export function getWidgetDefinition(widget: string) {
  return widgetRegistry[widget as WidgetType];
}
