export type CompositionTheme = {
  mode: "dark" | "light" | "filled";
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  accentSoftColor: string;
  chartStrokeColor: string;
  chartStrokeWidth: number;
  chartBorderRadius: number;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
  captionColor: string;
  captionHighlightColor: string;
  fontFamily: string;
  chartPalette: string[];
};

export type CompositionThemeField = {
  key: keyof CompositionTheme;
  label: string;
  kind: "color" | "text" | "select" | "number";
  options?: string[];
};

export const DEFAULT_COMPOSITION_THEME: CompositionTheme = {
  mode: "light",
  backgroundColor: "#f5fff4",
  surfaceColor: "#ffffff",
  accentColor: "#2563eb",
  accentSoftColor: "#dbeafe",
  chartStrokeColor: "#2563eb",
  chartStrokeWidth: 3,
  chartBorderRadius: 8,
  textColor: "#0f172a",
  mutedTextColor: "#64748b",
  borderColor: "#e2e8f0",
  captionColor: "#0f172a",
  captionHighlightColor: "#2563eb",
  fontFamily: "Rubik",
  chartPalette: ["#2563eb", "#14b8a6", "#f97316", "#8b5cf6", "#ef4444"],
};

export const COMPOSITION_THEME_FIELDS: CompositionThemeField[] = [
  { key: "mode", label: "Mode", kind: "select", options: ["dark", "light", "filled"] },
  { key: "backgroundColor", label: "Canvas Background", kind: "color" },
  { key: "surfaceColor", label: "Surface Card", kind: "color" },
  { key: "accentColor", label: "Accent", kind: "color" },
  { key: "accentSoftColor", label: "Accent Tint", kind: "color" },
  { key: "chartStrokeColor", label: "Chart Stroke", kind: "color" },
  { key: "chartStrokeWidth", label: "Chart Stroke Width", kind: "number" },
  { key: "chartBorderRadius", label: "Chart Border Radius", kind: "number" },
  { key: "textColor", label: "Text", kind: "color" },
  { key: "mutedTextColor", label: "Muted Text", kind: "color" },
  { key: "borderColor", label: "Border", kind: "color" },
  { key: "captionColor", label: "Caption Text", kind: "color" },
  { key: "captionHighlightColor", label: "Caption Highlight", kind: "color" },
  { key: "fontFamily", label: "Font Family", kind: "text" },
];

export type CompositionThemePreset = {
  id: string;
  label: string;
  theme: CompositionTheme;
};

export const COMPOSITION_THEME_PRESETS: CompositionThemePreset[] = [
  {
    id: "dark-neon",
    label: "Dark Neon",
    theme: {
      mode: "dark",
      backgroundColor: "#060816",
      surfaceColor: "#0f172a",
      accentColor: "#22d3ee",
      accentSoftColor: "#0f766e",
      chartStrokeColor: "#22d3ee",
      chartStrokeWidth: 4,
      chartBorderRadius: 8,
      textColor: "#f8fafc",
      mutedTextColor: "#94a3b8",
      borderColor: "#334155",
      captionColor: "#f8fafc",
      captionHighlightColor: "#22d3ee",
      fontFamily: "Rubik",
      chartPalette: ["#22d3ee", "#a78bfa", "#f97316", "#facc15", "#fb7185"],
    },
  },
  {
    id: "light-stroke",
    label: "Light Stroke",
    theme: {
      mode: "light",
      backgroundColor: "#f8fafc",
      surfaceColor: "#ffffff",
      accentColor: "#1d4ed8",
      accentSoftColor: "#dbeafe",
      chartStrokeColor: "#1d4ed8",
      chartStrokeWidth: 3,
      chartBorderRadius: 8,
      textColor: "#0f172a",
      mutedTextColor: "#475569",
      borderColor: "#cbd5e1",
      captionColor: "#0f172a",
      captionHighlightColor: "#1d4ed8",
      fontFamily: "Rubik",
      chartPalette: ["#1d4ed8", "#0f766e", "#334155", "#64748b", "#94a3b8"],
    },
  },
  {
    id: "light-filled",
    label: "Light Filled",
    theme: {
      mode: "filled",
      backgroundColor: "#fffaf2",
      surfaceColor: "#ffffff",
      accentColor: "#ea580c",
      accentSoftColor: "#fed7aa",
      chartStrokeColor: "#ea580c",
      chartStrokeWidth: 3,
      chartBorderRadius: 14,
      textColor: "#111827",
      mutedTextColor: "#6b7280",
      borderColor: "#fdba74",
      captionColor: "#111827",
      captionHighlightColor: "#ea580c",
      fontFamily: "Rubik",
      chartPalette: ["#ea580c", "#f59e0b", "#f97316", "#84cc16", "#22c55e"],
    },
  },
];

