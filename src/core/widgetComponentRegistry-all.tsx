// src/core/widgetComponentRegistry.tsx
'use client';

import React from 'react';
import { WidgetType } from './widgetRegistry';

import { WaterfallChartRig } from '../remotion/MyComp/WaterfallChartRig';
import { MultiAreaChartRig } from '../remotion/MyComp/MultiAreaChartRig';
import { MultiBarChartRig } from '../remotion/MyComp/MultiBarChartRig';
import { MultiLineChartRig } from '../remotion/MyComp/MultiLineChartRig';
import { DonutStepChartRig } from '../remotion/MyComp/DonutStepChartRig';
import { TextRig } from '../remotion/MyComp/TextRig';
import { BarChartRig } from '../remotion/MyComp/BarChartRig';
import { DonutChartRig } from '../remotion/MyComp/DonutChartRig';
import { PieChartRig } from '../remotion/MyComp/PieChartRig';
import { DonutComparisonRig } from '../remotion/MyComp/DonutComparisonRig';
import { LineChartRig } from '../remotion/MyComp/LineChartRig';
import { AreaChartRig } from '../remotion/MyComp/AreaChartRig';
import { StatRevealRig } from '../remotion/MyComp/StatRevealRig';
import { TitleCardRig } from '../remotion/MyComp/TitleCardRig';
import { TypewriterRig } from '../remotion/MyComp/TypewriterRig';

export const DiagnosticFallbackRig: React.FC<{ widget: string }> = ({ widget }) => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#1a0505',
      border: '4px dashed #ff4444',
      color: '#ff8888',
      fontFamily: 'monospace',
    }}
  >
    <h1 style={{ fontSize: 42 }}>RENDER FAILURE</h1>
    <p style={{ fontSize: 20 }}>Widget Missing: {widget}</p>
  </div>
);

const componentMapping: Record<WidgetType, React.ComponentType<any>> = {
  BAR_CHART: BarChartRig,
  LINE_CHART: LineChartRig,
  AREA_CHART: AreaChartRig,
  DONUT_CHART: DonutChartRig,
  DONUT_STEP_CHART: DonutStepChartRig,
  DONUT_COMPARISON: DonutComparisonRig,
  PIE_CHART: PieChartRig,
  WATERFALL_CHART: WaterfallChartRig,
  MULTI_AREA_CHART: MultiAreaChartRig,
  MULTI_BAR_CHART: MultiBarChartRig,
  MULTI_LINE_CHART: MultiLineChartRig,
  STAT_REVEAL: StatRevealRig,
  TITLE_CARD: TitleCardRig,
  TYPEWRITER: TypewriterRig,
  TEXT: TextRig,
};

export function getWidgetComponent(widgetType: string): React.ComponentType<any> {
  const normalized = widgetType.toUpperCase() as WidgetType;
  return componentMapping[normalized] || (() => <DiagnosticFallbackRig widget={widgetType} />);
}