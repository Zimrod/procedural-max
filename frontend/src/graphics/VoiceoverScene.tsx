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
import { getWidgetDefinition } from '../core/widgetRegistry';

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
  // A scene can briefly contain props from the previously selected widget while
  // the editor is updating. Start with the new widget's defaults so required
  // values are always present, then let explicit scene props win.
  const defaultProps = getWidgetDefinition(normalizedWidget)?.defaultProps ?? {};
  const safeProps = {
    ...defaultProps,
    ...(props && typeof props === 'object' ? props : {}),
  };

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

type WidgetErrorBoundaryProps = {
  widget: string;
  resetKey: string;
  children: React.ReactNode;
};

type WidgetErrorBoundaryState = {
  error: Error | null;
};

/**
 * Keep one broken widget from unmounting the whole composition. This is
 * especially important for data-driven SVG rigs, where an asset can be valid
 * SVG but still be missing a pivot required by a particular animation.
 */
class WidgetErrorBoundary extends React.Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  state: WidgetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): WidgetErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[WidgetErrorBoundary] ${this.props.widget}`, error, info);
  }

  componentDidUpdate(previousProps: WidgetErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <AbsoluteFill
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          padding: 32,
          backgroundColor: '#1a0505',
          border: '3px dashed #ef4444',
          color: '#fecaca',
          fontFamily: 'monospace',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 700 }}>Widget unavailable</div>
        <div style={{ marginTop: 10, fontSize: 14 }}>{this.props.widget}</div>
        <div style={{ marginTop: 8, maxWidth: 720, fontSize: 11, opacity: 0.8 }}>
          This scene was isolated because its asset or props are invalid. The rest of the composition can continue rendering.
        </div>
      </AbsoluteFill>
    );
  }
}

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
                <WidgetErrorBoundary
                  widget={normalizedWidgetKey || 'UNKNOWN_WIDGET'}
                  resetKey={JSON.stringify({ widget: normalizedWidgetKey, props: item.props })}
                >
                  <WidgetComponent
                    {...getSafeProps(normalizedWidgetKey, item.props)}
                    timelineStartFrame={item.startFrame}
                  />
                </WidgetErrorBoundary>
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
