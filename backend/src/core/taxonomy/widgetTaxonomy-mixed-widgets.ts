export const WIDGET_TAXONOMY = {
  DATA_REPORTING: {
    label: 'Data & Charts',
    types: {
      BAR_CHART: 'bar_chart',
      LINE_CHART: 'line_chart',
      AREA_CHART: 'area_chart',
      DONUT_CHART: 'donut_chart',
      DONUT_STEP_CHART: 'donut_step_chart',
      DONUT_COMPARISON: 'donut_comparison',
      PIE_CHART: 'pie_chart',
      WATERFALL_CHART: 'waterfall_chart',
      MULTI_AREA_CHART: 'multi_area_chart',
      MULTI_BAR_CHART: 'multi_bar_chart',
      MULTI_LINE_CHART: 'multi_line_chart',
      STAT_REVEAL: 'stat_reveal',
    },
  },
  TEXT_TYPOGRAPHY: {
    label: 'Text & Typography',
    types: {
      TITLE_CARD: 'title_card',
      TYPEWRITER: 'typewriter',
      TEXT: 'text',
    },
  },
} as const;

export type WidgetCategory = keyof typeof WIDGET_TAXONOMY;
export type WidgetType = {
  [K in WidgetCategory]: keyof typeof WIDGET_TAXONOMY[K]['types']
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
