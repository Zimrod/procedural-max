// src/remotion/MyComp/SvgDrawInTextRig.tsx
import React, { useMemo } from "react";
import { 
  useCurrentFrame, 
  interpolate, 
  AbsoluteFill,
  Easing
} from "remotion";

// COMPLETE SYSTEM CHARACTER MATRIX (Normalized on a 100x100 space)
const FONT_PATH_DATA: Record<string, string> = {
  A: "M 10 90 L 50 10 L 90 90 M 25 60 L 75 60",
  B: "M 15 10 L 60 10 C 85 10, 85 45, 60 45 L 15 45 M 15 45 L 65 45 C 90 45, 90 90, 15 90 L 15 10",
  C: "M 90 25 C 75 10, 25 10, 10 50 C 10 90, 75 90, 90 75",
  D: "M 15 10 L 55 10 C 90 10, 90 90, 55 90 L 15 90 Z",
  E: "M 90 10 L 15 10 L 15 90 L 90 90 M 15 50 L 75 50",
  F: "M 90 10 L 15 10 L 15 90 M 15 50 L 70 50",
  G: "M 90 25 C 75 10, 25 10, 10 50 C 10 90, 75 90, 90 70 L 90 50 L 50 50",
  H: "M 15 10 L 15 90 M 85 10 L 85 90 M 15 50 L 85 50",
  I: "M 25 10 L 75 10 M 50 10 L 50 90 M 25 90 L 75 90",
  J: "M 75 10 L 75 70 C 75 90, 25 90, 25 70",
  K: "M 20 10 L 20 90 M 80 10 L 20 50 L 85 90",
  L: "M 20 10 L 20 90 L 85 90",
  M: "M 10 90 L 10 10 L 50 55 L 90 10 L 90 90",
  N: "M 15 90 L 15 10 L 85 90 L 85 10",
  O: "M 50 10 C 90 10, 90 90, 50 90 C 15 90, 15 10, 50 10 Z",
  P: "M 15 90 L 15 10 L 60 10 C 85 10, 85 50, 60 50 L 15 50",
  Q: "M 50 10 C 85 10, 85 80, 50 80 C 15 80, 15 10, 50 10 Z M 70 70 L 90 90",
  R: "M 15 90 L 15 10 L 60 10 C 85 10, 85 48, 60 48 L 15 48 M 55 48 L 85 90",
  S: "M 85 25 C 75 10, 25 10, 15 35 C 15 60, 85 55, 85 75 C 85 95, 30 95, 15 75",
  T: "M 10 10 L 90 10 M 50 10 L 50 90",
  U: "M 15 10 L 15 65 C 15 90, 85 90, 85 65 L 85 10",
  V: "M 10 10 L 50 90 L 90 10",
  W: "M 10 10 L 25 90 L 50 40 L 75 90 L 90 10",
  X: "M 15 10 L 85 90 M 85 10 L 15 90",
  Y: "M 10 10 L 50 50 L 90 10 M 50 50 L 50 90",
  Z: "M 15 10 L 85 10 L 15 90 L 85 90",
  "1": "M 30 25 L 50 10 L 50 90 M 30 90 L 70 90",
  "2": "M 20 30 C 20 10, 80 10, 80 35 C 80 60, 20 90, 20 90 L 80 90",
  "3": "M 20 20 L 80 20 L 45 50 C 75 50, 85 90, 45 90 C 25 90, 20 75, 20 75",
  "4": "M 70 90 L 70 10 L 15 60 L 85 60",
  "5": "M 80 10 L 20 10 L 20 45 C 40 40, 85 45, 80 75 C 75 95, 20 95, 20 75",
  "6": "M 75 15 C 50 10, 15 40, 15 60 C 15 85, 75 85, 75 60 C 75 40, 20 40, 15 60",
  "7": "M 15 10 L 85 10 L 40 90",
  "8": "M 50 50 C 80 50, 80 10, 50 10 C 20 10, 20 50, 50 50 C 80 50, 80 90, 50 90 C 20 90, 20 50, 50 50 Z",
  "9": "M 85 40 C 80 15, 25 15, 25 40 C 25 60, 75 60, 85 40 L 85 65 C 85 85, 45 90, 20 85",
  "0": "M 50 10 C 85 10, 85 90, 50 90 C 15 90, 15 10, 50 10 Z M 25 75 L 75 25",
  "!": "M 50 10 L 50 65 M 50 85 L 50 90",
  "@": "M 85 50 C 85 85, 15 85, 15 50 C 15 15, 85 15, 85 45 C 85 65, 55 65, 55 50 C 55 40, 70 40, 70 50",
  "#": "M 35 10 L 25 90 M 75 10 L 65 90 M 10 35 L 90 35 M 10 65 L 90 65",
  "$": "M 50 5 L 50 95 M 80 25 C 70 10, 30 10, 20 30 C 20 55, 80 50, 80 70 C 80 90, 30 90, 20 75",
  "%": "M 20 20 L 80 80 M 30 25 C 40 25, 40 40, 30 40 C 20 40, 20 25, 30 25 Z M 70 65 C 80 65, 80 80, 70 80 C 60 80, 60 65, 70 65 Z",
  "&": "M 80 85 C 50 95, 35 70, 55 50 C 35 40, 35 15, 55 15 C 75 15, 65 40, 45 55 L 80 90",
  "*": "M 50 20 L 50 80 M 24 35 L 76 65 M 24 65 L 76 35",
  "(": "M 70 10 C 30 30, 30 70, 70 90",
  ")": "M 30 10 C 70 30, 70 70, 30 90",
  "-": "M 20 50 L 80 50",
  "+": "M 50 20 L 50 80 M 20 50 L 80 50",
  "=": "M 20 35 L 80 35 M 20 65 L 80 65",
  "?": "M 20 30 C 20 10, 80 10, 80 40 C 80 60, 50 55, 50 70 M 50 85 L 50 90",
  ".": "M 50 85 A 2 2 0 1 1 49.99 85",
  ",": "M 50 80 L 50 90 L 42 98",
  ":": "M 50 25 A 2 2 0 1 1 49.99 25 M 50 75 A 2 2 0 1 1 49.99 75",
  "/": "M 20 90 L 80 10",
};

