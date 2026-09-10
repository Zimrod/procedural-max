// src/graphics/Main.tsx
import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  staticFile,
  delayRender,
  continueRender,
  // useVideoConfig, // 💡 Pull native configurations straight from Root mount
} from 'remotion';
import { loadFont } from '@remotion/fonts';
// import { CaptioningDemo } from './CaptioningDemo-primitives';
import { VoiceoverScene } from './VoiceoverScene';
import { AudioConfig, AudioLayers } from './AudioLayers';

type Props = {
  captions?: { word: string; start: number; end: number; }[];
  scenes?: any[];
  scene_config?: any[]; // <-- Add backend key
  theme?: any;
  audioUrl?: string;
  voiceover_url?: string; // <-- Add backend key
  audioVersion?: number;
  audioConfig?: AudioConfig;
};

export const Main: React.FC<Props> = ({
  captions = [],
  scenes: scenesProp,
  scene_config,
  theme = {},
  audioUrl: audioUrlProp = "",
  voiceover_url = "",
  audioVersion = 0,
  audioConfig,
}) => {
  // Normalize incoming backend keys with frontend fallbacks
  const scenes = scenesProp || scene_config || [];
  const resolvedAudioUrl = audioUrlProp || voiceover_url || "";

  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    const handle = delayRender('Loading Font');
    loadFont({
      family: 'Rubik',
      url: staticFile('fonts/Rubik/Rubik-Regular.ttf'),
      weight: '400',
    }).then(() => {
      setFontLoaded(true);
      continueRender(handle);
    }).catch(() => continueRender(handle));
  }, []);

  if (!fontLoaded) return null;

  const resolvedAudioConfig = audioConfig || (resolvedAudioUrl ? {
    voUrl: resolvedAudioUrl,
    voVolume: 1,
    bgmVolume: 0,
    masterVolume: 1,
    autoDucking: false,
  } : undefined);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060a12" }}>
      <VoiceoverScene scenes={scenes} theme={theme} />
      {resolvedAudioConfig && <AudioLayers audioConfig={resolvedAudioConfig} />}
    </AbsoluteFill>
  );
};