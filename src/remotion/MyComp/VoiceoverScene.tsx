import React from 'react';
import {
  AbsoluteFill,
  Sequence,
} from 'remotion';
import {
  DEFAULT_COMPOSITION_THEME,
  type CompositionTheme,
} from '../../types/theme';

import {
  getWidgetComponent,
} from '../../core/widgetComponentRegistry';

type SceneConfigItem = {
  widget: string;
  startFrame: number;
  durationFrames: number;
  mainDurationInFrames?: number;
  props: Record<string, any>;
};

type Props = {
  scenes: SceneConfigItem[];
  theme?: Partial<CompositionTheme>;
};

export const VoiceoverScene: React.FC<Props> = ({
  scenes,
  theme = {},
}) => {
  const resolvedTheme = {
    ...DEFAULT_COMPOSITION_THEME,
    ...theme,
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: resolvedTheme.backgroundColor,
      }}
    >
      {scenes.map((item, i) => {

        const WidgetComponent =
          getWidgetComponent(item.widget);

        return (
          <Sequence
            key={`${item.widget}_${i}`}
            from={item.startFrame}
            durationInFrames={item.mainDurationInFrames ?? item.durationFrames}
          >
            <WidgetComponent
              {...item.props}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