type AnimatedLetterProps = {
  readonly char: string;
  readonly globalIndex: number;
  readonly totalChars: number; // Used to divide stagger milestones perfectly
  readonly size: number;
  readonly strokeColor: string;
  readonly fillColor: string;
  readonly startFrameOffset: number;
  readonly durationInFrames: number;
};

const AnimatedLetter: React.FC<AnimatedLetterProps> = ({
  char,
  globalIndex,
  totalChars,
  size,
  strokeColor,
  fillColor,
  startFrameOffset,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const pathData = FONT_PATH_DATA[char.toUpperCase()] || "";

  // 💡 TOTAL TIME BUDGET CALCULATOR (Linear Percentage Remapping)
  const activeDuration = durationInFrames - startFrameOffset;
  
  // Allocate the first 40% of the active window purely for staggering entry steps
  const totalStaggerWindow = activeDuration * 0.40;
  // Each letter has an exact frame start index clamped into the stagger timeline limit
  const letterStartFrame = startFrameOffset + (globalIndex / Math.max(1, totalChars)) * totalStaggerWindow;

  // Each letter gets the remaining 60% of the active scene timeline to animate itself completely
  const singleLetterLifespan = activeDuration * 0.60;
  const letterEndFrame = letterStartFrame + singleLetterLifespan;

  // 💡 OUTLINE DRAWING TIMELINE MAPPER
  // Outline finishes drawing halfway through its individual letter lifespan
  const drawEndFrame = letterStartFrame + singleLetterLifespan * 0.50;
  const drawProgress = interpolate(
    frame,
    [letterStartFrame, drawEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.bezier(0.25, 1, 0.5, 1)), // Custom smooth fluid curve
    }
  );
  const strokeDashoffset = interpolate(drawProgress, [0, 1], [100, 0]);

  // 💡 COLOR FILL SPLASH & SCALE TIMELINE MAPPER
  // Triggers right as the line drawing crosses the 50% completion mark, finishing exactly at letterEndFrame
  const fillStartFrame = letterStartFrame + singleLetterLifespan * 0.25;
  const fillProgress = interpolate(
    frame,
    [fillStartFrame, letterEndFrame],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  const fillOpacity = interpolate(fillProgress, [0, 1], [0, 1]);
  const letterScale = interpolate(fillProgress, [0, 1], [0.90, 1]);

  const boxWidth = size * 0.9;
  const strokeThickness = Math.max(2, (size / 100) * 4);
  const glowDeviation = Math.max(1, (size / 100) * 3);

  if (!pathData) {
    return <div style={{ width: boxWidth * 0.5 }} />;
  }

  return (
    <div
      style={{
        width: `${boxWidth}px`,
        height: `${size}px`,
        transform: `scale(${letterScale})`,
        transformOrigin: "center center",
        display: "inline-block",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id={`neon-glow-${globalIndex}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={glowDeviation} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path
          d={pathData}
          fill={fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="100"
          strokeDashoffset={strokeDashoffset}
          filter={fillOpacity < 0.9 ? `url(#neon-glow-${globalIndex})` : undefined}
          style={{
            transition: "fill-opacity 0.1s ease-in-out",
          }}
        />
      </svg>
    </div>
  );
};

type RigProps = {
  readonly textToAnimate: string;
  readonly size?: number;
  readonly strokeColor?: string; 
  readonly fillColor?: string;   
  readonly backgroundColor?: string;
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number;
};

export const SvgDrawInTextRig: React.FC<RigProps> = ({
  textToAnimate = "MATRIX 2026!", 
  size = 100,
  strokeColor = "#38bdf8", 
  fillColor = "#ffffff00",   
  backgroundColor = "#030712", 
  startFrameOffset = 10,
  durationInFrames = 50, // 💡 Changing this now perfectly squishes or stretches all animations
}) => {
  const words = useMemo(() => {
    return textToAnimate.split(" ");
  }, [textToAnimate]);

  // Calculate global character mappings and look ahead to find total system length
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
      currentGlobalIndex++; // Spacer offset index buffer
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
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          rowGap: `${size * 0.25}px`,
          columnGap: "0px",
          flexWrap: "wrap",
          width: "100%",
          maxWidth: "1400px",
        }}
      >
        {wordsWithGlobalIndices.map((wordData, wordIdx) => (
          <div
            key={`word-${wordIdx}`}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap",
              marginRight: `${size * 0.45}px`,
            }}
          >
            {wordData.chars.map(({ char, globalIndex }) => (
              <AnimatedLetter
                key={`${char}-${globalIndex}`}
                char={char}
                globalIndex={globalIndex}
                totalChars={totalChars}
                size={size}
                strokeColor={strokeColor}
                fillColor={fillColor}
                startFrameOffset={startFrameOffset}
                durationInFrames={durationInFrames}
              />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};