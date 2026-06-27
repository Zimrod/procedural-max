import React from 'react';

import { MultiLineChartRig } from '../MyComp/MultiLineChartRig';
import { MultiAreaChartRig } from '../MyComp/MultiAreaChartRig';
import { DonutStepChartRig } from '../MyComp/DonutStepChartRig';
import { WaterfallChartRig } from '../MyComp/WaterfallChartRig';

export function renderScene(scene: any) {
  switch (scene.widgetType) {

    case 'MULTI_LINE_CHART':
      return <MultiLineChartRig {...scene.props} />;

    case 'MULTI_AREA_CHART':
      return <MultiAreaChartRig {...scene.props} />;

    case 'DONUT_STEP_CHART':
      return <DonutStepChartRig {...scene.props} />;

    case 'WATERFALL_CHART':
      return <WaterfallChartRig {...scene.props} />;

    default:
      return null;
  }
}