export const THEME_PROP_ALIASES: Record<string, string[]> = {
  backgroundColor: ["backgroundColor", "background", "bgColor", "surfaceColor", "panelColor", "cardBackgroundColor", "nodeBgColor", "basePanelColor", "fillColor", "emptyPanelColor"],
  textColor: ["textColor", "color", "titleColor", "subtitleColor", "labelColor", "legendTextColor", "trendLabelColor", "primaryColor"],
  accentColor: ["accentColor", "lineColor", "increaseColor", "decreaseColor", "startEndColor", "cursorColor", "glowColor", "fillColor"],
  borderColor: ["borderColor", "trackColor", "gridColor", "axisColor", "inactiveColor"],
  fontFamily: ["fontFamily"],
};

export function themePaletteFromTheme(theme: Partial<CompositionTheme>) {
  return theme.chartPalette?.length ? theme.chartPalette : DEFAULT_COMPOSITION_THEME.chartPalette;
}

export function mergeTheme(base: Partial<CompositionTheme>): CompositionTheme {
  return {
    ...DEFAULT_COMPOSITION_THEME,
    ...base,
    chartPalette: base.chartPalette?.length
      ? base.chartPalette
      : DEFAULT_COMPOSITION_THEME.chartPalette,
  };
}

export function applyThemeToWidgetProps(
  widgetType: string,
  props: Record<string, any>,
  theme: CompositionTheme
) {
  const next = { ...props };
  const palette = theme.chartPalette?.length ? theme.chartPalette : DEFAULT_COMPOSITION_THEME.chartPalette;

  const setIfPresent = (key: string, value: any) => {
    if (Object.prototype.hasOwnProperty.call(next, key)) {
      next[key] = value;
    }
  };

  const setAliases = (keys: string[], value: any) => {
    keys.forEach((key) => setIfPresent(key, value));
  };

  setAliases(["backgroundColor", "background", "bgColor", "surfaceColor", "panelColor", "cardBackgroundColor", "nodeBgColor", "basePanelColor", "fillColor", "emptyPanelColor"], theme.backgroundColor);
  setAliases(["textColor", "color", "titleColor", "subtitleColor", "labelColor", "legendTextColor", "trendLabelColor"], theme.textColor);
  setAliases(["accentColor", "cursorColor", "glowColor"], theme.accentColor);
  setAliases(["chartStrokeColor", "strokeColor"], theme.chartStrokeColor);
  setAliases(["chartStrokeWidth", "strokeWidth"], theme.chartStrokeWidth);
  setAliases(["chartBorderRadius", "borderRadius", "rx"], theme.chartBorderRadius);
  setAliases(["lineColor"], theme.chartStrokeColor);
  setAliases(["axisColor", "gridColor", "trackColor", "inactiveColor", "borderColor"], theme.borderColor);
  setAliases(["fontFamily"], theme.fontFamily);

  if (Object.prototype.hasOwnProperty.call(next, "titleColor")) {
    next.titleColor = theme.textColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "subtitleColor")) {
    next.subtitleColor = theme.mutedTextColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "background")) {
    next.background = theme.backgroundColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "areaColor")) {
    next.areaColor = theme.accentSoftColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "strokeColor")) {
    next.strokeColor = theme.chartStrokeColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "strokeWidth")) {
    next.strokeWidth = theme.chartStrokeWidth;
  }
  if (Object.prototype.hasOwnProperty.call(next, "borderRadius")) {
    next.borderRadius = theme.chartBorderRadius;
  }
  if (Object.prototype.hasOwnProperty.call(next, "increaseColor")) {
    next.increaseColor = theme.accentColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "decreaseColor")) {
    next.decreaseColor = theme.mode === "dark" ? "#f87171" : "#ef4444";
  }
  if (Object.prototype.hasOwnProperty.call(next, "startEndColor")) {
    next.startEndColor = theme.accentSoftColor;
  }
  if (Object.prototype.hasOwnProperty.call(next, "barColors")) {
    next.barColors = palette;
  }
  if (Object.prototype.hasOwnProperty.call(next, "pieColors")) {
    next.pieColors = palette;
  }
  if (Object.prototype.hasOwnProperty.call(next, "donutColors")) {
    next.donutColors = palette;
  }
  if (Object.prototype.hasOwnProperty.call(next, "pointColors")) {
    next.pointColors = palette;
  }
  if (Object.prototype.hasOwnProperty.call(next, "seriesColors")) {
    next.seriesColors = palette;
  }

  // Ensure common svg/text props on dark themes stay legible even if the widget defaults are hard-coded elsewhere.
  if (widgetType === "STAT_REVEAL" && Object.prototype.hasOwnProperty.call(next, "color")) {
    next.color = theme.textColor;
  }

  switch (widgetType) {
    case "BAR_CHART":
    case "LINE_CHART":
    case "DONUT_CHART":
      // FIX: Ensure that if we are in light/minimal stroke mode, 
      // the base fill colors don't bleed solid colors over the lines.
      next.barColors = theme.mode === "light" 
        ? theme.chartPalette.map(() => "transparent") // Clear fills for true strokes-only layout
        : theme.chartPalette;

      next.strokeColor = theme.chartStrokeColor;
      next.strokeWidth = theme.chartStrokeWidth;
      next.borderRadius = theme.chartBorderRadius;
      next.axisColor = theme.borderColor;
      next.gridColor = theme.mutedTextColor;
      next.labelColor = theme.textColor;
      
      // Backgrounds inside the SVG tag must not solid-fill the vector shapes
      next.backgroundColor = "transparent"; 
      break;
    case "DONUT_STEP_CHART_RIG":
      // FIX: Ensure that if we are in light/minimal stroke mode, 
      // the base fill colors don't bleed solid colors over the lines.
      next.barColors = theme.mode === "light" 
        ? theme.chartPalette.map(() => "transparent") // Clear fills for true strokes-only layout
        : theme.chartPalette;

      next.strokeColor = theme.chartStrokeColor;
      next.strokeWidth = theme.chartStrokeWidth;
      next.borderRadius = theme.chartBorderRadius;
      next.axisColor = theme.borderColor;
      next.gridColor = theme.mutedTextColor;
      next.labelColor = theme.textColor;
      
      // Backgrounds inside the SVG tag must not solid-fill the vector shapes
      next.backgroundColor = "transparent"; 
      break;
    case "AREA_CHART":
      next.areaColor = theme.accentSoftColor;
      next.lineColor = theme.chartStrokeColor;
      next.strokeColor = theme.chartStrokeColor;
      next.strokeWidth = theme.chartStrokeWidth;
      next.axisColor = theme.borderColor;
      next.gridColor = theme.mutedTextColor;
      next.labelColor = theme.textColor;
      next.backgroundColor = theme.backgroundColor;
      break;
    case "PIE_CHART":
      next.pieColors = palette;
      next.strokeColor = theme.chartStrokeColor;
      next.strokeWidth = theme.chartStrokeWidth;
      next.labelColor = theme.textColor;
      next.fontFamily = theme.fontFamily;
      next.backgroundColor = theme.backgroundColor;
      break;
    case "WATERFALL_CHART":
      next.increaseColor = theme.chartStrokeColor;
      next.decreaseColor = theme.mode === "dark" ? "#f87171" : "#ef4444";
      next.startEndColor = theme.accentSoftColor;
      next.strokeColor = theme.chartStrokeColor;
      next.strokeWidth = theme.chartStrokeWidth;
      next.borderRadius = theme.chartBorderRadius;
      next.axisColor = theme.borderColor;
      next.gridColor = theme.mutedTextColor;
      next.labelColor = theme.textColor;
      next.backgroundColor = theme.backgroundColor;
      break;
    case "STAT_REVEAL":
      next.color = theme.textColor;
      next.backgroundColor = theme.backgroundColor;
      next.fontFamily = theme.fontFamily;
      break;
    case "TITLE_CARD":
      next.titleColor = theme.textColor;
      next.subtitleColor = theme.mutedTextColor;
      next.accentColor = theme.accentColor;
      next.backgroundColor = theme.backgroundColor;
      next.fontFamily = theme.fontFamily;
      break;
    case "TYPEWRITER":
      next.textColor = theme.textColor;
      next.backgroundColor = theme.backgroundColor;
      next.cursorColor = theme.accentColor;
      next.fontFamily = theme.fontFamily;
      break;
    case "TEXT":
      next.color = theme.textColor;
      next.background = theme.surfaceColor;
      next.fontFamily = theme.fontFamily;
      break;
    default:
      break;
  }

  return next;
}

export function applyThemeToScenes(
  scenes: Array<{ widget: string; props: Record<string, any> }>,
  theme: CompositionTheme
) {
  return scenes.map((scene) => ({
    ...scene,
    props: applyThemeToWidgetProps(scene.widget, scene.props ?? {}, theme),
  }));
}
