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
  'company', 'business', 'team', 'people', 'story'
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

export const widgetRegistry: Partial<Record<WidgetType, WidgetRegistryEntry>> = {
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
      field('boxWidth', 'Box Width', 'number'),
      field('boxHeight', 'Box Height', 'number'),
      field('fontSize', 'Font Size', 'number'),
      field('fontFamily', 'Font Family', 'text'),
      field('textColor', 'Text Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('cursorColor', 'Cursor Color', 'color'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => ({
      text: text || shortSummary,
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
    buildFallbackProps: ({ text, shortSummary }) => ({
      text: text || shortSummary,
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
      field('textColor', 'Text Color', 'color'),
      field('cursorColor', 'Cursor Color', 'color'),
      field('backgroundColor', 'Background Color', 'color'),
      field('borderColor', 'Border Color', 'color'),
      field('headerBgColor', 'Header Background Color', 'color'),
      field('titleColor', 'Title Color', 'color'),
      field('terminalTitle', 'Terminal Title', 'text'),
    ],
    buildFallbackProps: ({ text, shortSummary }) => ({
      textToAnimate: text || shortSummary,
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
    buildFallbackProps: ({ text, shortSummary }) => {
      const words = (text || shortSummary).split(' ');
      return {
        text: text || shortSummary,
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
    buildFallbackProps: ({ text, shortSummary }) => ({
      textToAnimate: (text || shortSummary).substring(0, 15), // Kept clean for single-line path processing
    }),
  },
  // SLIDING_WORD_MASK: {
  //   category: 'TEXT_TYPOGRAPHY',
  //   intents: ['CORE_THESIS'],
  //   purpose: 'Cycle through an array of kinetic keywords behind a geometric clipping mask wrapper.',
  //   bestFor: ['value propositions', 'rotating descriptions', 'marketing hooks', 'dynamic lists'],
  //   avoidFor: ['static numbers'],
  //   defaultProps: {},
  //   editorFields: [
  //     field('prefixText', 'Prefix Text', 'text'),
  //     field('wordsToCycle', 'Words to Cycle', 'array'),
  //     field('fontSize', 'Font Size', 'number'),
  //     field('fontWeight', 'Font Weight', 'text'),
  //     field('fontFamily', 'Font Family', 'text'),
  //     field('wordColor', 'Word Color', 'color'),
  //     field('baseTextColor', 'Base Text Color', 'color'),
  //     field('backgroundColor', 'Background Color', 'color'),
  //     field('startFrameOffset', 'Start Frame Offset', 'number'),
  //   ],
  //   buildFallbackProps: ({ text, shortSummary }) => ({
  //     prefixText: 'We build',
  //     wordsToCycle: ['Software', 'Brands', 'Videos', 'Products'],
  //   }),
  // },
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
    buildFallbackProps: ({ text, shortSummary }) => ({
      textToAnimate: text || shortSummary,
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
    buildFallbackProps: ({ text, shortSummary }) => {
      const content = text || shortSummary;
      const items = buildBulletItemsFromText(content);
      return { items: items.length > 0 ? items : [shortSummary || 'KEY TAKEAWAYS'] };
    },
  },
  // GEOMETRIC_QUOTE: {
  //   category: 'TEXT_TYPOGRAPHY',
  //   intents: ['CORE_THESIS'],
  //   purpose: 'Format editorial blockquotes wrapped in modern design geometries.',
  //   bestFor: ['customer testimonials', 'expert reviews', 'famous philosophical soundbites'],
  //   avoidFor: ['source spreadsheets'],
  //   defaultProps: {},
  //   editorFields: [
  //     field('quoteText', 'Quote Text', 'text'),
  //     field('authorName', 'Author Name', 'text'),
  //     field('authorTitle', 'Author Title', 'text'),
  //     field('quoteFontSize', 'Quote Font Size', 'number'),
  //     field('authorFontSize', 'Author Font Size', 'number'),
  //     field('titleFontSize', 'Title Font Size', 'number'),
  //     field('textColor', 'Text Color', 'color'),
  //     field('accentColor', 'Accent Color', 'color'),
  //     field('backgroundColor', 'Background Color', 'color'),
  //     field('fontFamily', 'Font Family', 'text'),
  //   ],
  //   buildFallbackProps: ({ text, shortSummary }) => ({
  //     quoteText: text || shortSummary,
  //     authorName: 'Jane Doe',
  //     authorTitle: 'Consultant',
  //   }),
  // },
  // GRID_PRINCIPLES: {
  //   category: 'TEXT_TYPOGRAPHY',
  //   intents: ['CORE_THESIS'],
  //   purpose: 'Showcase structured cards layout across matrix grids to describe structural rules.',
  //   bestFor: ['company values', 'design systems', 'product framework descriptions', '3-column overviews'],
  //   avoidFor: ['single sentence headers'],
  //   defaultProps: {},
  //   editorFields: [
  //     field('sectionTitle', 'Section Title', 'text'),
  //     field('principles', 'Principles', 'json'),
  //     field('sectionFontSize', 'Section Font Size', 'number'),
  //     field('cardTitleFontSize', 'Card Title Font Size', 'number'),
  //     field('cardDescFontSize', 'Card Desc Font Size', 'number'),
  //     field('textColor', 'Text Color', 'color'),
  //     field('mutedTextColor', 'Muted Text Color', 'color'),
  //     field('accentColor', 'Accent Color', 'color'),
  //     field('surfaceColor', 'Surface Color', 'color'),
  //     field('backgroundColor', 'Background Color', 'color'),
  //     field('borderColor', 'Border Color', 'color'),
  //     field('fontFamily', 'Font Family', 'text'),
  //   ],
  //   buildFallbackProps: ({ text, shortSummary }) => ({
  //     sectionTitle: 'Core Framework Principles',
  //     principles: [
  //       { title: 'Clarity First', description: text || shortSummary },
  //       { title: 'Deterministic Build', description: 'Execution engines anchor flawlessly to video frame boundaries.' }
  //     ],
  //   }),
  // },
};

export function getWidgetDefinition(widget: string) {
  return widgetRegistry[widget as WidgetType];
}
