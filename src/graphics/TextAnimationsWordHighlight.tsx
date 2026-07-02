// src/remotion/MyComp/TextAnimationsWordHighlight.tsx
import { loadFont } from '@remotion/google-fonts/Inter';
import React, { useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const { fontFamily } = loadFont();

type Props = {
  // Content & Target Configs
  text?: string;
  highlightWord?: string;
  
  // Styling Parameters
  fontSize?: number;
  fontWeight?: number;
  colorBg?: string;
  colorText?: string;
  colorHighlight?: string;
  durationInFrames?: number;
};

const Highlight: React.FC<{
  word: string;
  color: string;
  delay: number;
  durationInFrames: number;
}> = ({ word, color, delay, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Highlight background expansion spring driver
  const highlightProgress = spring({
    fps,
    frame,
    config: { damping: 200 },
    delay,
    durationInFrames: Math.max(1, durationInFrames), // Prevent 0-frame spring calculations
  });
  const scaleX = Math.max(0, Math.min(1, highlightProgress));

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '50%',
          height: '1.05em',
          transform: `translateY(-50%) scaleX(${scaleX})`,
          transformOrigin: 'left center',
          backgroundColor: color,
          borderRadius: '0.18em',
          zIndex: 0,
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{word}</span>
    </span>
  );
};

export const TextAnimationsWordHighlight: React.FC<Props> = ({
  text = 'This is Remotion.',
  highlightWord = 'Remotion',
  fontSize = 72,
  fontWeight = 700,
  colorBg = '#ffffff',
  colorText = '#000000',
  colorHighlight = '#A7C7E7',
  durationInFrames = 90, // 💡 Default reference total layout frame duration window
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 💡 DYNAMIC PERCENTAGE TIMING ENGINE
  // Relies on the base reference total of 45 frames:
  // textEntranceStartFrame = 0   -> 0%
  // textEntranceDuration   = 15  -> 15 / 45 = 33.333%
  // highlightStartFrame    = 30  -> 30 / 45 = 66.666%
  // highlightWipeDuration  = 15  -> 15 / 45 = 33.333%
  const {
    textEntranceStartFrame,
    textEntranceDuration,
    highlightStartFrame,
    highlightWipeDuration,
  } = useMemo(() => {
    return {
      textEntranceStartFrame: 0, 
      textEntranceDuration: Math.round((15 / 45) * durationInFrames),
      highlightStartFrame: Math.round((30 / 45) * durationInFrames),
      highlightWipeDuration: Math.round((15 / 45) * durationInFrames),
    };
  }, [durationInFrames]);

  // Tokenize string safely on word boundaries
  const tokens = useMemo(() => {
    if (!text) return [];
    return text.split(/(\w+|\s+|[^\w\s]+)/g).filter(Boolean);
  }, [text]);

  const cleanHighlight = highlightWord.trim().toLowerCase();

  // SIDE REVEAL + SLIDE FADE-IN MECHANICAL DRIVER
  const entryProgress = spring({
    fps,
    frame,
    config: { damping: 15, mass: 0.5, stiffness: 120 },
    delay: textEntranceStartFrame,
    durationInFrames: Math.max(1, textEntranceDuration),
  });

  const entranceOpacity = entryProgress;
  const entranceTranslateX = (1 - entryProgress) * -30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colorBg,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      <div
        style={{
          color: colorText,
          fontSize: `${fontSize}px`,
          fontWeight: fontWeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          whiteSpace: 'pre',
          opacity: entranceOpacity,
          transform: `translateX(${entranceTranslateX}px)`,
        }}
      >
        {tokens.map((token, index) => {
          const isMatch = cleanHighlight !== '' && token.toLowerCase() === cleanHighlight;

          if (isMatch) {
            return (
              <Highlight
                key={`highlight-${index}`}
                word={token}
                color={colorHighlight}
                delay={highlightStartFrame}
                durationInFrames={highlightWipeDuration}
              />
            );
          }

          return <span key={`token-${index}`}>{token}</span>;
        })}
      </div>
    </AbsoluteFill>
  );
};