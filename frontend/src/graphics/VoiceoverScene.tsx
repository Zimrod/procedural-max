import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useVideoConfig,
} from 'remotion';
import {
  DEFAULT_COMPOSITION_THEME,
  type CompositionTheme,
} from '../types/theme';

import {
  getWidgetComponent,
} from '../core/widgetComponentRegistry';

type SceneConfigItem = {
  widget?: string;
  widgetType?: string; // Fallback field support
  startFrame: number;
  durationFrames: number;
  mainDurationInFrames?: number;
  props: Record<string, any>;
};

type Props = {
  scenes: SceneConfigItem[];
  theme?: Partial<CompositionTheme>;
};

const getSafeProps = (widget: string, props: Record<string, any> = {}) => {
  const normalizedWidget = typeof widget === 'string' ? widget.toUpperCase() : '';
  const safeProps = props && typeof props === 'object' ? { ...props } : {};

  if (normalizedWidget === 'TITLE_CARD' && typeof safeProps.title !== 'string') {
    safeProps.title = 'Untitled scene';
  }

  if (['TEXT', 'TEXT_ANIMATIONS_WORD_HIGHLIGHT'].includes(normalizedWidget) && typeof safeProps.text !== 'string') {
    safeProps.text = 'Add text to this scene';
  }

  if (['TERMINAL_TYPING_TEXT', 'SVG_DRAW_IN_TEXT', 'SEQUENTIAL_ELASTIC_TEXT'].includes(normalizedWidget) && typeof safeProps.textToAnimate !== 'string') {
    safeProps.textToAnimate = 'Add text to this scene';
  }

  if (normalizedWidget === 'BULLET_POINTS' && !Array.isArray(safeProps.items)) {
    safeProps.items = ['Add an item to this list'];
  }

  if (normalizedWidget === 'SLIDING_WORD_MASK' && !Array.isArray(safeProps.wordsToCycle)) {
    safeProps.wordsToCycle = ['Add a word'];
  }

  if (['BAR_CHART', 'LINE_CHART', 'DONUT_CHART', 'PIE_CHART'].includes(normalizedWidget) && !safeProps.data) {
    safeProps.data = { labels: [], values: [] };
  }

  if (normalizedWidget === 'MULTI_LINE_CHART' && !safeProps.data) {
    safeProps.data = { labels: [], series: [] };
  }

  return safeProps;
};

export const VoiceoverScene: React.FC<Props> = ({
  scenes,
  theme = {},
}) => {
  const { width, height } = useVideoConfig();
  const resolvedTheme = {
    ...DEFAULT_COMPOSITION_THEME,
    ...theme,
  };

  const containmentScale = Math.min(
    1,
    width < 500 ? width / 1400 : 1,
    height < 500 ? height / 900 : 1,
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: resolvedTheme.backgroundColor,
        overflow: 'hidden',
      }}
    >
      {scenes.map((item, i) => {
        // Resolve key supporting both naming conventions & upper-case normalization
        const rawWidgetKey = item.widget || item.widgetType || '';
        const normalizedWidgetKey = rawWidgetKey.toUpperCase();

        const WidgetComponent =
          getWidgetComponent(normalizedWidgetKey) || getWidgetComponent(rawWidgetKey);

        return (
          <Sequence
            key={`${normalizedWidgetKey || 'WIDGET'}_${i}`}
            from={item.startFrame}
            durationInFrames={item.mainDurationInFrames ?? item.durationFrames}
          >
            <AbsoluteFill style={{ overflow: 'hidden' }}>
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                  transform: `scale(${containmentScale})`,
                  transformOrigin: 'center center',
                }}
              >
                <WidgetComponent
                  {...getSafeProps(normalizedWidgetKey, item.props)}
                />
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};