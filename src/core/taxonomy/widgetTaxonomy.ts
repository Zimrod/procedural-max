export const WIDGET_TAXONOMY = {
  TEXT_TYPOGRAPHY: {
    label: 'Text & Typography',
    types: {
      TITLE_CARD: 'title_card',
      TYPEWRITER: 'typewriter',
      TEXT: 'text',
      TERMINAL_TYPING_TEXT: 'terminal_typing_text',
      TEXT_ANIMATIONS_WORD_HIGHLIGHT: 'text_animations_word_highlight',
      SVG_DRAW_IN_TEXT: 'svg_draw_in_text',
      SLIDING_WORD_MASK: 'sliding_word_mask',
      SEQUENTIAL_ELASTIC_TEXT: 'sequential_elastic_text',
      BULLET_POINTS: 'bullet_points',
      GEOMETRIC_QUOTE: 'geometric_quote',
      GRID_PRINCIPLES: 'grid_principles',
    },
  },
} as const;

export type WidgetCategory = keyof typeof WIDGET_TAXONOMY;
export type WidgetType = {
  [K in WidgetCategory]: typeof WIDGET_TAXONOMY[K]['types'][keyof typeof WIDGET_TAXONOMY[K]['types']]
}[WidgetCategory];

export type WidgetIntent =
  | 'SINGLE_METRIC'
  | 'PROPORTIONAL_SPLIT'
  | 'HISTORICAL_TREND'
  | 'MATRIX_DISTRIBUTION'
  | 'COMPETITIVE_VERSUS'
  | 'VALUE_FLOW'
  | 'ACCELERATION_VECTOR'
  | 'CORE_THESIS'
  | 'STATUS_BADGE';

// A classified segment — output of classifySegments()
export type ClassifiedSegment = {
  text:           string;
  shortSummary?:  string;
  startSec:       number;
  endSec:         number;
  startFrame:     number;
  endFrame:       number;
  durationFrames: number;
  primaryCategory:   WidgetCategory;
  primaryType:       WidgetType;
  secondaryCategory?: WidgetCategory;
  secondaryType?:     WidgetType;
  confidence?:    number;
  reasoning?:     string;
  aiExtractedData?: Record<string, any>;
  widgetProps?:   Record<string, any>;
  visualIntent?:  string;
  emotionalTone?: string;
  // Populated by generateSceneConfig() after classification
  rigId?:         string;
  data?:          Record<string, any>;
};