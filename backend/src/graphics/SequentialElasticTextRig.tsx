// src/remotion/MyComp/SequentialElasticTextRig.tsx
import React, { useMemo } from "react";
import { 
  useCurrentFrame, 
  interpolate, 
  AbsoluteFill, 
  Easing 
} from "remotion";

type LetterProps = {
  readonly char: string;
  readonly globalIndex: number;
  readonly totalChars: number;
  readonly size: number;
  readonly baseColor: string;
  readonly startFrameOffset: number;
  readonly durationInFrames: number;
};

const ElasticLetter: React.FC<LetterProps> = ({
  char,
  globalIndex,
  totalChars,
  size,
  baseColor,
  startFrameOffset,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // 💡 TOTAL TIME BUDGET CALCULATOR (Linear Percentage Remapping)
  const activeDuration = durationInFrames - startFrameOffset;
  
  // Allocate the first 40% of the active scene timeline for staggering character entry steps
  const totalStaggerWindow = activeDuration * 0.40;
  const letterStartFrame = startFrameOffset + (globalIndex / Math.max(1, totalChars)) * totalStaggerWindow;

  // Each character has the remaining 60% of the active window to fully execute its spring cycle
  const singleLetterLifespan = activeDuration * 0.60;
  const letterEndFrame = letterStartFrame + singleLetterLifespan;

  // 💡 ELASTIC EASING SOLVER
  // Replaces uncalibrated spring physics with an explicit timeline bounded elastic curve
  const animationProgress = interpolate(
    frame,
    [letterStartFrame, letterEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.elastic(1.1)), // Bouncy recoil action bound strictly to duration
    }
  );

  // Position, Scaling, and Alpha calculations driven deterministically
  const translateY = interpolate(animationProgress, [0, 1], [size * 0.83, 0]);
  const scale = interpolate(animationProgress, [0, 1], [0, 1]);
  const opacity = interpolate(frame, [letterStartFrame, letterStartFrame + singleLetterLifespan * 0.15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        color: baseColor,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity: opacity,
        transformOrigin: "center bottom", // Anchors scaling to text baseline threshold
        willChange: "transform, opacity",
      }}
    >
      {char}
    </span>
  );
};

type RigProps = {
  readonly textToAnimate: string;
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly fontFamily?: string;
  readonly letterSpacing?: string;
  
  // System Theme Properties
  readonly baseColor?: string;
  readonly backgroundColor?: string;
  
  // Master Animation Timelines
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number; // 💡 MASTER LIMIT: Changing this scales every moving element
};

export const SequentialElasticTextRig: React.FC<RigProps> = ({
  textToAnimate = "DYNAMIC BOUNCE",
  fontSize = 72,
  fontWeight = "900",
  fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  letterSpacing = "-1px",
  baseColor = "#ffffff",
  backgroundColor = "#05070b",
  startFrameOffset = 10,
  durationInFrames = 45,
}) => {
  // Tokenize string layout into word structures to prevent midway line splits
  const words = useMemo(() => {
    return textToAnimate.split(" ");
  }, [textToAnimate]);

  // Map global structural indexing sequences for stagger tracking continuity
  const { wordsWithGlobalIndices, totalChars } = useMemo(() => {
    let currentGlobalIndex = 0;
    const mappedWords = words.map((word) => {
      const chars = word.split("");
      const processedWord = {
        word,
        chars: chars.map((char) => ({
          char,
          globalIndex: currentGlobalIndex++,
        })),
      };
      currentGlobalIndex++; // Buffer spacing lookahead
      return processedWord;
    });
    return { wordsWithGlobalIndices: mappedWords, totalChars: currentGlobalIndex };
  }, [words]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        boxSizing: "border-box",
      }}
    >
      <h1
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          letterSpacing,
          textTransform: "uppercase",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          rowGap: `${fontSize * 0.25}px`, // Dynamic line breaks padding
          columnGap: "0px",
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {wordsWithGlobalIndices.map((wordData, wordIdx) => (
          <span
            key={`word-${wordIdx}`}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap", // Forces entire word structures to stay intact
              marginRight: `${fontSize * 0.28}px`, // Word boundary letter spacing offset
            }}
          >
            {wordData.chars.map(({ char, globalIndex }) => (
              <ElasticLetter
                key={`${char}-${globalIndex}`}
                char={char}
                globalIndex={globalIndex}
                totalChars={totalChars}
                size={fontSize}
                baseColor={baseColor}
                startFrameOffset={startFrameOffset}
                durationInFrames={durationInFrames}
              />
            ))}
          </span>
        ))}
      </h1>
    </AbsoluteFill>
  );
};