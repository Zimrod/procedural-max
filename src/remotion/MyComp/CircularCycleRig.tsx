// src/remotion/MyComp/CircularCycleRig.tsx

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";

export type ProcessStep = {
  label: string;
  value?: string;
  icon?: string;
};

type Props = {
  steps?: ProcessStep[];
  title?: string;
  cycleDurationSeconds?: number;
  radius?: number; // Base radius will be scaled up dynamically
  accentColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

export const CircularCycleRig: React.FC<Props> = ({
  steps = [
    { label: "Data Capture", value: "Phase 01" },
    { label: "Model Training", value: "Phase 02" },
    { label: "Parametric Render", value: "Phase 03" },
    { label: "Asset Export", value: "Phase 04" },
    { label: "Cloud Deploy", value: "Phase 05" },
  ],
  title = "AUTOMATED PIPELINE CYCLE",
  cycleDurationSeconds = 6,
  radius = 270, // SCALED UP 50% (From 180 to 270)
  accentColor = "#ff7b00",
  inactiveColor = "#2b303b",
  backgroundColor = "#0b0d10",
  fontFamily = "Ubuntu, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const totalFrames = cycleDurationSeconds * fps;
  const cx = width / 2;
  const cy = height / 2;

  // =========================================================
  // ANIMATION TIMELINE DRIVERS
  // =========================================================
  const rawProgress = (frame % totalFrames) / totalFrames;

  const globalProgress = interpolate(rawProgress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.25, 1, 0.5, 1),
  });

  const nodeCount = steps.length;
  const anglePerStep = (2 * Math.PI) / nodeCount;

  const nodePositions = useMemo(() => {
    return steps.map((step, idx) => {
      const angle = idx * anglePerStep - Math.PI / 2;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        angleDeg: (angle * 180) / Math.PI,
      };
    });
  }, [steps, cx, cy, radius, anglePerStep]);

  const activeIndex = Math.floor(rawProgress * nodeCount) % nodeCount;

  // =========================================================
  // TRACK ELEMENT PARAMETRICS
  // =========================================================
  const trackPathD = `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`;
  const circumference = 2 * Math.PI * radius;
  const glowDashOffset = circumference - globalProgress * circumference;

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily, overflow: "hidden" }}>
      {/* BACKGROUND GRAPH GRID */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          backgroundPosition: "center center",
          opacity: 0.6,
        }}
      />

      {/* TOP HEADER CATEGORY LABEL */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255, 255, 255, 0.4)",
          fontSize: 24, // SCALED UP 50% (From 16 to 24)
          fontWeight: 700,
          letterSpacing: "0.4em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      {/* RENDER LAYOUT CANVAS */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* BACKGROUND TRACK CONNECTIVE RING */}
        <path
          d={trackPathD}
          fill="none"
          stroke={inactiveColor}
          strokeWidth="6" // SCALED UP 50% (From 4 to 6)
          strokeOpacity="0.4"
        />

        {/* HIGH-INTENSITY DATA PACKET GLOW TRACK */}
        <path
          d={trackPathD}
          fill="none"
          stroke={accentColor}
          strokeWidth="8" // SCALED UP 50% (From 5 to 8)
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={glowDashOffset}
          style={{
            filter: `drop-shadow(0px 0px 12px ${accentColor})`, // SCALED UP 50%
          }}
        />

        {/* COMPONENT STEP NODE MATRIX */}
        {nodePositions.map((node, idx) => {
          const isNodeActive = idx === activeIndex;
          const nodeScale = isNodeActive ? 1.25 : 1.0;

          return (
            <g key={idx}>
              {/* Active Outer Glow Halo Ring */}
              {isNodeActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="36" // SCALED UP 50% (From 24 to 36)
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="3" // SCALED UP 50% (From 2 to 3)
                  opacity={0.4}
                  style={{
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transform: `scale(${interpolate(frame % 15, [0, 15], [0.9, 1.4])})`,
                  }}
                />
              )}

              {/* Core Step Anchor Junction Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r="21" // SCALED UP 50% (From 14 to 21)
                fill={isNodeActive ? accentColor : "#161b22"}
                stroke={isNodeActive ? "#ffffff" : inactiveColor}
                strokeWidth={isNodeActive ? 4.5 : 3} // SCALED UP 50%
                style={{
                  transformOrigin: `${node.x}px ${node.y}px`,
                  transform: `scale(${nodeScale})`,
                  transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />

              {/* Numeric Indicator Inner Badge */}
              <text
                x={node.x}
                y={node.y + 6} // Shift adjusted for larger text centering
                textAnchor="middle"
                fill={isNodeActive ? "#000000" : "rgba(255,255,255,0.6)"}
                fontSize="16" // SCALED UP 50% (From 11 to 16)
                fontWeight="800"
                style={{ pointerEvents: "none" }}
              >
                {idx + 1}
              </text>

              {/* PERIPHERAL RUNTIME CALLOUT CARDS */}
              <g
                transform={`translate(${node.x}, ${node.y})`}
                style={{
                  opacity: isNodeActive ? 1 : 0.35,
                  transition: "opacity 0.2s ease",
                }}
              >
                <foreignObject
                  x={node.x > cx ? 35 : -295} // Width offsets and margins adjusted 50%
                  y={-50}
                  width="260" // SCALED UP 50% (From 170 to 260)
                  height="100" // SCALED UP 50% (From 70 to 100)
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: node.x > cx ? "flex-start" : "flex-end",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 18, // SCALED UP 50% (From 12 to 18)
                        fontWeight: 700,
                        color: accentColor,
                        letterSpacing: "0.05em",
                        marginBottom: 4,
                      }}
                    >
                      {steps[idx].value ?? `STEP 0${idx + 1}`}
                    </span>
                    <span
                      style={{
                        fontSize: 22, // SCALED UP 50% (From 15 to 22)
                        fontWeight: 800,
                        color: isNodeActive ? "#ffffff" : "#9ca3af",
                        textAlign: node.x > cx ? "left" : "right",
                        lineHeight: 1.2,
                      }}
                    >
                      {steps[idx].label}
                    </span>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}
      </svg>

      {/* CORE HUB INTERIOR METRIC COMPONENT */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: radius * 1.3, // Automatically grows as the radius prop grows
          height: radius * 1.3,
          borderRadius: "50%",
          backgroundColor: "#12161f",
          border: `2px solid ${inactiveColor}`, // SCALED UP 50%
          boxShadow: "inset 0 6px 30px rgba(0, 0, 0, 0.6), 0 30px 75px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          padding: 30, // SCALED UP 50%
        }}
      >
        <span
          style={{
            fontSize: 18, // SCALED UP 50% (From 13 to 18)
            fontWeight: 700,
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Active Status
        </span>
        <span
          style={{
            fontSize: 38, // SCALED UP 50% (From 28 to 38)
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          {steps[activeIndex].label}
        </span>
        <div
          style={{
            marginTop: 18, // SCALED UP 50%
            backgroundColor: "rgba(255, 123, 0, 0.1)",
            border: `1.5px solid ${accentColor}`, // SCALED UP 50%
            padding: "4px 15px", // SCALED UP 50%
            borderRadius: 30,
            fontSize: 16, // SCALED UP 50% (From 11 to 16)
            fontWeight: 800,
            color: accentColor,
            letterSpacing: "0.05em",
          }}
        >
          {((activeIndex + 1) / nodeCount * 100).toFixed(0)}% COMPLETE
        </div>
      </div>
    </AbsoluteFill>
  );
};