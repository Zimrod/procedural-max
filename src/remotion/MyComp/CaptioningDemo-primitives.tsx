// src/remotion/MyComp/CaptioningDemo-primitives.tsx
import React, { useMemo, useEffect, useState, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { VOICEOVER_DELAY_SECONDS } from "../../types/constants";

const MAX_LINE_WIDTH = 0.8; // Slightly wider to accommodate smaller text

// src/remotion/MyComp/CaptioningDemo-primitives.tsx

const MAX_WORDS_PER_LINE = 6;
const MAX_WORDS_FOR_LONG_STRINGS = 5;

const groupWordsIntoSegments = (
  words: { word: string; start: number }[],
  fontSize: number,
  videoWidth: number
) => {
  const segments: string[][] = [];
  let currentSegment: string[] = [];

  for (let i = 0; i < words?.length; i++) {
    const wordObj = words[i];
    const wordText = wordObj.word;

    // Detect new sentence: Word is capitalized AND (it's the first word OR there was a gap)
    const isCapitalized = /^[A-Z]/.test(wordText) && wordText.length > 1;
    const timeGap = i > 0 ? wordObj.start - words[i - 1].start : 0;
    const isNewSentence = i === 0 || (isCapitalized && timeGap > 0.5);

    // Rule 1: New sentences always start a new row
    if (isNewSentence && currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
    }

    // Rule 2: Limit words per row (5 for long words, 6 max)
    const currentLimit = currentSegment.some(w => w.length > 7) 
      ? MAX_WORDS_FOR_LONG_STRINGS 
      : MAX_WORDS_PER_LINE;

    if (currentSegment.length >= currentLimit) {
      segments.push(currentSegment);
      currentSegment = [];
    }

    currentSegment.push(wordText);
  }

  if (currentSegment.length > 0) segments.push(currentSegment);
  return segments;
};

export const CaptioningDemo: React.FC<{
  fontSize: number;
  fontFamily: string;
  fontWeight?: number | string;
  color: string;
  highlightColor?: string;
  nonHighlightColor?: string;
  captions: {
    word: string;
    start: number;
    end: number;
  }[];
  tone?: string;
}> = ({
  fontSize,
  fontFamily,
  fontWeight = 700,
  color,
  highlightColor = "#000",
  captions,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const wordRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  
  const [highlightStyle, setHighlightStyle] = useState({
    width: 0,
    height: 0,
    transform: "translate(0px, 0px)",
    opacity: 0,
  });

  const wordsWithFrames = useMemo(() => captions?.map((w) => ({
    ...w,
    // Add the delay to both start and end timestamps[cite: 8, 9]
    startFrame: Math.floor((w.start + VOICEOVER_DELAY_SECONDS) * fps),
    endFrame: Math.floor(w.end * fps),
  })), [captions, fps]);

  // Reduced effective font size for a "general video" look
  const effectiveFontSize = fontSize * 0.6;

  const segments = useMemo(
    () =>
      groupWordsIntoSegments(
        wordsWithFrames?.map((w) => ({
          word: w.word,
          isSentenceEnd: /[.!?]$/.test(w.word) 
        })),
        effectiveFontSize,
        width
      ),
    [wordsWithFrames, effectiveFontSize, width]
  );

  const currentWordIndex = useMemo(() => {
    // 1. Check if the current frame is actively within a word's duration
    const index = wordsWithFrames?.findIndex(
      (w) => frame >= w.startFrame && frame <= w.endFrame
    );

    if (index !== -1) return index;

    // 2. Identify the most recently spoken word
    const lastSpokenIndex = [...(wordsWithFrames || [])]
      .reverse()
      .findIndex((w) => frame >= w.endFrame);

    if (lastSpokenIndex !== -1) {
      const actualIndex = wordsWithFrames.length - 1 - lastSpokenIndex;
      
      // NEW LOGIC: Determine if we are in a "silent gap"
      const isAtEndOfVideo = actualIndex === wordsWithFrames.length - 1;
      const nextWordStart = !isAtEndOfVideo ? wordsWithFrames[actualIndex + 1].startFrame : null;
      
      // If we've passed the final word, or if we are in a gap between words 
      // and the previous word ended a sentence, return -1 to hide
      if (isAtEndOfVideo || wordsWithFrames[actualIndex].word.match(/[.!?]$/)) {
        return -1; 
      }
      
      return actualIndex;
    }

    return -1;
  }, [frame, wordsWithFrames]);

  const currentSegmentIndex = segments?.findIndex((segment, index) => {
    const start = segments.slice(0, index).reduce((acc, seg) => acc + seg?.length, 0);
    const end = start + segment?.length;
    return currentWordIndex >= start && currentWordIndex < end;
  });

  const currentSegment = segments[currentSegmentIndex] || [];
  const startIndexForSegment = segments
    .slice(0, currentSegmentIndex)
    .reduce((acc, seg) => acc + seg?.length, 0);

  useEffect(() => {
    const activeWordEl = wordRefs.current.get(currentWordIndex);
    if (activeWordEl) {
      setHighlightStyle({
        width: activeWordEl.offsetWidth,
        height: activeWordEl.offsetHeight,
        transform: `translate(${activeWordEl.offsetLeft}px, ${activeWordEl.offsetTop}px)`,
        opacity: 1,
      });
    } else {
      setHighlightStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [currentWordIndex, currentSegmentIndex]);

  return (
    <AbsoluteFill>
      {/* Absolute container forced to the bottom */}
      <div
        style={{
          position: 'absolute',
          bottom: height * 0.1, // 10% from the bottom
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily,
          fontSize: effectiveFontSize,
          fontWeight,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'nowrap', // Force single line[cite: 10]
            justifyContent: 'center',
            maxWidth: width * MAX_LINE_WIDTH,
            gap: 8, // Increased gap for readability
            position: 'relative',
            padding: '12px 24px',
            // backgroundColor: 'rgba(0,0,0,0.4)', 
            borderRadius: '3px',
          }}
        >
          {/* Highlight pill */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: highlightStyle.width,
              height: highlightStyle.height,
              backgroundColor: highlightColor,
              borderRadius: '3px',
              transform: highlightStyle.transform,
              opacity: highlightStyle.opacity,
              transition: 'all 0.1s ease-out',
              zIndex: 0,
            }}
          />

          {currentSegment?.map((word, i) => {
            const absoluteIndex = startIndexForSegment + i;
            const isHighlighted = absoluteIndex === currentWordIndex;

            return (
              <span
                key={absoluteIndex}
                ref={(el) => {
                  if (el) wordRefs.current.set(absoluteIndex, el);
                  else wordRefs.current.delete(absoluteIndex);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 4px',
                  borderRadius: '3px',
                  color: isHighlighted ? '#fff' : color,
                  zIndex: 1,
                  position: 'relative',
                  transition: 'color 0.1s ease',
                  // textShadow: '0px 2px 4px rgba(0,0,0,0.5)', // Better contrast
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};