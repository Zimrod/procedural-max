// src/remotion/MyComp/Main.tsx
import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  staticFile,
  delayRender,
  continueRender,
  // useVideoConfig, // 💡 Pull native configurations straight from Root mount
} from 'remotion';
import { loadFont } from '@remotion/fonts';
// import { CaptioningDemo } from './CaptioningDemo-primitives';
import { VoiceoverScene } from './VoiceoverScene';

type Props = {
  captions?: { word: string; start: number; end: number; }[];
  scenes?: any[];
  theme?: any;
  audioUrl?: string;
  audioVersion?: number;
};

export const Main: React.FC<Props> = ({
  captions = [],
  scenes = [],
  theme = {},
  audioUrl = "",
  audioVersion = 0,
}) => {
  const [fontLoaded, setFontLoaded] = useState(false);
  
  // 💡 READ THE NEW EXTENDED COMPOSITION DURATION AUTOMATICALLY
  // const { durationInFrames } = useVideoConfig(); 

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

  return (
    <AbsoluteFill style={{ backgroundColor: "#060a12" }}>
      {audioUrl && (
        <Audio src={`${audioUrl}?v=${audioVersion}`} volume={1.0} />
      )}

      {/* Background visual engine spans full layout lifetime */}
      <VoiceoverScene scenes={scenes} theme={theme} />

      {/* 💡 Caption sequence spans the new total buffered duration length safely */}
      {/* {captions.length > 0 && (
        <Sequence durationInFrames={durationInFrames}>
          <CaptioningDemo
            captions={captions}
            fontSize={70}
            fontFamily="Rubik"
            color="#ffffff"
          />
        </Sequence>
      )}  */}
    </AbsoluteFill>
  );
};