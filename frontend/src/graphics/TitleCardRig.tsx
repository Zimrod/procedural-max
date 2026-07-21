// src/remotion/MyComp/TitleCardRig.tsx

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type Props = {
  title: string;
  subtitle?: string;

  // Layout
  align?: "left" | "center";
  maxWidth?: number;

  // Typography
  titleFontSize?: number;
  subtitleFontSize?: number;
  fontFamily?: string;

  // Styling
  titleColor?: string;
  subtitleColor?: string;
  accentColor?: string;
  backgroundColor?: string;

  // Motion
  revealDirection?: "up" | "down" | "left" | "right";
  cinematic?: boolean;

  // 💡 SINGLE TIMING PROP: All phase parameters calculate straight from this boundary window
  durationInFrames?: number;
};

export const TitleCardRig: React.FC<Props> = ({
  title,
  subtitle,

  align = "center",
  maxWidth = 1200,

  titleFontSize = 110,
  subtitleFontSize = 30,
  fontFamily = "Inter, Helvetica, Arial, sans-serif",

  titleColor = "#FFFFFF",
  subtitleColor = "rgba(255,255,255,0.72)",
  accentColor = "#4ECDC4",
  backgroundColor = "#05070B",

  revealDirection = "up",
  cinematic = true,
  durationInFrames = 45, 
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Split title into individual characters for staggered tracking
  const chars = useMemo(() => title.split(""), [title]);

  // 💡 CENTRAL TIMING CALCULATOR (Percentage-based scales mapped from a reference 90 frames total)
  // Accent Line Start Delay: 6 frames  -> (6 / 90) * durationInFrames
  // Accent Line Expansion: 18 frames   -> (18 / 90) * durationInFrames
  // Subtitle Delay: 28 frames          -> (28 / 90) * durationInFrames
  // Subtitle Wipe: 22 frames            -> (22 / 90) * durationInFrames
  const {
    charStaggerStep,
    charDuration,
    accentStartDelay,
    accentDuration,
    subtitleStartDelay,
    subtitleDuration,
  } = useMemo(() => {
    const baseDuration = Math.max(10, Math.round((24 / 90) * durationInFrames));
    // 💡 Calculate stagger so that the last character finishes exactly at durationInFrames
    // totalDuration = (chars.length - 1) * charStaggerStep + charDuration
    // Solve for charStaggerStep: charStaggerStep = (durationInFrames - charDuration) / (chars.length - 1)
    const availableTimeForStagger = Math.max(1, durationInFrames - baseDuration);
    const calculatedStagger = chars.length > 1 
      ? Math.max(1, Math.floor(availableTimeForStagger / (chars.length - 1)))
      : 1;
    
    return {
      charStaggerStep: calculatedStagger,
      charDuration: baseDuration,
      accentStartDelay: Math.round((6 / 90) * durationInFrames), // 💡 Derived dynamically from your `frame - 6` requirement
      accentDuration: Math.max(8, Math.round((18 / 90) * durationInFrames)),
      subtitleStartDelay: Math.round((28 / 90) * durationInFrames),
      subtitleDuration: Math.max(10, Math.round((22 / 90) * durationInFrames)),
    };
  }, [durationInFrames, chars.length]);

  // 💡 ACCENT SPRING DRIVER WITH YOUR CONFIG VALUES
  const accentSpring = spring({
    fps,
    frame: frame - accentStartDelay,
    config: { damping: 12, stiffness: 120 }, // 💡 Applied your damping and stiffness constraints perfectly
  });

  // Subtitle Animation Spring Driver
  const subtitleSpring = spring({
    fps,
    frame,
    config: { damping: 16, mass: 0.6, stiffness: 110 },
    delay: subtitleStartDelay,
    durationInFrames: subtitleDuration,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        justifyContent: "center",
        padding: "0 90px",
        fontFamily,
      }}
    >
      <div
        style={{
          maxWidth,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: align === "center" ? "center" : "flex-start",
        }}
      >

        {/* 💡 THE ACCENT BAR (UPDATED MATCHING YOUR REQUIRED EXPERIMENTAL STYLING) */}
        <div
          style={{
            width: interpolate(accentSpring, [0, 1], [0, 180]), // 💡 Dynamic scale up to 180px
            height: 6,
            borderRadius: 999,
            background: accentColor,
            marginBottom: 40, // 💡 Spacing to pad baseline metrics cleanly
            transformOrigin: align === "center" ? "center" : "left",
            boxShadow: `0 0 40px ${accentColor}`, // 💡 High elegance neon blur bloom glow
          }}
        />
        
        {/* TITLE BLOCK */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: align === "center" ? "center" : "flex-start",
            fontSize: titleFontSize,
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          {chars.map((char, index) => {
            const charDelay = index * charStaggerStep;

            const charSpring = spring({
              fps,
              frame,
              config: { damping: 14, mass: 0.5, stiffness: 140 },
              delay: charDelay,
              durationInFrames: charDuration,
            });

            const opacity = interpolate(charSpring, [0, 1], [0, 1]);
            const blur = interpolate(charSpring, [0, 1], [12, 0]);
            
            const y = interpolate(
              charSpring,
              [0, 1],
              [revealDirection === "up" ? 60 : revealDirection === "down" ? -60 : 0, 0]
            );
            
            const rotateX = interpolate(
              charSpring,
              [0, 1],
              [revealDirection === "up" ? 45 : revealDirection === "down" ? -45 : 0, 0]
            );

            return (
              <span
                key={`char-${index}`}
                style={{
                  display: char === " " ? "inline" : "inline-block",
                  whiteSpace: "pre",
                  position: "relative",
                  fontWeight: 900,
                  fontFamily,
                  color: titleColor,
                  opacity,
                  filter: `blur(${blur}px)`,
                  transform: `translateY(${y}px) rotateX(${rotateX}deg)`,
                  transformStyle: "preserve-3d",
                  textShadow: cinematic
                    ? "0 12px 40px rgba(0,0,0,0.35)"
                    : "none",
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* SUBTITLE BLOCK */}
        {subtitle && (
          <div
            style={{
              maxWidth: 920,
              fontSize: subtitleFontSize,
              lineHeight: 1.45,
              fontWeight: 500,
              fontFamily,
              color: subtitleColor,
              textAlign: align,
              opacity: interpolate(subtitleSpring, [0, 1], [0, 1]),
              transform: `translateY(${interpolate(subtitleSpring, [0, 1], [24, 0])}px)`,
              letterSpacing: "-0.02em",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};