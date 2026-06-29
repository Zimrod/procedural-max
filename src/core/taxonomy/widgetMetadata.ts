// src/core/taxonomy/widgetMetadata.ts
import { widgetRegistry, WidgetType } from '../widgetRegistry';

export type WidgetMetadata = {
  type: WidgetType;
  category: string;
  description: string;
  bestForKeywords: string[];
  visualStyle: string;
};

const manualDescriptions: Record<WidgetType, { description: string; visualStyle: string; bestForKeywords: string[] }> = {
  TITLE_CARD: {
    description: 'Introduces a major section, timeline milestone, or concept shift with bold typography.',
    visualStyle: 'Large centralized block text lands on screen with a clean editorial presentation.',
    bestForKeywords: ['intro', 'opening', 'chapter header', 'section title', 'milestone'],
  },
  TYPEWRITER: {
    description: 'Reveals script sentences or long-form paragraphs character by character simulating real-time typing.',
    visualStyle: 'Text symbols paint sequentially with an active terminal or writing rhythm.',
    bestForKeywords: ['typing reveal', 'script narration', 'live transcription', 'storytelling copy'],
  },
  TEXT: {
    description: 'Renders straightforward explanatory paragraphs or detailed context summaries.',
    visualStyle: 'Clean typographic layout with generous block line-height and high readability.',
    bestForKeywords: ['summary details', 'context paragraph', 'explanatory note', 'caption body'],
  },
  TERMINAL_TYPING_TEXT: {
    description: 'Simulates a code console or hacker environment with monospaced character stamping.',
    visualStyle: 'Monospaced font typing with solid cursor blinks and technical line execution breaks.',
    bestForKeywords: ['code block', 'developer theme', 'terminal logging', 'tech specification'],
  },
  TEXT_ANIMATIONS_WORD_HIGHLIGHT: {
    description: 'Highlights text blocks incrementally word-by-word synchronizing to audio speech tracks.',
    visualStyle: 'Dynamic color transitions cross over single words or phrases as focus moves forward.',
    bestForKeywords: ['audio transcription', 'karaoke captions', 'lyric emphasize', 'word tracking'],
  },
  SVG_DRAW_IN_TEXT: {
    description: 'Draws the vector paths or outlines of typography strokes before filling them solid.',
    visualStyle: 'Sleek geometric line strokes trace outward before solid color weights ease in.',
    bestForKeywords: ['logo typography', 'outline trace', 'creative branding', 'artistic header'],
  },
  SLIDING_WORD_MASK: {
    description: 'Reveals full phrase blocks sliding horizontally or vertically from behind solid bounding layout borders.',
    visualStyle: 'Sleek layout bounds mask clipping where sentences rise smoothly from empty space.',
    bestForKeywords: ['editorial masking', 'cinematic title', 'sleek entrance', 'magazine layout'],
  },
  SEQUENTIAL_ELASTIC_TEXT: {
    description: 'Staggers isolated word or letter containers using an elastic spring overshoot behavior.',
    visualStyle: 'Bouncy spring-loaded transformations where tokens overshoot layout boundaries and settle down cleanly.',
    bestForKeywords: ['high energy pop', 'kinetic display', 'playful bounce', 'impact tracking'],
  },
  BULLET_POINTS: {
    description: 'Renders structured vertically stacked informational summaries or core lists.',
    visualStyle: 'List parameters stagger sequentially with staggered layout index tracking adjustments.',
    bestForKeywords: ['ordered steps', 'feature summary', 'core key list', 'bullet take-aways'],
  },
  GEOMETRIC_QUOTE: {
    description: 'Frames important thesis viewpoints or impactful user quotes using structural block accents.',
    visualStyle: 'Large graphic callout quote-marks frame centered italicized focal points.',
    bestForKeywords: ['testimonial copy', 'profound statement', 'thesis highlight', 'founder voice'],
  },
  GRID_PRINCIPLES: {
    description: 'Arranges multi-column grids or product matrix cards to illustrate layout constraints or values.',
    visualStyle: 'Structured card layout boundaries span column spaces with consistent internal padding rules.',
    bestForKeywords: ['company values', 'framework matrices', '3-column overview', 'modular descriptions'],
  },
};

export const widgetMetadata: Record<WidgetType, WidgetMetadata> = Object.keys(widgetRegistry).reduce((acc, key) => {
  const type = key as WidgetType;
  const manual = manualDescriptions[type];

  acc[type] = {
    type,
    category: widgetRegistry[type]?.category ?? 'TEXT_TYPOGRAPHY',
    description: manual?.description ?? 'Typography-led composition element.',
    visualStyle: manual?.visualStyle ?? 'Restrained motion layout utilizing strict type tracking parameters.',
    bestForKeywords: manual?.bestForKeywords ?? [],
  };
  return acc;
}, {} as Record<WidgetType, WidgetMetadata>);