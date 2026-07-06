// src/remotion/MyComp/GridPrinciplesRig.tsx
"use client";

import React, { useMemo } from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";

type PrincipleItem = {
  title: string;
  description: string;
};

type Props = {
  sectionTitle?: string;
  principles?: PrincipleItem[];
  
  // Explicit typography prop shaping
  sectionFontSize?: number;
  cardTitleFontSize?: number;
  cardDescFontSize?: number;

  // System theme fallback injections
  textColor?: string;
  mutedTextColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontFamily?: string;

  // SINGLE TIMING PROP: Math engines now anchor perfectly to this value
  durationInFrames?: number;
};

const DEFAULT_PRINCIPLES: PrincipleItem[] = [
  { title: "01 / SAFETY FIRST", description: "Zero-compromise operational threshold across all site extractions." },
  { title: "02 / CAPITAL VELOCITY", description: "Programmatic deployment loops designed to minimize committee friction." },
  { title: "03 / ABSOLUTE AUDIT", description: "100% transparent blockchain telemetry ledger mapping for asset verification." },
  { title: "04 / ESG COMPLIANCE", description: "Exceeding regional environmental standards via autonomous telemetry." },
];

export const GridPrinciplesRig: React.FC<Props> = ({
  sectionTitle = "CORE OPERATIONAL PRINCIPLES",
  principles = DEFAULT_PRINCIPLES,
  
  sectionFontSize = 24,
  cardTitleFontSize = 30,
  cardDescFontSize = 25,

  textColor = "#0f172a",
  mutedTextColor = "#64748b",
  accentColor = "#2563eb",
  surfaceColor = "rgba(255, 255, 255, 0.65)", 
  backgroundColor = "transparent",
  borderColor = "rgba(226, 232, 240, 0.8)",
  fontFamily = "tahoma",
  durationInFrames = 60, // Bound directly to sequence timings below
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // 💡 FIXED TIMING ENGINE
  // Hardcoded 120 denominators stripped out. Scales explicitly with durationInFrames.
  const {
    headerStartDelay,
    gridStartDelay,
    cardStaggerStep,
  } = useMemo(() => {
    return {
      headerStartDelay: 0,
      gridStartDelay: Math.round((10 / 90) * durationInFrames),
      cardStaggerStep: Math.max(1, Math.round((5 / 90) * durationInFrames)),
    };
  }, [durationInFrames]);

  // Header Entrance Animation Driver
  const headerSpring = spring({
    frame: frame - headerStartDelay,
    fps,
    config: { damping: 16, mass: 0.5, stiffness: 120 },
  });

  const cardCount = principles.length;
  const columns = cardCount === 3 ? "repeat(3, 1fr)" : "repeat(2, 1fr)";

  const animationDuration = durationInFrames * 1;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor,
        fontFamily,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {/* 💡 FIXED BACKGROUND BLUR: Typo 50%% corrected to 50% */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`,
          top: "10%",
          right: "-5%",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* DECK HEADER BLOCK */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          marginBottom: "60px",
          textAlign: "left",
          opacity: headerSpring,
          transform: `translateY(${interpolate(headerSpring, [0, 1], [-25, 0])}px)`,
        }}
      >
        <div
          style={{
            fontSize: `${sectionFontSize}px`,
            fontWeight: 800,
            color: accentColor,
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          {sectionTitle}
        </div>
        <div
          style={{
            width: interpolate(headerSpring, [0, 1], [0, 80]),
            height: "4px",
            backgroundColor: accentColor,
            borderRadius: "999px",
            boxShadow: `0 0 20px ${accentColor}`,
          }}
        />
      </div>

      {/* SYMMETRICAL MATRIX CONTAINER CARD GRID */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          display: "grid",
          gridTemplateColumns: columns,
          gap: "32px",
          boxSizing: "border-box",
        }}
      >
        {principles.slice(0, 6).map((item, index) => {
          const cardDelay = gridStartDelay + index * cardStaggerStep;
          
          const cardSpring = spring({
            fps,
            frame: frame - cardDelay,
            config: {
              damping: 18,
              stiffness: 110,
            },
            durationInFrames: animationDuration,
          });

          const isLeftSide = index % 2 === 0;
          const slideX = interpolate(cardSpring, [0, 1], [isLeftSide ? -30 : 30, 0]);
          const slideY = interpolate(cardSpring, [0, 1], [20, 0]);

          return (
            <div
              key={index}
              style={{
                backgroundColor: surfaceColor,
                border: `1px solid ${borderColor}`,
                borderRadius: "24px",
                padding: "40px",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-start",
                textAlign: "left",
                position: "relative",
                overflow: "hidden",
                backdropFilter: "blur(16px)",
                boxShadow: "0 20px 40px -15px rgba(0,0,0,0.05)",
                
                opacity: cardSpring,
                transform: `scale(${interpolate(cardSpring, [0, 1], [0.93, 1])}) translateX(${slideX}px) translateY(${slideY}px)`,
                transformOrigin: "center center",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "4px",
                  width: interpolate(cardSpring, [0, 1], [0, 48]),
                  backgroundColor: accentColor,
                  borderRadius: "0 0 4px 0",
                }}
              />

              <h3
                style={{
                  fontSize: `${cardTitleFontSize}px`,
                  fontWeight: 800,
                  color: textColor,
                  letterSpacing: "0.5px",
                  margin: "0 0 16px 0",
                  textTransform: "uppercase",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  fontSize: `${cardDescFontSize}px`,
                  fontWeight: 500,
                  lineHeight: 1.6,
                  color: mutedTextColor,
                  margin: 0,
                }}
              >
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};