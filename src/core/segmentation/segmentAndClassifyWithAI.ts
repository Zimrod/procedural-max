import type { WidgetType } from '../widgetRegistry';
import type { VisualStrategyOutput } from '../visual/visualStrategy';

export type RigSelection = {
  rigId: WidgetType;
  confidence: number;
  reasoning: string;
  props: Record<string, any>;
};

const VISUAL_STRATEGY_RIG_OVERRIDES: Partial<
  Record<
    VisualStrategyOutput['visualLanguage']['strategy'],
    WidgetType
  >
> = {
  data_highlight: 'STAT_REVEAL',
  hybrid_scene: 'TEXT',
  process_flow: 'PROCESS_FLOW',
  spatial_reveal: 'COUNTRY_FOCUS',
  symbolic_scene: 'TEXT',
  title_card: 'TITLE_CARD',
  valuation_cinematic: 'VALUATION',
}; 

export async function enrichSegmentWithAI(
  strategy: VisualStrategyOutput
): Promise<RigSelection> {
  const primaryType =
    strategy.widgetSelection.primaryType;
  const override =
    VISUAL_STRATEGY_RIG_OVERRIDES[
      strategy.visualLanguage.strategy
    ];
  const rigId = selectRigId(
    strategy,
    override ?? primaryType
  );

  return {
    rigId,
    confidence: computeConfidence(
      strategy,
      rigId,
      override
    ),
    reasoning: buildReasoning(
      strategy,
      rigId,
      override
    ),
    props: normalizeRigProps(strategy, rigId),
  };
}

function selectRigId(
  strategy: VisualStrategyOutput,
  preferred: WidgetType
): WidgetType {
  if (
    strategy.visualLanguage.strategy ===
      'data_highlight' &&
    hasNumericSignal(strategy)
  ) {
    return 'KPI_CARD';
  }

  if (
    strategy.visualLanguage.strategy ===
      'spatial_reveal' &&
    hasMultipleGeographicLabels(strategy)
  ) {
    return 'COUNTRY_ROUTE';
  }

  if (
    strategy.visualLanguage.strategy ===
      'symbolic_scene' &&
    strategy.sentenceText.length <= 60
  ) {
    return 'TYPEWRITER';
  }

  return preferred;
}

function computeConfidence(
  strategy: VisualStrategyOutput,
  rigId: WidgetType,
  override?: WidgetType
): number {
  let confidence = 0.8;

  if (rigId === strategy.widgetSelection.primaryType) {
    confidence += 0.1;
  }

  if (override && override === rigId) {
    confidence += 0.05;
  }

  if (strategy.ideaAssignments.leadIdeaId) {
    confidence += 0.03;
  }

  if (strategy.widgetProps) {
    confidence += 0.02;
  }

  return Number(
    Math.min(confidence, 0.99).toFixed(2)
  );
}

function buildReasoning(
  strategy: VisualStrategyOutput,
  rigId: WidgetType,
  override?: WidgetType
): string {
  const overrideNote =
    override && override !== strategy.widgetSelection.primaryType
      ? ` Strategy override preferred '${override}' for the '${strategy.visualLanguage.strategy}' visual language.`
      : '';

  return `Rig selection resolved '${strategy.widgetSelection.primaryType}' into '${rigId}' for scene '${strategy.sceneId}'.${overrideNote} Props were normalized from visual strategy output so the renderer can mount the chosen rig directly.`;
}

