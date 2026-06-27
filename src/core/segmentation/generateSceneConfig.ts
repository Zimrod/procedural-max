// src/core/segmentation/generateSceneConfig.ts
import { ClassifiedSegment, WidgetType } from '../taxonomy/widgetTaxonomy';
import { widgetRegistry } from '../widgetRegistry';

type SceneConfigItem = {
  widget: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  props: Record<string, any>;
};

/**
 * Strictly maps loose AI-extracted entities or custom component properties 
 * directly into the target TypeScript Props schema defined for each rig.
 */
const buildProps = (segment: ClassifiedSegment, widgetKey: WidgetType): Record<string, any> => {
  const displayLabel = segment.shortSummary || segment.text;
  const durationInFrames = segment.durationFrames;
  
  const widgetProps = segment.widgetProps ?? {};
  const extracted = segment.aiExtractedData ?? {};
  const defaultRegistryProps = widgetRegistry[widgetKey]?.defaultProps ?? {};

  // Layer global overrides on top of standard styling options
  const baseLayoutProps = {
    ...defaultRegistryProps,
    ...widgetProps,
  };

  switch (widgetKey) {
    
    // --- 1. SINGLE-SERIES DATA RIGS ---
    case 'WATERFALL_CHART': {
      return {
        ...baseLayoutProps,
        data: {
          labels: widgetProps.data?.labels ?? extracted.labels ?? [displayLabel],
          values: widgetProps.data?.values ?? extracted.values ?? [extractFirstNumber(segment.text) ?? 0],
          startValue: widgetProps.data?.startValue ?? extracted.startValue ?? 0,
          finalLabel: widgetProps.data?.finalLabel ?? extracted.finalLabel ?? "Total",
        },
        maxValue: widgetProps.maxValue ?? extracted.maxValue,
      };
    }

    case 'BAR_CHART':
    case 'DONUT_CHART':
    case 'PIE_CHART':
    case 'DONUT_STEP_CHART': {
      return {
        ...baseLayoutProps,
        data: {
          labels: widgetProps.data?.labels ?? extracted.labels ?? [displayLabel],
          values: widgetProps.data?.values ?? extracted.values ?? [extractFirstNumber(segment.text) ?? 0],
        }
      };
    }

    case 'AREA_CHART':
    case 'LINE_CHART': {
      return {
        ...baseLayoutProps,
        data: {
          labels: widgetProps.data?.labels ?? extracted.labels ?? [displayLabel],
          values: widgetProps.data?.values ?? extracted.values ?? [extractFirstNumber(segment.text) ?? 0],
        },
        maxValue: widgetProps.maxValue ?? extracted.maxValue,
      };
    }

    case 'DONUT_COMPARISON': {
      return {
        ...baseLayoutProps,
        data: {
          labels: widgetProps.data?.labels ?? extracted.labels ?? [displayLabel],
          values: widgetProps.data?.values ?? extracted.values ?? [extractFirstNumber(segment.text) ?? 0], // 0-100 values
        },
        maxValue: widgetProps.maxValue ?? extracted.maxValue ?? 100,
        columns: widgetProps.columns ?? extracted.columns ?? 3,
      };
    }

    // --- 2. MULTI-SERIES DATA RIGS ---
    case 'MULTI_AREA_CHART':
    case 'MULTI_BAR_CHART':
    case 'MULTI_LINE_CHART': {
      const defaultLabels = ["Q1", "Q2", "Q3", "Q4"];
      const defaultSeries = [{ name: "Value", values: [extractFirstNumber(segment.text) ?? 0] }];

      return {
        ...baseLayoutProps,
        data: {
          labels: widgetProps.data?.labels ?? extracted.labels ?? defaultLabels,
          series: widgetProps.data?.series ?? extracted.series ?? defaultSeries,
        },
        maxValue: widgetProps.maxValue ?? extracted.maxValue,
      };
    }

    // --- 3. METRIC DISPLAY RIGS ---
    case 'COUNTER': {
      return {
        ...baseLayoutProps,
        value: widgetProps.value ?? extracted.value ?? extractFirstNumber(segment.text) ?? 0,
        prefix: widgetProps.prefix ?? extracted.prefix ?? detectCurrencySymbol(segment.text) ?? "",
        suffix: widgetProps.suffix ?? normalizeSuffix(extracted.unit) ?? "",
        durationFrames: widgetProps.durationFrames ?? durationInFrames,
      };
    }

    case 'KPI_CARD': {
      return {
        ...baseLayoutProps,
        title: widgetProps.title ?? extracted.title ?? displayLabel,
        targetValue: widgetProps.targetValue ?? extracted.targetValue ?? extractFirstNumber(segment.text) ?? 0,
        valuePrefix: widgetProps.valuePrefix ?? extracted.valuePrefix ?? detectCurrencySymbol(segment.text) ?? "",
        valueSuffix: widgetProps.valueSuffix ?? normalizeSuffix(extracted.valueSuffix ?? extracted.unit) ?? "",
        percentageChange: widgetProps.percentageChange ?? extracted.percentageChange ?? 0,
        trendLabel: widgetProps.trendLabel ?? extracted.trendLabel ?? "vs baseline",
        sparklineData: widgetProps.sparklineData ?? extracted.sparklineData ?? [],
      };
    }

    case 'VALUATION': {
      return {
        ...baseLayoutProps,
        value: widgetProps.value ?? extracted.value ?? extractFirstNumber(segment.text) ?? undefined,
        prefix: widgetProps.prefix ?? extracted.prefix ?? extracted.currency ?? detectCurrencySymbol(segment.text) ?? '$',
        suffix: widgetProps.suffix ?? normalizeSuffix(extracted.unit) ?? undefined,
        text: widgetProps.text ?? displayLabel,
        label: widgetProps.label ?? extracted.label ?? undefined,
      };
    }
    
    case 'STAT_REVEAL': {
      return {
        ...baseLayoutProps,
        text: widgetProps.text ?? displayLabel,
        durationInFrames: widgetProps.durationInFrames ?? durationInFrames,
      };
    }

    // --- 4. PROCESS & FLOW RIGS ---
    case 'PROCESS_FLOW': {
      const steps = coerceStepsArray(widgetProps.steps ?? extracted.steps ?? segment.text);
      return {
        steps,
        durationPerStep: widgetProps.durationPerStep ?? Math.max(20, Math.floor(durationInFrames / Math.max(1, steps.length))),
        nodeRadius: widgetProps.nodeRadius ?? 200,
        nodeSpacing: widgetProps.nodeSpacing ?? 780,
        stepYOffset: widgetProps.stepYOffset ?? 200,
        virtualHeight: widgetProps.virtualHeight ?? 1080,
      };
    }

    case 'CIRCULAR_CYCLE': {
      // Formats data to compile array of ProcessStep elements: { label, value, icon }
      const rawSteps = widgetProps.steps ?? extracted.steps ?? [];
      const steps = Array.isArray(rawSteps) 
        ? rawSteps.map((s: any) => typeof s === 'string' ? { label: s } : s)
        : coerceStepsArray(segment.text).map(label => ({ label }));

      return {
        ...baseLayoutProps,
        steps,
        title: widgetProps.title ?? extracted.title ?? displayLabel,
        cycleDurationSeconds: widgetProps.cycleDurationSeconds ?? (durationInFrames / 30),
      };
    }

    case 'MILESTONE': {
      // Maps data properties to structural MilestoneItem layout parameters
      const rawMilestones = widgetProps.milestones ?? extracted.milestones ?? [];
      const milestones = Array.isArray(rawMilestones) ? rawMilestones : [
        { stageName: "STAGE 01", title: displayLabel, description: segment.text }
      ];

      return {
        ...baseLayoutProps,
        milestones,
        categoryTitle: widgetProps.categoryTitle ?? extracted.categoryTitle ?? "Project Milestones",
        durationSeconds: widgetProps.durationSeconds ?? (durationInFrames / 30),
      };
    }

    case 'TIMELINE': {
      // Reshapes elements into TimelineMilestone configuration records
      const rawMilestones = widgetProps.milestones ?? extracted.milestones ?? [];
      const milestones = Array.isArray(rawMilestones) ? rawMilestones : [
        { timeLabel: "Phase 1", title: displayLabel, description: segment.text }
      ];

      return {
        ...baseLayoutProps,
        milestones,
        categoryTitle: widgetProps.categoryTitle ?? extracted.categoryTitle ?? "Timeline Overview",
        revealDurationSeconds: widgetProps.revealDurationSeconds ?? (durationInFrames / 30),
      };
    }

    // --- 5. LOCATION & GEOGRAPHY RIGS ---
    case 'COUNTRY_DROP_PIN':
    case 'COUNTRY_FOCUS': {
      return {
        ...baseLayoutProps,
        country: widgetProps.country ?? extracted.country ?? "GBR",
        zoomStartFrame: widgetProps.zoomStartFrame ?? 0,
        zoomDurationFrames: widgetProps.zoomDurationFrames ?? Math.floor(durationInFrames * 0.4),
        ...(widgetKey === 'COUNTRY_DROP_PIN' ? { pinDropDelayFrames: widgetProps.pinDropDelayFrames ?? Math.floor(durationInFrames * 0.5) } : {}),
      };
    }

    case 'COUNTRY_ROUTE': {
      return {
        ...baseLayoutProps,
        fromCountry: widgetProps.fromCountry ?? extracted.fromCountry ?? "GBR",
        toCountry: widgetProps.toCountry ?? extracted.toCountry ?? "DEU",
        routeStartFrame: widgetProps.routeStartFrame ?? 0,
        routeDurationFrames: widgetProps.routeDurationFrames ?? Math.floor(durationInFrames * 0.6),
        routeLineDelayFrames: widgetProps.routeLineDelayFrames ?? 15,
        labelRevealDurationFrames: widgetProps.labelRevealDurationFrames ?? 20,
      };
    }

    // --- 6. TEXT & TYPOGRAPHY RIGS ---
    case 'TYPEWRITER': {
      return {
        ...baseLayoutProps,
        text: widgetProps.text ?? displayLabel,
        typingSpeed: widgetProps.typingSpeed ?? 2,
        startDelay: widgetProps.startDelay ?? 0,
      };
    }

    case 'TEXT': {
      return {
        ...baseLayoutProps,
        text: widgetProps.text ?? displayLabel,
        durationInFrames: widgetProps.durationInFrames ?? durationInFrames,
      };
    }

    case 'TITLE_CARD': {
      return {
        ...baseLayoutProps,
        title: widgetProps.title ?? displayLabel,
        subtitle: widgetProps.subtitle ?? extracted.subtitle ?? "",
      };
    }

    // --- 7. TIME & MOTION RIGS ---
    case 'COUNTDOWN': {
      return {
        ...baseLayoutProps,
        durationSeconds: widgetProps.durationSeconds ?? (durationInFrames / 30),
      };
    }

    case 'CALENDAR': {
      const now = new Date();
      return {
        ...baseLayoutProps,
        year: widgetProps.year ?? extracted.year ?? now.getFullYear(),
        month: widgetProps.month ?? extracted.month ?? (now.getMonth() + 1),
        markedDay: widgetProps.markedDay ?? extracted.markedDay ?? now.getDate(),
      };
    }

    case 'PROGRESS_BAR': {
      return {
        ...baseLayoutProps,
        progress: widgetProps.progress ?? extracted.progress, // undefined allows automatic timeline interpolation
      };
    }

    default:
      return {
        ...baseLayoutProps,
        text: widgetProps.text ?? displayLabel,
      };
  }
};

export function generateSceneConfig(segments: ClassifiedSegment[]): SceneConfigItem[] {
  return segments.map((segment) => {
    const normalizedKey = segment.primaryType.toUpperCase() as WidgetType;
    
    // Safety check against unmapped or commented-out taxonomy entries
    const finalWidgetName = widgetRegistry[normalizedKey] ? normalizedKey : 'TEXT';

    return {
      widget: finalWidgetName,
      startSec: segment.startSec,
      endSec: segment.endSec,
      startFrame: segment.startFrame,
      endFrame: segment.endFrame,
      durationFrames: segment.durationFrames,
      props: buildProps(segment, finalWidgetName),
    };
  });
}

// --- CORE PARSING UTILITIES ---

function extractFirstNumber(text: string): number | null {
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

function detectCurrencySymbol(text: string): string | null {
  const match = text.match(/[$£€]/);
  return match ? match[0] : null;
}

function normalizeSuffix(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/million/i, 'M')
    .replace(/billion/i, 'B')
    .replace(/percent|percentage/i, '%')
    .trim();
}

function coerceStepsArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value !== 'string') return ['Phase 1', 'Phase 2', 'Phase 3'];

  return value
    .split(/,| and | then | to /i)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 5);
}
