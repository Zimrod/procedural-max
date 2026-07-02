// src/remotion/MyComp/TypewriterRig.tsx
import React, { useMemo } from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';

type Props = {
  text?: string;
  boxWidth?: number;
  boxHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  cursorColor?: string;
  durationInFrames?: number;
};

export const TypewriterRig: React.FC<Props> = ({
  text = "Now the component won't crash if text is missing or undefined.",
  boxWidth = 600,
  boxHeight = 90,
  fontSize = 36,
  fontFamily = 'calibri, sans-serif',
  textColor = '#333',
  backgroundColor = '#f5f5f5',
  cursorColor = '#333',
  durationInFrames = 120, // 💡 Default reference total running sequence size
}) => {
  const frame = useCurrentFrame();

  // Guard: if text is not a string or empty, just show empty box
  const safeText = typeof text === 'string' ? text : '';
  const totalChars = safeText.length;

  // 💡 DYNAMIC TIMING CALCULATOR
  // Allocates structural phases dynamically relative to durationInFrames
  const { startDelay, typingDuration } = useMemo(() => {
    const delay = Math.round(durationInFrames * 0.15); // 15% intro padding cushion
    const duration = Math.round(durationInFrames * 0.70); // 70% typing allocation window
    return {
      startDelay: delay,
      typingDuration: Math.max(1, duration),
    };
  }, [durationInFrames]);

  // 💡 CALIBRATE TEXT DENSITY SPEEDS
  // Calculates exactly how many characters must drop per frame to complete perfectly in time
  const charsPerFrame = useMemo(() => {
    if (totalChars === 0) return 0;
    return totalChars / typingDuration;
  }, [totalChars, typingDuration]);

  // Calculate elapsed characters based on the dynamic pacing constraints
  const framesSinceStart = Math.max(0, frame - startDelay);
  const visibleChars = Math.min(totalChars, Math.floor(framesSinceStart * charsPerFrame));
  const typedText = safeText.slice(0, visibleChars);

  // Simple width estimation (fallback to character count if canvas not available)
  const measureText = (str: string) => {
    if (typeof document === 'undefined') return str.length * fontSize * 0.6;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return str.length * fontSize * 0.6;
    ctx.font = `${fontSize}px ${fontFamily}`;
    return ctx.measureText(str).width;
  };

  const textWidth = measureText(typedText);
  let scrollX = 0;
  if (textWidth > boxWidth - 20) {
    scrollX = textWidth - (boxWidth - 30);
  }
  scrollX = Math.max(0, scrollX);

  // Dynamic cursor blink cycle matching current project target parameters
  const cursorVisible = Math.floor(frame / 15) % 2 === 0;

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: boxWidth,
          height: boxHeight,
          backgroundColor,
          borderRadius: 8,
          border: '1px solid #ccc',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            whiteSpace: 'nowrap',
            fontFamily,
            fontSize,
            color: textColor,
            transform: `translateX(-${scrollX}px)`,
            transition: 'transform 0.05s linear',
          }}
        >
          {typedText}
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: fontSize * 0.8,
              backgroundColor: cursorColor,
              marginLeft: 2,
              opacity: cursorVisible ? 1 : 0,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};