function normalizeRigProps(
  strategy: VisualStrategyOutput,
  rigId: WidgetType
): Record<string, any> {
  const baseProps = {
    ...strategy.widgetProps,
  };
  const text =
    readString(baseProps.text) ??
    readString(baseProps.title) ??
    strategy.sentenceText;

  switch (rigId) {
    case 'TITLE_CARD':
      return {
        title:
          readString(baseProps.title) ??
          text,
        subtitle:
          readString(baseProps.subtitle) ??
          '',
      };
    case 'TYPEWRITER':
      return {
        text,
        typingSpeed:
          readNumber(baseProps.typingSpeed) ?? 2,
        startDelay:
          readNumber(baseProps.startDelay) ?? 0,
      };
    case 'TEXT':
      return {
        text,
        durationInFrames:
          readNumber(
            baseProps.durationInFrames
          ) ?? strategy.timing.durationFrames,
      };
    case 'PROCESS_FLOW': {
      const steps = readStringArray(
        baseProps.steps
      );
      const finalSteps =
        steps.length > 0
          ? steps
          : buildFallbackSteps(strategy);

      return {
        steps: finalSteps,
        durationPerStep:
          readNumber(
            baseProps.durationPerStep
          ) ??
          Math.max(
            20,
            Math.floor(
              strategy.timing.durationFrames /
                Math.max(finalSteps.length, 1)
            )
          ),
        nodeRadius:
          readNumber(baseProps.nodeRadius) ??
          200,
        nodeSpacing:
          readNumber(baseProps.nodeSpacing) ??
          770,
        stepYOffset:
          readNumber(baseProps.stepYOffset) ??
          240,
        virtualHeight:
          readNumber(baseProps.virtualHeight) ??
          1080,
      };
    }
    case 'COUNTRY_ROUTE':
      return {
        fromCountry:
          readString(baseProps.fromCountry) ??
          'BWA',
        toCountry:
          readString(baseProps.toCountry) ??
          'ZAF',
        routeStartFrame: 0,
        routeDurationFrames:
          Math.floor(
            strategy.timing.durationFrames * 0.6
          ),
        routeLineDelayFrames:
          readNumber(
            baseProps.routeLineDelayFrames
          ) ?? 15,
        labelRevealDurationFrames:
          readNumber(
            baseProps.labelRevealDurationFrames
          ) ?? 20,
      };
    case 'COUNTRY_FOCUS':
    case 'COUNTRY_DROP_PIN':
      return {
        country:
          readString(baseProps.country) ??
          inferCountryCode(strategy),
        zoomStartFrame: 0,
        zoomDurationFrames:
          readNumber(
            baseProps.zoomDurationFrames
          ) ??
          Math.max(
            20,
            Math.floor(
              strategy.timing.durationFrames * 0.4
            )
          ),
        ...(rigId === 'COUNTRY_DROP_PIN'
          ? {
              pinDropDelayFrames:
                readNumber(
                  baseProps.pinDropDelayFrames
                ) ??
                Math.floor(
                  strategy.timing.durationFrames *
                    0.5
                ),
            }
          : {}),
      };
    case 'KPI_CARD':
      return {
        title:
          readString(baseProps.title) ??
          readString(baseProps.label) ??
          text,
        targetValue:
          readNumber(baseProps.targetValue) ??
          readNumber(baseProps.value) ??
          0,
        valuePrefix:
          readString(baseProps.valuePrefix) ??
          readString(baseProps.prefix) ??
          '',
        valueSuffix:
          readString(baseProps.valueSuffix) ??
          readString(baseProps.suffix) ??
          '',
        percentageChange:
          readNumber(
            baseProps.percentageChange
          ) ?? 0,
        trendLabel:
          readString(baseProps.trendLabel) ??
          'vs baseline',
        sparklineData:
          Array.isArray(baseProps.sparklineData)
            ? baseProps.sparklineData
            : [],
      };
    case 'VALUATION':
      return {
        value:
          readNumber(baseProps.value) ?? 0,
        prefix:
          readString(baseProps.prefix) ?? '$',
        suffix:
          readString(baseProps.suffix) ?? '',
        text,
        label:
          readString(baseProps.label) ??
          undefined,
      };
    case 'STAT_REVEAL':
      return {
        label:
          readString(baseProps.label) ??
          text,
        value:
          readNumber(baseProps.value) ?? 0,
        prefix:
          readString(baseProps.prefix) ?? '',
        suffix:
          readString(baseProps.suffix) ?? '',
        text,
      };
    default:
      return baseProps;
  }
}

function hasNumericSignal(
  strategy: VisualStrategyOutput
): boolean {
  return (
    typeof strategy.widgetProps.value ===
      'number' ||
    /\d/.test(strategy.sentenceText)
  );
}

function hasMultipleGeographicLabels(
  strategy: VisualStrategyOutput
): boolean {
  return (
    Array.isArray(
      strategy.widgetProps.supportingLabels
    ) &&
    strategy.widgetProps.supportingLabels
      .filter(Boolean).length > 1
  );
}

function inferCountryCode(
  strategy: VisualStrategyOutput
): string {
  const sentence =
    strategy.sentenceText.toLowerCase();

  if (sentence.includes('botswana')) {
    return 'BWA';
  }

  if (sentence.includes('africa')) {
    return 'ZAF';
  }

  return 'GBR';
}

function buildFallbackSteps(
  strategy: VisualStrategyOutput
): string[] {
  const items = [
    ...readStringArray(
      strategy.widgetProps.items
    ),
    ...readStringArray(
      strategy.widgetProps.callouts
    ),
  ].filter(Boolean);

  if (items.length > 0) {
    return items.slice(0, 5);
  }

  return strategy.sentenceText
    .split(/,| and | then | to /i)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function readString(
  value: unknown
): string | undefined {
  return typeof value === 'string' &&
    value.trim().length > 0
    ? value
    : undefined;
}

function readNumber(
  value: unknown
): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : undefined;
}

function readStringArray(
  value: unknown
): string[] {
  return Array.isArray(value)
    ? value
        .map((entry) =>
          typeof entry === 'string'
            ? entry.trim()
            : ''
        )
        .filter(Boolean)
    : [];
}
