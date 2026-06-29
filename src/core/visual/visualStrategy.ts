import fs from 'fs';
import path from 'path';

import type {
  SemanticExtraction,
  SemanticIdea,
} from '../segmentation/semanticExtraction';
import type {
  NarrativeBeat as NarrativeScene,
} from '../narrative/narrativeAnalyzer';
import type {
  CinematicIntentOutput,
} from '../decisionTrees/decisionTree';
import type {
  CinematicPlan,
} from '../planning/cinematicPlanner';
import {
  widgetRegistry,
  type WidgetCategory,
  type WidgetType,
} from '../widgetRegistry-all-widgets';

export type VisualStrategyOutput = {
  sceneId: string;
  sourceSentenceId: string;
  sentenceText: string;
  timing: {
    startSec: number;
    endSec: number;
    startFrame: number;
    endFrame: number;
    durationFrames: number;
  };
  visualLanguage: {
    strategy:
      | 'title_card'
      | 'process_flow'
      | 'spatial_reveal'
      | 'valuation_cinematic'
      | 'symbolic_scene'
      | 'data_highlight'
      | 'hybrid_scene';
    rationale: string;
  };
  widgetSelection: {
    primaryCategory: WidgetCategory;
    primaryType: WidgetType;
    secondaryCategory?: WidgetCategory;
    secondaryType?: WidgetType;
  };
  ideaAssignments: {
    leadIdeaId?: string;
    widgetLeadIdeaIds: string[];
    supportingIdeaIds: string[];
    omittedIdeaIds: string[];
  };
  animationStrategy: {
    pacing: CinematicPlan['cinematicDesign']['pacing'];
    transitionIn: CinematicPlan['cinematicDesign']['transitionIn'];
    transitionOut: CinematicPlan['cinematicDesign']['transitionOut'];
    revealOrder: CinematicPlan['cinematicDesign']['revealHierarchy'];
  };
  widgetProps: Record<string, any>;
  reasoning: string;
};

type VisualStrategyInput = {
  semanticExtractions: SemanticExtraction[];
  narrativeScenes: NarrativeScene[];
  decisionTreeOutput: CinematicIntentOutput[];
  cinematicPlans: CinematicPlan[];
};

function getIdeaMap(ideas: SemanticIdea[]) {
  return new Map(ideas.map((idea) => [idea.id, idea]));
}

function getLeadIdeas(
  extraction: SemanticExtraction,
  plan: CinematicPlan
): SemanticIdea[] {
  const ideaMap = getIdeaMap(
    extraction.semanticIdeas
  );

  return [
    plan.prioritization.leadIdeaId,
    ...plan.prioritization.primaryIdeaIds,
    ...plan.prioritization.secondaryIdeaIds,
  ]
    .filter(
      (ideaId, index, array): ideaId is string =>
        Boolean(ideaId) &&
        array.indexOf(ideaId) === index
    )
    .map((ideaId) => ideaMap.get(ideaId))
    .filter((idea): idea is SemanticIdea => Boolean(idea));
}

function chooseVisualLanguage(
  extraction: SemanticExtraction,
  scene: NarrativeScene,
  intent: CinematicIntentOutput,
  plan: CinematicPlan
): VisualStrategyOutput['visualLanguage'] {
  const selectedIdeas = getLeadIdeas(
    extraction,
    plan
  );
  const hasGeography = selectedIdeas.some(
    (idea) => idea.type === 'geography'
  );
  const hasInfrastructure = selectedIdeas.some(
    (idea) =>
      idea.type === 'infrastructure' ||
      idea.type === 'technology' ||
      idea.type === 'energy_capacity'
  );
  // ... inside chooseVisualLanguage(...)
  const hasFinance = selectedIdeas.some(
    (idea) =>
      idea.type === 'finance' ||
      idea.type === 'investment'
  );

  if (
    hasFinance &&
    // 🚀 Fallback safety guard since cinematicPurpose isn't an explicit field on NarrativeBeat
    ((scene as any).cinematicPurpose === 'build_trust')
  ) {
    return {
      strategy: 'valuation_cinematic',
      rationale:
        'Finance-led meaning with persuasive intent fits a valuation-driven visual treatment.',
    };
  }
  const isSymbolic =
    intent.cinematicIntent.primaryMode ===
      'symbolic_tableau' ||
    selectedIdeas.some(
      (idea) =>
        idea.type === 'symbolism' ||
        idea.type === 'abstract_concept'
    );

  if (plan.titleCardPlan.useTitleCard) {
    return {
      strategy: 'title_card',
      rationale:
        'Intro scene starts with a title card before expanding into supporting visuals.',
    };
  }

  if (
    intent.cinematicIntent.groupingStrategy ===
    'parent_with_outcomes'
  ) {
    return {
      strategy: 'process_flow',
      rationale:
        'The sentence expresses a parent concept with linked outcomes, which maps best to a process flow.',
    };
  }

  if (hasGeography && hasInfrastructure) {
    return {
      strategy: 'spatial_reveal',
      rationale:
        'Geography and infrastructure are both active, so the scene should reveal place and asset together.',
    };
  }

  if (
    hasFinance &&
    scene.cinematicPurpose === 'build_trust'
  ) {
    return {
      strategy: 'valuation_cinematic',
      rationale:
        'Finance-led meaning with persuasive intent fits a valuation-driven visual treatment.',
    };
  }

  if (isSymbolic) {
    return {
      strategy: 'symbolic_scene',
      rationale:
        'The sentence leans abstract or aspirational, so symbolism should lead the visual language.',
    };
  }

  if (
    intent.cinematicIntent.primaryMode ===
    'data_focus'
  ) {
    return {
      strategy: 'data_highlight',
      rationale:
        'Metric-led emphasis is best expressed through a focused data widget.',
    };
  }

  return {
    strategy: 'hybrid_scene',
    rationale:
      'No single visual language dominates, so a hybrid scene should combine the lead concept with supporting callouts.',
  };
}

