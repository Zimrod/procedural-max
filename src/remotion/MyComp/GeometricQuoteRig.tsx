// src/remotion/MyComp/GeometricQuoteRig.tsx
"use client";

import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

type Props = {
  quoteText?: string;
  authorName?: string;
  authorTitle?: string;
  
  // 💡 NEW TYPOGRAPHY EXPOSURES
  quoteFontSize?: number;
  authorFontSize?: number;
  titleFontSize?: number;

  // System theme fallback injections
  textColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  durationInFrames?: number;
};

export const GeometricQuoteRig: React.FC<Props> = ({
  quoteText = "The transition to programmatic asset reporting instantly eliminated our internal committee bottlenecks. We saw a massive jump in capital allocation velocity. The transition to programmatic asset reporting instantly eliminated our internal committee bottlenecks. We saw a massive jump in capital allocation velocity.",
  authorName = "Tinashe Mubaiwa",
  authorTitle = "Managing Partner, Masvingo Capital",
  
  // Default Typography Scales
  quoteFontSize = 32,
  authorFontSize = 26,
  titleFontSize = 21,

  textColor = "#0f172a",
  accentColor = "#2563eb",
  backgroundColor = "transparent",
  fontFamily = "Ubuntu",
  durationInFrames = 90, // 💡 Default reference total layout frame duration window
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Typography Staggered Reveal via Word Tokenization
  const words = useMemo(() => quoteText.split(" "), [quoteText]);

  // 💡 DYNAMIC TIMING ENGINE
  // Translates reference anchors (based on a 90 frame timeline) into scaling layout percentages
  // Container Entry Delay: 0% -> 0
  // Quote Mark Entry Delay: ~11% -> (10 / 90) * durationInFrames
  // Word Animation Start Point: ~16.6% -> (15 / 90) * durationInFrames
  // Character Stagger Interval Gap: Calculated down smoothly to fit remaining room
  const {
    quoteMarkDelay,
    wordsStartDelay,
    wordStaggerStep,
  } = useMemo(() => {
    return {
      quoteMarkDelay: Math.round((10 / 90) * durationInFrames),
      wordsStartDelay: Math.round((15 / 90) * durationInFrames),
      wordStaggerStep: Math.max(1, Math.round((2 / 90) * durationInFrames)),
    };
  }, [durationInFrames]);

  // 1. Base Entry Spring
  const containerSpring = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.6, stiffness: 100 },
  });

  // 2. Vector Quote Mark Animation
  const quoteMarkSpring = spring({
    frame: frame - quoteMarkDelay,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 120 },
  });

  // Outer geometric frame layout box dimensions
  const boxWidth = width * 0.75;
  const boxHeight = height * 0.55;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        fontFamily,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* BACKGROUND ELEMENT: Giant Structural Quote Vector */}
      <div
        style={{
          position: "absolute",
          top: height * 0.12,
          left: width * 0.08,
          fontSize: "380px",
          fontWeight: 900,
          lineHeight: 1,
          color: accentColor,
          opacity: interpolate(quoteMarkSpring, [0, 1], [0, 0.07]),
          transform: `scale(${interpolate(quoteMarkSpring, [0, 1], [0.6, 1])}) rotate(${interpolate(quoteMarkSpring, [0, 1], [-15, 0])}deg)`,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        “
      </div>

      {/* PARAMETRIC GEOMETRIC OUTER BORDER FRAME */}
      <div
        style={{
          width: boxWidth,
          height: boxHeight,
          borderLeft: `4px solid ${accentColor}`,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "60px",
          paddingRight: "40px",
          opacity: containerSpring,
          transform: `translateX(${interpolate(containerSpring, [0, 1], [-40, 0])}px)`,
        }}
      >
        {/* Sliding geometric accent line at the top corner */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "4px",
            backgroundColor: accentColor,
            width: interpolate(containerSpring, [0, 1], [0, 120]),
          }}
        />

        {/* CORE TESTIMONIAL PARAGRAPH BLOCK */}
        <div
          style={{
            fontSize: `${quoteFontSize}px`, // 💡 Bound to dynamic configuration parameters
            fontWeight: 500,
            lineHeight: 1.45,
            color: textColor,
            textAlign: "left",
            letterSpacing: "-0.5px",
          }}
        >
          {words.map((word, index) => {
            const wordSpring = spring({
              frame: frame - wordsStartDelay - index * wordStaggerStep,
              fps,
              config: { damping: 12, stiffness: 140 },
            });

            return (
              <span
                key={index}
                style={{
                  display: "inline-block",
                  marginRight: "10px",
                  opacity: wordSpring,
                  transform: `translateY(${interpolate(wordSpring, [0, 1], [15, 0])}px)`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* 💡 SIMPLIFIED AUTHOR CREDENTIALS SIGNATURE LAYER */}
        <div
          style={{
            marginTop: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {/* Author Name */}
          <div
            style={{
              fontSize: `${authorFontSize}px`, // 💡 Parametric configuration mapping
              fontWeight: 700,
              color: textColor,
            }}
          >
            {authorName}
          </div>

          {/* Author Corporate Subtitle/Title */}
          <div
            style={{
              fontSize: `${titleFontSize}px`, // 💡 Parametric configuration mapping
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              color: accentColor,
            }}
          >
            {authorTitle}
          </div>
        </div>
      </div>
    </div>
  );
};