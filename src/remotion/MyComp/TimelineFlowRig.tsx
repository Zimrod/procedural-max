// src/remotion/MyComp/TimelineFlowRig.tsx

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
  Easing,
} from "remotion";

export type TimelineMilestone = {
  timeLabel: string; // e.g., "Q1", "09:00 AM", "Step 01"
  title: string;       // e.g., "Ingestion"
  description: string; // e.g., "Processing raw CSV entries"
};

type Props = {
  milestones?: TimelineMilestone[];
  categoryTitle?: string;
  
  // Timeline Animation Configuration
  revealDurationSeconds?: number;
  
  // Custom Styling Options
  accentColor?: string;
  inactiveColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
};

export const TimelineFlowRig: React.FC<Props> = ({
  milestones = [
    { timeLabel: "Phase 01", title: "API Ingestion", description: "Parsing webhooks" },
    { timeLabel: "Phase 02", title: "Validation", description: "Schema strict cleaning" },
    { timeLabel: "Phase 03", title: "DB Sync", description: "Writing immutable blocks" },
    { timeLabel: "Phase 04", title: "Distribution", description: "Dispatching client alerts" },
  ],
  categoryTitle = "SYSTEM WORKFLOW TIMELINE",
  revealDurationSeconds = 4.5,
  accentColor = "#ff7b00", // Signature accent branding color
  inactiveColor = "#232936",
  backgroundColor = "#0b0d10",
  fontFamily = "Ubuntu, -apple-system, sans-serif",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const totalFrames = revealDurationSeconds * fps;
  
  // Core layout padding metrics
  const paddingX = 140;
  const timelineY = height / 2 + 20;
  const availableWidth = width - paddingX * 2;
  const nodeCount = milestones.length;

  // =========================================================
  // PARAMETRIC MASTER PROGRESS DRIVER
  // =========================================================
  const timelineDriver = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 45 },
    durationInFrames: totalFrames,
  });

  // Calculate coordinates across the horizontal timeline axis
  const nodePositions = useMemo(() => {
    return milestones.map((_, idx) => {
      const stepSegment = nodeCount > 1 ? nodeCount - 1 : 1;
      const x = paddingX + (idx / stepSegment) * availableWidth;
      return { x, y: timelineY };
    });
  }, [milestones, availableWidth, paddingX, timelineY, nodeCount]);

  return (
    <AbsoluteFill style={{ backgroundColor, fontFamily, overflow: "hidden" }}>
      {/* GRAPH TECH GRID ACCENT */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          backgroundPosition: "center center",
          opacity: 0.7,
        }}
      />

      {/* OVERHEAD CATEGORY LABEL */}
      <div
        style={{
          position: "absolute",
          top: 70,
          left: paddingX,
          color: "rgba(255, 255, 255, 0.35)",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "0.35em",
          textTransform: "uppercase",
        }}
      >
        {categoryTitle}
      </div>

      {/* MAIN TRACK CONTAINER */}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* BASE BACKGROUND HOUSING RAIL */}
        <line
          x1={nodePositions[0]?.x ?? paddingX}
          y1={timelineY}
          x2={nodePositions[nodeCount - 1]?.x ?? width - paddingX}
          y2={timelineY}
          stroke={inactiveColor}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={0.6}
        />

        {/* HIGH-INTENSITY PROGRESSIVE GLOW PIPELINE TRACK */}
        {nodeCount > 0 && (
          <line
            x1={nodePositions[0].x}
            y1={timelineY}
            x2={interpolate(
              timelineDriver,
              [0, 1],
              [nodePositions[0].x, nodePositions[nodeCount - 1].x]
            )}
            y2={timelineY}
            stroke={accentColor}
            strokeWidth="8"
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0px 0px 10px ${accentColor})`,
            }}
          />
        )}

        {/* SEQUENTIAL NODE JUNCTIONS MAP */}
        {nodePositions.map((node, idx) => {
          // Normalize the absolute entry point threshold along the track length
          const activationThreshold = idx / (nodeCount - 1 || 1);
          
          // Determine if the leading glow track has reached this point yet
          const isReached = timelineDriver >= activationThreshold;

          // Individualized bounce tracking springs for staggered pop-ins
          const localTriggerFrame = frame - (idx * (totalFrames / nodeCount) * 0.75);
          const popSpring = spring({
            frame: localTriggerFrame,
            fps,
            config: { damping: 12, stiffness: 110 },
            durationInFrames: 24,
          });

          const nodeScale = interpolate(popSpring, [0, 1], [0, 1], {
            extrapolateRight: "clamp",
          });

          const contentOpacity = interpolate(popSpring, [0.3, 1], [0, 1], {
            extrapolateRight: "clamp",
          });
          
          const textShiftY = interpolate(popSpring, [0, 1], [20, 0]);

          return (
            <g key={idx} style={{ transform: `scale(${nodeScale})`, transformOrigin: `${node.x}px ${node.y}px` }}>
              
              {/* Pulsing Active Node Beacon Halo */}
              {isReached && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="34"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  opacity={0.35}
                  style={{
                    transformOrigin: `${node.x}px ${node.y}px`,
                    transform: `scale(${interpolate(frame % 20, [0, 20], [0.8, 1.35])})`,
                  }}
                />
              )}

              {/* Core Solid Ring Intersection Hub */}
              <circle
                cx={node.x}
                cy={node.y}
                r="18"
                fill={isReached ? accentColor : "#161b22"}
                stroke={isReached ? "#ffffff" : inactiveColor}
                strokeWidth={isReached ? 4 : 3}
                style={{
                  boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                }}
              />

              {/* Inner Index Matrix Marker Badge */}
              <text
                x={node.x}
                y={node.y + 5}
                textAnchor="middle"
                fill={isReached ? "#000000" : "rgba(255,255,255,0.4)"}
                fontSize="15"
                fontWeight="900"
                style={{ pointerEvents: "none" }}
              >
                {idx + 1}
              </text>

              {/* CALLOUT DATA META OVERLAYS */}
              <g style={{ opacity: contentOpacity }}>
                <foreignObject
                  x={node.x - 125}
                  // Alternate card layout orientation vertically (Up vs Down) to maximize spacing safety
                  y={idx % 2 === 0 ? timelineY - 180 + textShiftY : timelineY + 40 - textShiftY}
                  width="250"
                  height="130"
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    {/* Phase Time Pill Badge */}
                    <span
                      style={{
                        backgroundColor: isReached ? "rgba(255, 123, 0, 0.12)" : "rgba(255,255,255,0.03)",
                        border: `1.5px solid ${isReached ? accentColor : "rgba(255,255,255,0.08)"}`,
                        padding: "4px 14px",
                        borderRadius: 20,
                        fontSize: 14,
                        fontWeight: 800,
                        color: isReached ? accentColor : "rgba(255,255,255,0.4)",
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        marginBottom: 10,
                      }}
                    >
                      {milestones[idx].timeLabel}
                    </span>

                    {/* Headline Label */}
                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: isReached ? "#ffffff" : "#6b7280",
                        marginBottom: 6,
                        lineHeight: 1.1,
                      }}
                    >
                      {milestones[idx].title}
                    </span>

                    {/* Explanatory Paragraph Body */}
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 500,
                        color: "#8c94a4",
                        lineHeight: 1.3,
                        padding: "0 10px",
                      }}
                    >
                      {milestones[idx].description}
                    </span>
                  </div>
                </foreignObject>
              </g>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};