function chooseWidgetSelection(
  language: VisualStrategyOutput['visualLanguage']['strategy'],
  extraction: SemanticExtraction,
  plan: CinematicPlan
): VisualStrategyOutput['widgetSelection'] {
  switch (language) {
    case 'title_card':
      return {
        primaryCategory: 'TEXT_TYPOGRAPHY',
        primaryType: 'TITLE_CARD',
        secondaryCategory: 'LOCATION_GEOGRAPHY',
        secondaryType: 'COUNTRY_FOCUS',
      };
    case 'process_flow':
      return {
        primaryCategory: 'PROCESS_FLOW',
        primaryType: 'PROCESS_FLOW',
        secondaryCategory: 'TEXT_TYPOGRAPHY',
        secondaryType: 'TEXT',
      };
    case 'spatial_reveal':
      return {
        primaryCategory: 'LOCATION_GEOGRAPHY',
        primaryType: 'COUNTRY_FOCUS',
        secondaryCategory: 'TEXT_TYPOGRAPHY',
        secondaryType: 'TEXT',
      };
    case 'valuation_cinematic':
      return {
        primaryCategory: 'FINANCIAL_INSTRUMENTS',
        primaryType: 'VALUATION',
        secondaryCategory: 'DATA_REPORTING',
        secondaryType: 'STAT_REVEAL',
      };
    case 'symbolic_scene':
      return {
        primaryCategory: 'TEXT_TYPOGRAPHY',
        primaryType: 'TEXT',
        secondaryCategory: 'TIME_MOTION',
        secondaryType: 'PROGRESS_BAR',
      };
    case 'data_highlight':
      return {
        primaryCategory: 'DATA_REPORTING',
        primaryType:
          extraction.semanticIdeas.some(
            (idea) =>
              idea.type === 'finance' ||
              idea.type === 'investment'
          )
            ? 'KPI_CARD'
            : 'STAT_REVEAL',
      };
    default:
      return {
        primaryCategory: 'TEXT_TYPOGRAPHY',
        primaryType: plan.titleCardPlan.useTitleCard
          ? 'TITLE_CARD'
          : 'TEXT',
        secondaryCategory: 'DATA_REPORTING',
        secondaryType: 'STAT_REVEAL',
      };
  }
}

function buildProcessFlowSteps(
  extraction: SemanticExtraction,
  plan: CinematicPlan
): string[] {
  const ideaMap = getIdeaMap(
    extraction.semanticIdeas
  );
  const ordered = [
    plan.prioritization.leadIdeaId,
    ...plan.prioritization.primaryIdeaIds,
    ...plan.prioritization.secondaryIdeaIds,
  ]
    .filter(
      (ideaId, index, array): ideaId is string =>
        Boolean(ideaId) &&
        array.indexOf(ideaId) === index
    )
    .map((ideaId) => ideaMap.get(ideaId)?.phrase)
    .filter((phrase): phrase is string => Boolean(phrase));

  return ordered.slice(0, 5);
}

