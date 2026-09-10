export type CategoryChartData = {
  labels: string[];
  values: number[];
};

export type MultiSeriesChartData = {
  labels: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
};

const finiteNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export const normalizeCategoryChartData = (data: unknown): CategoryChartData => {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const rawLabels = Array.isArray(source.labels) ? source.labels : [];
  const rawValues = Array.isArray(source.values) ? source.values : [];
  const count = Math.min(rawLabels.length, rawValues.length);

  return {
    labels: Array.from({ length: count }, (_, index) => String(rawLabels[index] ?? `Item ${index + 1}`)),
    values: Array.from({ length: count }, (_, index) => finiteNumber(rawValues[index])),
  };
};

export const normalizeMultiSeriesChartData = (data: unknown): MultiSeriesChartData => {
  const source = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const labels = Array.isArray(source.labels)
    ? source.labels.map((label, index) => String(label ?? `Item ${index + 1}`))
    : [];
  const rawSeries = Array.isArray(source.series) ? source.series : [];

  return {
    labels,
    series: rawSeries.map((item, index) => {
      const series = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const rawValues = Array.isArray(series.values) ? series.values : [];
      return {
        name: String(series.name ?? `Series ${index + 1}`),
        values: labels.map((_, valueIndex) => finiteNumber(rawValues[valueIndex])),
        ...(typeof series.color === "string" ? { color: series.color } : {}),
      };
    }),
  };
};
