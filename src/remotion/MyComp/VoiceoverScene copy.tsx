// src/remotion/MyComp/VoiceoverScene.tsx
import React, { useEffect, useState } from 'react';
import { AbsoluteFill, Sequence, continueRender, delayRender } from 'remotion';
import { widgetComponentRegistry } from '../../core/widgetRegistry';

type SceneConfigItem = {
  widget: string;
  startFrame: number;
  durationFrames: number;
  props: Record<string, any>;
};

export const VoiceoverScene: React.FC = () => {
  const [config, setConfig] = useState<SceneConfigItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = delayRender('Loading scene_config.json');
    fetch('/scene_config.json')
      .then(res => {
        if (!res.ok) throw new Error('Config not found');
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setReady(true);
        continueRender(handle);
      })
      .catch(err => {
        console.warn('No scene_config.json found, using empty config', err);
        setConfig([]);
        setReady(true);
        continueRender(handle);
      });
  }, []);

  if (!ready) return null;

  return (
    <AbsoluteFill>
      {config.map((item, i) => {
        const WidgetComponent = widgetComponentRegistry[item.widget];
        if (!WidgetComponent) return null;
        return (
          <Sequence
            key={i}
            from={item.startFrame}
            durationInFrames={item.durationFrames}
          >
            <WidgetComponent {...item.props} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};