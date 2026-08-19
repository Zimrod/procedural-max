// src/graphics/TextAnimationsWordHighlight.tsx
import { loadFont } from '@remotion/google-fonts/Inter';
import React, { useMemo } from 'react';
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const { fontFamily } = loadFont();

type Props = {
  text?: string;
  highlightWord?: string;
  fontSize?: number;
  fontWeight?: number;
  
  // Standardized Theme Color Properties
  backgroundColor?: string;
  textColor?: string;
  highlightColor?: string;
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

  const highlightProgress = spring({
    fps,
    frame,
    config: { damping: 200 },
    delay,
    durationInFrames: Math.max(1, durationInFrames),
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
  backgroundColor = '#ffffff',
  textColor = '#000000',
  highlightColor = '#A7C7E7',
  durationInFrames = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  const tokens = useMemo(() => {
    if (!text) return [];
    return text.split(/(\w+|\s+|[^\w\s]+)/g).filter(Boolean);
  }, [text]);

  const cleanHighlight = highlightWord.trim().toLowerCase();

  const entryProgress = spring({
    fps,
    frame,
    config: { damping: 15, mass: 0.5, stiffness: 120 },
    delay: textEntranceStartFrame,
    durationInFrames: Math.max(1, textEntranceDuration),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      <div
        style={{
          color: textColor,
          fontSize: `${fontSize}px`,
          fontWeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          whiteSpace: 'pre',
          opacity: entryProgress,
          transform: `translateX(${(1 - entryProgress) * -30}px)`,
        }}
      >
        {tokens.map((token, index) => {
          const isMatch = cleanHighlight !== '' && token.toLowerCase() === cleanHighlight;

          if (isMatch) {
            return (
              <Highlight
                key={`highlight-${index}`}
                word={token}
                color={highlightColor}
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