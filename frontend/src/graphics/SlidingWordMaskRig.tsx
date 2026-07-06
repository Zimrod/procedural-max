// src/remotion/MyComp/SlidingWordMaskRig.tsx
import React, { useMemo } from "react";
import { 
  useCurrentFrame, 
  interpolate, 
  AbsoluteFill, 
  Easing 
} from "remotion";

type RigProps = {
  readonly prefixText: string;     
  readonly wordsToCycle: string[]; 
  
  // Custom Typography & Sizing Selectors
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly fontFamily?: string;
  
  // Full System Environment Theme Properties
  readonly wordColor?: string;     
  readonly baseTextColor?: string; 
  readonly backgroundColor?: string;

  // Master Animation Timelines
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number; 
};

export const SlidingWordMaskRig: React.FC<RigProps> = ({
  prefixText = "We optimize workflows for: ",
  wordsToCycle = ["Agribusiness", "Logistics", "Finance"],
  fontSize = 54,
  fontWeight = "800",
  fontFamily = "lato",
  wordColor = "#10b981", 
  baseTextColor = "#ffffff",
  backgroundColor = "#06090e",
  startFrameOffset = 10,
  durationInFrames = 120, 
}) => {
  const frame = useCurrentFrame();

  const totalCycles = wordsToCycle.length;

  // 1. DETERMINISTIC TIMELINE SCROLL MATRIX
  const { framesPerWord, transitionDuration } = useMemo(() => {
    const activeDuration = durationInFrames - startFrameOffset;
    const computedFramesPerWord = activeDuration / Math.max(1, totalCycles);
    
    return {
      framesPerWord: computedFramesPerWord,
      // Allocate exactly 30% of the word's window to the upward scroll switch execution
      transitionDuration: computedFramesPerWord * 0.30, 
    };
  }, [durationInFrames, startFrameOffset, totalCycles]);

  // Compute a continuous, fluid index pointer representing the upward camera track
  const globalScrollIndex = useMemo(() => {
    const localFrame = frame - startFrameOffset;
    if (localFrame <= 0) return 0;

    const cycleIndex = Math.floor(localFrame / framesPerWord);
    const frameInCycle = localFrame % framesPerWord;

    // Lock completely onto the final word when the cycle sequence exhausts
    if (cycleIndex >= totalCycles - 1) {
      return totalCycles - 1;
    }

    const holdWindow = framesPerWord - transitionDuration;

    if (frameInCycle < holdWindow) {
      // Hold state: Keep target word locked perfectly in focus center
      return cycleIndex;
    } else {
      // Transition state: Snappy list shift acceleration up to the next row item
      const transitionProgress = interpolate(
        frameInCycle,
        [holdWindow, framesPerWord],
        [0, 1],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.bezier(0.25, 1, 0.4, 1)), // Fast click-up velocity curve
        }
      );
      return cycleIndex + transitionProgress;
    }
  }, [frame, startFrameOffset, framesPerWord, transitionDuration, totalCycles]);

  // Structural masking layout dimensions based on standard font scaling ratios
  const maskHeight = fontSize * 1.45;
  const wordWidthMultiplier = fontSize * 0.58;
  const maxWordLength = useMemo(() => {
    return Math.max(...wordsToCycle.map((w) => w.length));
  }, [wordsToCycle]);

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
      <div
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: "16px",
          width: "100%",
          color: baseTextColor,
          textAlign: "center",
        }}
      >
        {/* STATIC PREFIX LABEL */}
        <span style={{ marginRight: "16px", whiteSpace: "pre" }}>
          {prefixText}
        </span>

        {/* HIGH-END LIST-SCROLL MASK WINDOW */}
        <div
          style={{
            display: "inline-block",
            position: "relative",
            height: `${maskHeight}px`, 
            width: `${maxWordLength * wordWidthMultiplier}px`, 
            overflow: "hidden", // Clips old items cleanly out of the box boundaries
            textAlign: "left",
            verticalAlign: "bottom",
          }}
        >
          {wordsToCycle.map((word, index) => {
            // Calculate the spatial layout offset index relative to the active focus index anchor
            const offsetFromFocus = index - globalScrollIndex;

            // Translate list offsets directly into vertical layout pixel metrics
            const translateY = offsetFromFocus * maskHeight;

            // 💡 PROCEDURAL SYMMETRIC OPACITY LAYER
            // Completely transparent when out of frame range (>= 1 or <= -1)
            // Faint and readable while sliding through transition steps (around 0.25 opacity)
            // Fully opaque (1.0) right as it snaps directly into dead center alignment (0)
            const opacity = interpolate(
              offsetFromFocus,
              [-1, -0.65, 0, 0.65, 1],
              [0, 0.22, 1, 0.22, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }
            );

            // Optimization filter to omit non-visible background nodes
            if (Math.abs(offsetFromFocus) >= 1.2) return null;

            return (
              <span
                key={`${word}-${index}`}
                style={{
                  position: "absolute",
                  left: 0,
                  bottom: `${maskHeight * 0.12}px`, // Natural alignment baseline offset
                  width: "100%",
                  color: wordColor,
                  transform: `translateY(${translateY}px)`,
                  opacity: opacity,
                  display: "block",
                  whiteSpace: "nowrap",
                  willChange: "transform, opacity",
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