function buildWidgetProps(
  strategy: VisualStrategyOutput['visualLanguage']['strategy'],
  selection: VisualStrategyOutput['widgetSelection'],
  extraction: SemanticExtraction,
  plan: CinematicPlan
): Record<string, any> {
  const primaryRegistry =
    widgetRegistry[selection.primaryType];
  const shortSummary =
    plan.titleCardPlan.titleText ??
    extraction.semanticSummary.dominantTheme;
  const selectedPhrases = getLeadIdeas(
    extraction,
    plan
  ).map((idea) => idea.phrase);

  const extractedData =
    strategy === 'process_flow'
      ? {
          steps: buildProcessFlowSteps(
            extraction,
            plan
          ),
        }
      : {
          label: shortSummary,
          items: selectedPhrases,
        };

  const baseProps =
    primaryRegistry.buildFallbackProps({
      shortSummary,
      extractedData,
      durationFrames: extraction.timing.durationFrames,
      text: extraction.sentenceText,
    });

  if (strategy === 'title_card') {
    return {
      ...baseProps,
      text:
        plan.titleCardPlan.titleText ??
        shortSummary,
      subtitle:
        plan.titleCardPlan.subtitleText,
    };
  }

  if (strategy === 'spatial_reveal') {
    return {
      ...baseProps,
      focusLabel:
        selectedPhrases[0] ?? shortSummary,
      supportingLabels:
        selectedPhrases.slice(1),
    };
  }

  if (strategy === 'valuation_cinematic') {
    return {
      ...baseProps,
      supportingMetrics:
        selectedPhrases.slice(1),
    };
  }

  if (strategy === 'symbolic_scene') {
    return {
      ...baseProps,
      text: selectedPhrases[0] ?? shortSummary,
      echoes: selectedPhrases.slice(1),
    };
  }

  if (strategy === 'hybrid_scene') {
    return {
      ...baseProps,
      text: selectedPhrases[0] ?? shortSummary,
      callouts: selectedPhrases.slice(1),
    };
  }

  return baseProps;
}

function buildReasoning(
  language: VisualStrategyOutput['visualLanguage'],
  selection: VisualStrategyOutput['widgetSelection'],
  plan: CinematicPlan
): string {
  return `Visual strategy mapped the planner's prioritization into '${language.strategy}' and selected '${selection.primaryType}' as the primary widget. The scene keeps '${plan.prioritization.leadIdeaId ?? 'no lead'}' as the lead concept while respecting the planner's omitted ideas and reveal order.`;
}

export async function visualStrategy({
  semanticExtractions,
  narrativeScenes,
  decisionTreeOutput,
  cinematicPlans,
}: VisualStrategyInput): Promise<
  VisualStrategyOutput[]
> {
  const extractionById = new Map(
    semanticExtractions.map((entry) => [
      entry.sentenceId,
      entry,
    ])
  );
  const sceneById = new Map(
    narrativeScenes.map((scene) => [
      scene.sourceSentenceId,
      scene,
    ])
  );
  const intentById = new Map(
    decisionTreeOutput.map((intent) => [
      intent.sourceSentenceId,
      intent,
    ])
  );

  const output = cinematicPlans.map((plan) => {
    const extraction =
      extractionById.get(
        plan.sourceSentenceId
      );
    const scene = sceneById.get(
      plan.sourceSentenceId
    );
    const intent = intentById.get(
      plan.sourceSentenceId
    );

    if (!extraction || !scene || !intent) {
      throw new Error(
        `Visual strategy inputs missing for sentence ${plan.sourceSentenceId}`
      );
    }

    const visualLanguage =
      chooseVisualLanguage(
        extraction,
        scene,
        intent,
        plan
      );
    const widgetSelection =
      chooseWidgetSelection(
        visualLanguage.strategy,
        extraction,
        plan
      );
    const widgetProps = buildWidgetProps(
      visualLanguage.strategy,
      widgetSelection,
      extraction,
      plan
    );

    return {
      sceneId: plan.sceneId,
      sourceSentenceId:
        plan.sourceSentenceId,
      sentenceText: plan.sentenceText,
      timing: {
        startSec: extraction.timing.startSec,
        endSec: extraction.timing.endSec,
        startFrame:
          extraction.timing.startFrame,
        endFrame:
          extraction.timing.endFrame,
        durationFrames:
          extraction.timing.durationFrames,
      },
      visualLanguage,
      widgetSelection,
      ideaAssignments: {
        leadIdeaId:
          plan.prioritization.leadIdeaId,
        widgetLeadIdeaIds: [
          ...plan.prioritization.primaryIdeaIds,
          ...plan.prioritization.secondaryIdeaIds,
        ].slice(0, plan.planningSummary.ideasThatFit),
        supportingIdeaIds:
          plan.prioritization.secondaryIdeaIds,
        omittedIdeaIds:
          plan.prioritization.omittedIdeaIds,
      },
      animationStrategy: {
        pacing:
          plan.cinematicDesign.pacing,
        transitionIn:
          plan.cinematicDesign.transitionIn,
        transitionOut:
          plan.cinematicDesign.transitionOut,
        revealOrder:
          plan.cinematicDesign.revealHierarchy,
      },
      widgetProps,
      reasoning: buildReasoning(
        visualLanguage,
        widgetSelection,
        plan
      ),
    };
  });

  const outputPath = path.resolve(
    process.cwd(),
    'public',
    '07_visual_strategy.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2)
  );

  console.log(
    'Visual strategy saved:',
    outputPath
  );

  return output;
}
