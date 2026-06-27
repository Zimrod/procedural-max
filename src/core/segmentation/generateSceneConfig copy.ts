// src/core/segmentation/generateSceneConfig.ts
import { ClassifiedSegment } from '../taxonomy/widgetTaxonomy';

type SceneConfigItem = {
  widget: string;
  startSec: number;
  endSec: number;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  props: Record<string, any>;
};

const FALLBACK_WIDGET_ALIASES: Record<string, string> = {
  TEXT_EMPHASIS: 'TEXT_EMPHASIS',
  LINEAR_FLOW: 'LINEAR_FLOW',
  MILESTONE: 'MILESTONE',
  TIMELINE: 'TIMELINE',
};

const buildProps = (segment: ClassifiedSegment) => {
  const widgetType = segment.primaryType.toUpperCase();
  const displayLabel = segment.shortSummary || segment.text;
  const durationInFrames = segment.durationFrames;
  const widgetProps = segment.widgetProps ?? {};
  const extracted = segment.aiExtractedData ?? {};

  switch (widgetType) {
    case 'VALUATION':
      return {
        label: widgetProps.label ?? extracted.label ?? displayLabel,
        value: widgetProps.value ?? extracted.value ?? extractFirstNumber(segment.text) ?? 0,
        prefix: widgetProps.prefix ?? extracted.prefix ?? extracted.currency ?? detectCurrencySymbol(segment.text) ?? '$',
        suffix: widgetProps.suffix ?? normalizeSuffix(extracted.unit),
        durationInFrames,
      };

    case 'STAT_REVEAL':
      return {
        label: widgetProps.label ?? extracted.label ?? displayLabel,
        value: widgetProps.value ?? extracted.value ?? extractFirstNumber(segment.text) ?? 0,
        prefix: widgetProps.prefix ?? extracted.prefix ?? detectCurrencySymbol(segment.text) ?? '',
        suffix: widgetProps.suffix ?? normalizeSuffix(extracted.unit),
        text: widgetProps.text ?? displayLabel,
        durationInFrames,
      };

    case 'GAUGE':
      return {
        label: widgetProps.label ?? extracted.label ?? displayLabel,
        value: widgetProps.value ?? extracted.value ?? extractFirstNumber(segment.text) ?? 0,
        suffix: widgetProps.suffix ?? '%',
        durationInFrames,
      };

    case 'LINEAR_FLOW':
    case 'MILESTONE':
    case 'TIMELINE': {
      const steps = coerceSteps(widgetProps.steps ?? extracted.steps ?? segment.text);
      return {
        steps,
        durationPerStep:
          widgetProps.durationPerStep ??
          Math.max(20, Math.floor(durationInFrames / Math.max(1, steps.length))),
        nodeRadius: widgetProps.nodeRadius ?? 70,
        nodeSpacing: widgetProps.nodeSpacing ?? 320,
        stepYOffset: widgetProps.stepYOffset ?? 140,
        virtualHeight: widgetProps.virtualHeight ?? 1080,
      };
    }

    case 'TEXT_EMPHASIS':
    case 'TITLE_CARD':
    case 'CAPTION':
    case 'BRAND_CARD':
      return {
        text: widgetProps.text ?? displayLabel,
        durationInFrames,
        fontSize: widgetProps.fontSize ?? (widgetType === 'CAPTION' ? 32 : 42),
      };

    default:
      return {
        ...widgetProps,
        text: widgetProps.text ?? displayLabel,
        durationInFrames,
        fontSize: widgetProps.fontSize ?? 32,
      };
  }
};

export function generateSceneConfig(segments: ClassifiedSegment[]): SceneConfigItem[] {
  return segments.map((segment) => {
    const widget = FALLBACK_WIDGET_ALIASES[segment.primaryType] ?? segment.primaryType;

    return {
      widget,
      startSec: segment.startSec,
      endSec: segment.endSec,
      startFrame: segment.startFrame,
      endFrame: segment.endFrame,
      durationFrames: segment.durationFrames,
      props: buildProps(segment),
    };
  });
}

function extractFirstNumber(text: string): number | null {
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? Number(match[0].replace(/,/g, '')) : null;
}

function detectCurrencySymbol(text: string): string | null {
  const match = text.match(/[$£€]/);
  return match?.[0] ?? null;
}

function normalizeSuffix(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/million/i, 'M')
    .replace(/billion/i, 'B')
    .replace(/percent|percentage/i, '%')
    .trim();
}

function coerceSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return ['Step 1', 'Step 2', 'Step 3'];
  }

  return value
    .split(/,| and | then | to /i)
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 5);
}
