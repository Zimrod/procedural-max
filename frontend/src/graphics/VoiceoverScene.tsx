import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
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

type ResolvedTransform = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotateDeg: number;
  opacity: number;
};

type ParentMode = 'all' | 'position' | 'scale' | 'rotation' | 'opacity';

const numeric = (value: any, fallback: number) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function resolveTransform(widget: string, props: Record<string, any>, absoluteFrame: number): ResolvedTransform {
  const isBar = widget === 'BAR_CHART';
  const base: ResolvedTransform = isBar
    ? { x: 0, y: 0, scaleX: 1, scaleY: 1, rotateDeg: 0, opacity: 1 }
    : {
        x: numeric(props.x ?? props.position?.x, 400),
        y: numeric(props.y ?? props.position?.y, 400),
        scaleX: numeric(props.scaleX ?? props.scale, 1),
        scaleY: numeric(props.scaleY ?? props.scale, 1),
        rotateDeg: numeric(props.rotateDeg, 0),
        opacity: numeric(props.opacity, 1),
      };
  const keyframes = (props[isBar ? 'barTransformKeyframes' : 'transformKeyframes'] ?? [])
    .filter((item: any) => Number.isFinite(Number(item?.frame)))
    .sort((a: any, b: any) => Number(a.frame) - Number(b.frame));
  if (!keyframes.length) return base;

  const frames = keyframes.map((item: any) => Number(item.frame));
  const resolve = (key: keyof ResolvedTransform) => {
    const values = keyframes.map((item: any) => numeric(item[key], base[key]));
    return interpolate(absoluteFrame, frames, values, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  };
  return {
    x: resolve('x'),
    y: resolve('y'),
    scaleX: isBar ? resolve('scaleX') : resolve('scaleX'),
    scaleY: isBar ? resolve('scaleY') : resolve('scaleY'),
    rotateDeg: resolve('rotateDeg'),
    opacity: resolve('opacity'),
  };
}

function resolveParentId(props: Record<string, any>, absoluteFrame: number): string {
  const keyframes = (props.parentKeyframes ?? [])
    .filter((item: any) => Number.isFinite(Number(item?.frame)))
    .sort((a: any, b: any) => Number(a.frame) - Number(b.frame));
  let parentId = typeof props.parentId === 'string' ? props.parentId : '';
  for (const keyframe of keyframes) {
    if (absoluteFrame >= Number(keyframe.frame)) parentId = typeof keyframe.parentId === 'string' ? keyframe.parentId : '';
  }
  return parentId;
}

function sceneAssetId(item: any, index: number): string {
  return String(item.id ?? item.entityId ?? item.sceneId ?? `${item.widget || item.widgetType || 'asset'}_${index + 1}`);
}

function applyParentDelta(local: ResolvedTransform, parentAtBase: ResolvedTransform, parentNow: ResolvedTransform, mode: ParentMode): ResolvedTransform {
  const angle = ((parentNow.rotateDeg - parentAtBase.rotateDeg) * Math.PI) / 180;
  const ratioX = parentAtBase.scaleX === 0 ? 1 : parentNow.scaleX / parentAtBase.scaleX;
  const ratioY = parentAtBase.scaleY === 0 ? 1 : parentNow.scaleY / parentAtBase.scaleY;
  const relativeX = (local.x - parentAtBase.x) * ratioX;
  const relativeY = (local.y - parentAtBase.y) * ratioY;
  const rotatedX = relativeX * Math.cos(angle) - relativeY * Math.sin(angle);
  const rotatedY = relativeX * Math.sin(angle) + relativeY * Math.cos(angle);
  const usesPosition = mode === 'all' || mode === 'position';
  const usesScale = mode === 'all' || mode === 'scale';
  const usesRotation = mode === 'all' || mode === 'rotation';
  const usesOpacity = mode === 'all' || mode === 'opacity';
  return {
    x: usesPosition ? parentNow.x + rotatedX : local.x,
    y: usesPosition ? parentNow.y + rotatedY : local.y,
    scaleX: usesScale ? local.scaleX * ratioX : local.scaleX,
    scaleY: usesScale ? local.scaleY * ratioY : local.scaleY,
    rotateDeg: usesRotation ? local.rotateDeg + parentNow.rotateDeg - parentAtBase.rotateDeg : local.rotateDeg,
    opacity: usesOpacity ? local.opacity * (parentAtBase.opacity === 0 ? 1 : parentNow.opacity / parentAtBase.opacity) : local.opacity,
  };
}

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
  const currentFrame = useCurrentFrame();
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

        const localProps = getSafeProps(normalizedWidgetKey, item.props);
        const localTransform = resolveTransform(normalizedWidgetKey, localProps, currentFrame);
        const findWorldTransform = (sceneIndex: number, frame: number, stack: Set<number>): ResolvedTransform => {
          const currentItem = scenes[sceneIndex];
          const currentWidget = String(currentItem?.widget || currentItem?.widgetType || '').toUpperCase();
          const currentProps = getSafeProps(currentWidget, currentItem?.props);
          const currentLocal = resolveTransform(currentWidget, currentProps, frame);
          if (stack.has(sceneIndex)) return currentLocal;
          const nextStack = new Set(stack);
          nextStack.add(sceneIndex);
          const parentId = resolveParentId(currentProps, frame);
          const parentIndex = scenes.findIndex((candidate, candidateIndex) => candidateIndex !== sceneIndex && sceneAssetId(candidate, candidateIndex) === parentId);
          if (parentIndex < 0) return currentLocal;
          const parentItem = scenes[parentIndex];
          const parentBaseFrame = Number(parentItem.startFrame ?? parentItem.start ?? 0);
          const parentAtBase = findWorldTransform(parentIndex, parentBaseFrame, nextStack);
          const parentNow = findWorldTransform(parentIndex, frame, nextStack);
          const requestedMode = currentProps.parentMode;
          const mode: ParentMode = ['all', 'position', 'scale', 'rotation', 'opacity'].includes(requestedMode) ? requestedMode : 'all';
          return applyParentDelta(currentLocal, parentAtBase, parentNow, mode);
        };
        const worldTransform = findWorldTransform(i, currentFrame, new Set());
        const parentDelta = {
          x: worldTransform.x - localTransform.x,
          y: worldTransform.y - localTransform.y,
          scaleX: localTransform.scaleX === 0 ? 1 : worldTransform.scaleX / localTransform.scaleX,
          scaleY: localTransform.scaleY === 0 ? 1 : worldTransform.scaleY / localTransform.scaleY,
          rotateDeg: worldTransform.rotateDeg - localTransform.rotateDeg,
          opacity: localTransform.opacity === 0 ? 1 : worldTransform.opacity / localTransform.opacity,
        };
        const isIndustrial = normalizedWidgetKey === 'PALLET' || normalizedWidgetKey === 'OIL_DRUM';
        const renderProps = isIndustrial
          ? { ...localProps, x: localTransform.x, y: localTransform.y, scaleX: localTransform.scaleX, scaleY: localTransform.scaleY, rotateDeg: localTransform.rotateDeg, opacity: localTransform.opacity }
          : localProps;
        const hasParentDelta = Boolean(resolveParentId(localProps, currentFrame));

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
                  <div
                    style={hasParentDelta ? {
                      width: '100%',
                      height: '100%',
                      transform: `translate(${parentDelta.x}px, ${parentDelta.y}px) rotate(${parentDelta.rotateDeg}deg) scale(${parentDelta.scaleX}, ${parentDelta.scaleY})`,
                      transformOrigin: `${localTransform.x}px ${localTransform.y}px`,
                      opacity: parentDelta.opacity,
                    } : undefined}
                  >
                    <WidgetComponent
                      {...renderProps}
                      timelineStartFrame={item.startFrame}
                    />
                  </div>
                </WidgetErrorBoundary>
              </div>
            </AbsoluteFill>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
