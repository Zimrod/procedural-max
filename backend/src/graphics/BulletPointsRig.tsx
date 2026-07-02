// src/remotion/MyComp/BulletPointsRig.tsx
import React, { useMemo } from "react";
import { 
  useCurrentFrame, 
  interpolate, 
  AbsoluteFill, 
  Easing 
} from "remotion";

type BulletItemProps = {
  readonly text: string;
  readonly itemIndex: number;
  readonly totalItems: number;
  readonly fontSize: number;
  readonly bulletColor: string;
  readonly textColor: string;
  readonly startFrameOffset: number;
  readonly durationInFrames: number;
};

const BulletItem: React.FC<BulletItemProps> = ({
  text,
  itemIndex,
  totalItems,
  fontSize,
  bulletColor,
  textColor,
  startFrameOffset,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  // 💡 DETERMINISTIC SEQUENCE TIMELINE CALCULATOR
  const activeDuration = durationInFrames - startFrameOffset;
  
  // Distribute the entrances across the first 50% of the active window
  const totalStaggerWindow = activeDuration * 0.50;
  const itemStartFrame = startFrameOffset + (itemIndex / Math.max(1, totalItems)) * totalStaggerWindow;

  // Each item gets the remaining 50% of the active window to fully reveal and settle
  const itemLifespan = activeDuration * 0.50;

  // Kinetic slide/fade curve
  const revealProgress = interpolate(
    frame,
    [itemStartFrame, itemStartFrame + itemLifespan * 0.45], 
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.bezier(0.16, 1, 0.3, 1)), 
    }
  );

  // Structural positional vectors
  const translateX = interpolate(revealProgress, [0, 1], [-40, 0]);
  const opacity = interpolate(revealProgress, [0, 0.7], [0, 1]);
  const scale = interpolate(revealProgress, [0, 0.8, 1], [0.93, 1.02, 1]);
  
  // 💡 ANTIALIASING RENDER PATCH: Calculate an explicit blur factor
  const blurFactor = interpolate(revealProgress, [0, 0.8], [12, 0]);
  
  // Completely strip out the filter string when it hits 0 to avoid browser subpixel rendering traps
  const filterString = blurFactor > 0.1 ? `blur(${blurFactor}px)` : undefined;

  // Tokenize text into whole word nodes
  const words = useMemo(() => text.split(" "), [text]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: `${fontSize * 0.45}px`,
        opacity,
        transform: `translateX(${translateX}px) scale(${scale})`,
        filter: filterString,
        WebkitFontSmoothing: "antialiased", // Forces high-fidelity subpixel antialiasing profiles
        MozOsxFontSmoothing: "grayscale",
        willChange: "transform, opacity", // Streamlines rasterization pipelines
      }}
    >
      {/* THE BULLET INDICATOR GRAPHIC */}
      <span
        style={{
          color: bulletColor,
          fontSize: `${fontSize * 1.1}px`,
          lineHeight: 1,
          userSelect: "none",
          marginTop: `${fontSize * 0.05}px`,
        }}
      >
        ✦
      </span>

      {/* TEXT FLOW CONTAINER WITH INNER WORD PROTECTION */}
      <div
        style={{
          color: textColor,
          display: "flex",
          flexWrap: "wrap",
          columnGap: "0px",
          rowGap: `${fontSize * 0.15}px`,
        }}
      >
        {words.map((word, wordIdx) => (
          <span
            key={`word-${wordIdx}`}
            style={{
              display: "inline-block",
              whiteSpace: "nowrap", 
              marginRight: `${fontSize * 0.26}px`, 
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
};

type RigProps = {
  readonly items?: string[];
  readonly fontSize?: number;
  readonly fontWeight?: string | number;
  readonly fontFamily?: string;
  readonly itemGap?: number;
  
  // Custom System Theme Injections
  readonly textColor?: string;
  readonly bulletColor?: string;
  readonly backgroundColor?: string;

  // Master Timelines
  readonly startFrameOffset?: number;
  readonly durationInFrames?: number; 
};

export const BulletPointsRig: React.FC<RigProps> = ({
  items = [
    "Architected with fully decoupled configuration properties",
    "Word-wrapped container structures secure clean line breaks",
    "Deterministic timeline engines scale relative to video configurations",
  ],
  fontSize = 38,
  fontWeight = "600",
  fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  itemGap = 36,
  textColor = "#f3f4f6",
  bulletColor = "#38bdf8", 
  backgroundColor = "#05070b",
  startFrameOffset = 12,
  durationInFrames = 75,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
          fontWeight,
          lineHeight: "1.5",
          display: "flex",
          flexDirection: "column",
          gap: `${itemGap}px`,
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {items.map((text, index) => (
          <BulletItem
            key={`bullet-${index}`}
            text={text}
            itemIndex={index}
            totalItems={items.length}
            fontSize={fontSize}
            bulletColor={bulletColor}
            textColor={textColor}
            startFrameOffset={startFrameOffset}
            durationInFrames={durationInFrames}
          />
        ))}
      </div>
    </AbsoluteFill>
  );
};